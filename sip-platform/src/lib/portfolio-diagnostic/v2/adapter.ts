/**
 * v2 ADAPTER — bridges the scoring route to the Verdict Engine v2.
 *
 * Given a diagnostic's holdings (already matched to amfi_code by the route) and
 * the client's risk-intake, it:
 *   1. loads the research-stats universe (pd_fund_universe_latest) for peer medians
 *   2. maps each holding to its FundStats (Sharpe/Sortino/returns/AUM/category)
 *   3. runs the risk model once + synthesizeVerdict per holding
 *   4. returns persistable results + the legacy-enum mapping for report back-compat
 *
 * Rolling returns: ships with the point-to-point proxy the engine already falls
 * back to (verdicts proven identical to Ram's on two clients). On-demand MFAPI
 * rolling returns is a fast-follow that only sharpens Gate 1.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { runRiskModel, ClientRiskInputs, RiskModelOutput } from './risk-model';
import {
  synthesizeVerdict, computePeerMedians, FundStats, FinalAction, Verdict,
} from './fund-engine';
import { fetchRolling3yBatch } from './rolling-returns';
import { detectConsolidation, type ConsolidationResult } from './overlap-engine';
import { loadBuyList, matchBuyList } from './buylist';
import { subCategoryKey } from './fund-engine';
import { estimateExitTax, type ExitTaxSummary } from './tax-engine';

const SELL_ACTIONS = new Set<FinalAction>(['SWITCH_BETTER', 'EXIT_UNSUITABLE', 'SWITCH_MODE', 'REDUCE', 'REDEEM_TINY']);

export interface V2HoldingInput {
  holdingId: number;
  fundName: string;
  amfiCode: string | null;
  categoryHint: string | null;
  currentValueInr: number;
  investedInr: number;
  xirrPct: number | null;
  fundOption: 'growth' | 'idcw' | null;
  holderHasOtherIncome?: boolean;
  holdingPeriodMonths?: number | null;
}

export interface V2HoldingResult {
  holdingId: number;
  verdict: Verdict;
  fundStats: FundStats | null;
  legacyVerdict: 'STAR' | 'KEEP' | 'WATCH' | 'SWAP' | 'LIQUIDATE';
  rolling3yPct: number | null;
}

export interface V2RunResult {
  riskModel: RiskModelOutput;
  posture: 'preservation' | 'balanced' | 'growth';
  holdings: V2HoldingResult[];
  consolidation: ConsolidationResult;   // Pillar 6 — same-sub-category duplicate detection
  taxSummary: ExitTaxSummary;           // India tax-aware exit estimate
}

// v2 action → legacy pd_verdict enum (keeps the 8 report generators working)
const LEGACY: Record<FinalAction, V2HoldingResult['legacyVerdict']> = {
  STAR_KEEP: 'STAR', KEEP: 'KEEP', KEEP_MONITOR: 'WATCH', HOLD_PARTIAL: 'KEEP',
  SWITCH_BETTER: 'SWAP', EXIT_UNSUITABLE: 'SWAP', SWITCH_MODE: 'KEEP',
  REDUCE: 'WATCH', REDEEM_TINY: 'LIQUIDATE',
};

/**
 * Sanitise the feed's TER into a clean percent for the engine.
 *
 * The research feed stores TER as a FRACTION (0.0229 = 2.29%), but FundStats.terPct
 * is a PERCENT (the engine's checklist prints `${terPct}%` and the peer-median is in
 * percent). Two corrections:
 *  1) fraction → percent (×100 when the raw value is clearly a fraction, <0.1);
 *  2) drop implausible vendor values. ~85 funds in the feed carry a garbage TER that
 *     exceeds SEBI's ~2.25% equity cap (e.g. Nippon Large Cap 3.51%, Sundaram L&M
 *     9.43%, HDFC Arbitrage 7.31%). Trusting them would distort the peer-median and
 *     wrongly flag clean funds, so anything outside a plausible band is treated as
 *     missing (NA) rather than a real expense ratio.
 */
function sanitizeTerPct(raw: number | null | undefined): number | null {
  if (raw == null) return null;
  let v = Number(raw);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v < 0.1) v = v * 100;          // feed fraction (0.0229) → percent (2.29)
  if (v < 0.05 || v > 3.0) return null; // implausible for a regular-plan equity TER → NA
  return v;
}

/**
 * Sanitise the feed's volatility (annualised SD, stored as a FRACTION: 0.186 = 18.6%).
 * Mirrors sanitizeTerPct. The feed carries garbage: exact-zero rows (gilt/index →
 * would yield a false downside='LOW') and absurd outliers (Shriram Overnight 51.09,
 * silver ETFs 0.78-1.03). A real fund's annualised SD sits ~1%-40% (thematic up to
 * ~50%); anything ≤0 or >60% is vendor garbage → NA so it can't distort the
 * peer-median or the forward-downside flag.
 */
function sanitizeVolatilityPct(raw: number | null | undefined): number | null {
  if (raw == null) return null;
  const v = Number(raw);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v > 0.6) return null;
  return v;
}

async function loadUniverse(sb: SupabaseClient): Promise<{ universe: FundStats[]; byAmfi: Map<string, FundStats> }> {
  const universe: FundStats[] = [];
  const byAmfi = new Map<string, FundStats>();
  for (let from = 0; from < 8000; from += 1000) {
    const { data } = await sb.from('pd_fund_universe_latest')
      .select('amfi_code, scheme_name, external_category, riskometer, returns_3y, returns_5y, returns_10y, sharpe, sortino, volatility, aum_inr_cr, ter')
      .not('returns_5y', 'is', null).range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const fs: FundStats = {
        schemeName: r.scheme_name, category: r.external_category, riskometer: r.riskometer,
        rolling3yPct: null, return3yPct: r.returns_3y, return5yPct: r.returns_5y, return10yPct: r.returns_10y,
        sharpe: r.sharpe, sortino: r.sortino, volatilityPct: sanitizeVolatilityPct(r.volatility), aumInrCr: r.aum_inr_cr, terPct: sanitizeTerPct(r.ter),
      };
      universe.push(fs);
      if (r.amfi_code) byAmfi.set(r.amfi_code as string, fs);
    }
    if (data.length < 1000) break;
  }
  return { universe, byAmfi };
}

function matchStats(h: V2HoldingInput, byAmfi: Map<string, FundStats>, universe: FundStats[]): FundStats | null {
  if (h.amfiCode && byAmfi.has(h.amfiCode)) return byAmfi.get(h.amfiCode)!;
  // fallback fuzzy by normalised name (Regular plans only — what we research)
  const norm = (s: string) => s.toLowerCase().replace(/regular|plan|growth|option|fund|-|\s+/g, ' ').replace(/\s+/g, ' ').trim();
  const target = norm(h.fundName);
  let best: FundStats | null = null, bestScore = 0;
  for (const u of universe) {
    if (/direct/i.test(u.schemeName)) continue;
    const us = norm(u.schemeName);
    const a = new Set(target.split(' ')), b = new Set(us.split(' '));
    const inter = [...a].filter(x => b.has(x)).length;
    const jac = inter / (a.size + b.size - inter);
    if (jac > bestScore) { bestScore = jac; best = u; }
  }
  return bestScore >= 0.5 ? best : null;
}

export async function scoreDiagnosticV2(
  sb: SupabaseClient, holdings: V2HoldingInput[], risk: ClientRiskInputs,
): Promise<V2RunResult> {
  const rm = runRiskModel(risk);
  const posture: V2RunResult['posture'] = rm.toleranceScore <= 35 ? 'preservation' : rm.toleranceScore <= 55 ? 'balanced' : 'growth';
  const { universe, byAmfi } = await loadUniverse(sb);
  // Approved Buy-List — so consolidation can prefer the committee-shortlisted fund
  // as the "keeper" within a duplicate group (a tiebreak, never overriding quality).
  const buyList = await loadBuyList(sb);

  // On-demand 3Y ROLLING returns for the held funds (methodology #1 rule).
  // Bounded to the portfolio's funds; cached; falls back to point-to-point on miss.
  let rolling = new Map<string, number>();
  try { rolling = await fetchRolling3yBatch(holdings.map(h => h.amfiCode)); } catch { /* fall back to point-to-point */ }

  const results: V2HoldingResult[] = holdings.map(h => {
    const baseFs = matchStats(h, byAmfi, universe)
      // if not found, synthesize a minimal FundStats from the holding's category hint
      ?? (h.categoryHint ? { schemeName: h.fundName, category: h.categoryHint, riskometer: null, rolling3yPct: null, return3yPct: null, return5yPct: null, return10yPct: null, sharpe: null, sortino: null, volatilityPct: null, aumInrCr: null, terPct: null } as FundStats : null);
    if (!baseFs) {
      // truly unknown fund — neutral WATCH so it surfaces for manual review
      return { holdingId: h.holdingId, verdict: null as unknown as Verdict, fundStats: null, legacyVerdict: 'WATCH', rolling3yPct: null };
    }
    // inject the true 3Y rolling return (methodology #1 rule); null → engine uses point-to-point
    const roll = h.amfiCode ? (rolling.get(h.amfiCode) ?? null) : null;
    const fs: FundStats = { ...baseFs, rolling3yPct: roll };
    const peers = computePeerMedians(universe, fs.category);
    const v = synthesizeVerdict(
      { schemeName: h.fundName, currentValueInr: h.currentValueInr, investedInr: h.investedInr, xirrPct: h.xirrPct, fundOption: h.fundOption },
      fs, peers,
      { withinEquityCeiling: rm.withinEquityCeiling, clientPosture: posture, holderHasOtherIncome: h.holderHasOtherIncome },
    );
    return { holdingId: h.holdingId, verdict: v, fundStats: fs, legacyVerdict: LEGACY[v.action], rolling3yPct: roll };
  });

  // Pillar 6 — same-sub-category duplicate detection + keep-the-better consolidation.
  // Uses the MATCHED research-universe category (not the raw upload) for correct grouping.
  const consolidation = detectConsolidation(
    results.map((r, i) => ({
      holdingId: r.holdingId,
      fundName: holdings[i].fundName,
      category: r.fundStats?.category ?? holdings[i].categoryHint ?? null,
      currentValueInr: holdings[i].currentValueInr,
      quality: r.verdict?.quality ?? null,
      suitability: r.verdict?.suitability ?? null,
      sharpe: r.fundStats?.sharpe ?? null,
      return5yPct: r.fundStats?.return5yPct ?? null,
      onBuyList: !!matchBuyList(buyList, holdings[i].amfiCode, holdings[i].fundName),
    })).filter((c) => (c.currentValueInr || 0) > 0),
  );

  // India tax-aware exit estimate — tax cost of acting on the SELL recommendations.
  const taxSummary = estimateExitTax(
    results.map((r, i) => ({
      holdingId: r.holdingId,
      fundName: holdings[i].fundName,
      subKey: subCategoryKey(r.fundStats?.category ?? holdings[i].categoryHint ?? null),
      investedInr: holdings[i].investedInr,
      currentValueInr: holdings[i].currentValueInr,
      holdingPeriodMonths: holdings[i].holdingPeriodMonths ?? null,
      recommendedExit: !!r.verdict && SELL_ACTIONS.has(r.verdict.action),
    })),
  );

  return { riskModel: rm, posture, holdings: results, consolidation, taxSummary };
}

/** Build ClientRiskInputs from the run's persisted rp_* columns (with safe defaults). */
export function riskInputsFromRun(run: Record<string, unknown>, currentInvestableInr: number): ClientRiskInputs {
  return {
    primaryAge: Number(run.rp_primary_age) || 45,
    lifeStage: (run.rp_life_stage as ClientRiskInputs['lifeStage']) || 'accumulation',
    monthlyGuaranteedIncomeInr: Number(run.rp_monthly_income_inr) || 0,
    monthlyEssentialExpenseInr: Number(run.rp_monthly_expense_inr) || 0,
    livingDependsOnThisPortfolio: run.rp_living_depends_on_this == null ? true : Boolean(run.rp_living_depends_on_this),
    liquidNetWorthBufferInr: Number(run.rp_net_worth_buffer_inr) || 0,
    longestHorizonYears: Number(run.rp_longest_horizon_years) || 10,
    questionnaireScore0to100: run.rp_questionnaire_score != null ? Number(run.rp_questionnaire_score) : null,
    statedPriority: (run.rp_stated_priority as ClientRiskInputs['statedPriority']) || 'balanced',
    pastDrawdownBehaviour: (run.rp_past_drawdown_behaviour as ClientRiskInputs['pastDrawdownBehaviour']) || 'unknown',
    // REQUIRED-RETURN leg: wired from the intake's optional goal corpus. When a
    // target corpus is given but years-to-goal is blank, fall back to the longest
    // captured horizon so the third dimension can still bind.
    targetCorpusInr: Number(run.rp_target_corpus_inr) > 0 ? Number(run.rp_target_corpus_inr) : null,
    currentInvestableInr,
    yearsToGoal: Number(run.rp_years_to_goal) > 0
      ? Number(run.rp_years_to_goal)
      : (Number(run.rp_target_corpus_inr) > 0 ? (Number(run.rp_longest_horizon_years) || null) : null),
  };
}
