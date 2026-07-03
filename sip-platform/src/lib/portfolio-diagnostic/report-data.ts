/**
 * Portfolio Diagnostic — Report Data Assembler
 *
 * Fetches and shapes all data needed for the client-facing reports:
 *   - Full Portfolio Review (Tier A/B/C/D verdicts + summary)
 *   - Action Sheet (swaps, liquidations, tax estimate, sign-off)
 *
 * Modeled on the Rohit Jain Family report (22 May 2026) — the
 * reference output Ram wants every diagnostic to match.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { loadBuyList, matchBuyList, bestOpenReplacement } from '@/lib/portfolio-diagnostic/v2/buylist';
import { subCategoryKey, categoryRiskTier } from '@/lib/portfolio-diagnostic/v2/fund-engine';
import { runGoalMonteCarlo, type GoalMcResult } from '@/lib/portfolio-diagnostic/v2/monte-carlo';
import { computePortfolioHealthScore, type PortfolioHealthScore } from '@/lib/portfolio-diagnostic/v2/portfolio-health-score';
import { buildAllocationComparison, type AllocationComparison } from '@/lib/portfolio-diagnostic/v2/allocation-comparison';
import { computeBacktest, type BacktestResult } from '@/lib/portfolio-diagnostic/v2/backtest';
import { getNavHistory } from '@/lib/services/mfapi';
import { createSupabaseHoldingsProvider } from '@/lib/portfolio-diagnostic/holdings/provider';
import { aggregateFamilyStockOverlap, type FamilyStockOverlap } from '@/lib/portfolio-diagnostic/holdings/overlap-aggregator';

/**
 * Render-time rationale cleaner. The verdict engine used to concatenate
 * overlapping clauses, so runs scored before the Jun-2026 fix carry the same
 * instruction twice (e.g. "…trim the rest into the band Keep a measured
 * allocation, trim the rest into the client's risk band."). This collapses
 * the two known duplications so EXISTING reports render tight without a
 * re-score. It is precise (targets the exact engine artefacts) and idempotent
 * — a no-op on rationale already produced by the fixed engine.
 */
export function tidyRationale(s: string | null): string | null {
  if (!s) return s;
  let t = s;
  // (1) HOLD_PARTIAL: drop the second "trim the rest…" sentence — the suitability
  //     note ("…hold a partial, trim the rest into the band") already says it.
  t = t.replace(/\s*Keep a measured allocation, trim the rest into the client'?s risk band\.?/gi, '.');
  // (2) AUM hold-only: drop the trailing forward-note echo when the hold-only
  //     sentence already explained the add-ceiling.
  if (/Hold-only:|past our add-ceiling/i.test(t)) {
    t = t.replace(/\s*Fund size\s*₹?[\d,]+\s*Cr is past the add-ceiling[^.]*?agility\)?\.?\s*$/i, '');
  }
  return t.replace(/\s{2,}/g, ' ').replace(/\s+([.,;])/g, '$1').replace(/\.\.+/g, '.').trim();
}

export type Verdict = 'STAR' | 'KEEP' | 'WATCH' | 'SWAP' | 'LIQUIDATE';

export interface ChecklistItem { gate: string; status: string; source?: string; detail?: string }

export interface ReportHolding {
  id: number;
  entityName: string;
  fundName: string;
  amfiCode?: string;
  category: string | null;
  investedInr: number;
  currentValueInr: number;
  unrealisedGainInr: number;
  // Folio-level detail captured at CAS-parse time (pd_diagnostic_holdings.folio_number/
  // units) — surfaced on the action-sheet REDEEM table so it reads as a precise
  // transaction instruction, not just a fund-level amount. Null on older runs
  // parsed before this was wired through, or when the source format lacked it.
  folioNumber?: string | null;
  units?: number | null;
  xirrPct: number | null;
  cagr3y: number | null;
  cagr5y: number | null;
  holdingPeriodMonths: number | null;
  // Scheme trailing returns (point-to-point CAGR, % p.a.) from the daily-refreshed
  // pd_fund_universe_latest view — shown on the client deck so the investor sees
  // how the FUND has performed over 1/3/5 years (distinct from their own XIRR).
  fundRet1yPct?: number | null;
  fundRet3yPct?: number | null;
  fundRet5yPct?: number | null;
  verdict: Verdict;
  rationale: string | null;
  // v2 precise action — distinguishes EXIT_UNSUITABLE vs SWITCH_BETTER, which the
  // legacy 5-value verdict enum collapses to a single "SWAP".
  v2Action?: string | null;
  v2ActionLabel?: string | null;
  preferredReplacementFundName?: string | null;
  preferredReplacementAmfiCode?: string | null;
  // Trustner 12-Point Fund Selection Checklist (persisted as v2_quality_gates)
  checklist?: ChecklistItem[] | null;
  // Approved Buy-List intelligence (committee shortlist) — preferred over the
  // legacy preferred-funds table.
  onBuyList?: boolean;
  buyListStatus?: string | null;             // APPROVED_OPEN | APPROVED_HOLD_ONLY | WATCH
  buyListReplacementFundName?: string | null;
  buyListReplacementAmfiCode?: string | null;
}

export interface ReportData {
  // Document identity
  diagnosticId: number;
  documentId: string;
  reportDate: string;          // "22 May 2026"
  reportDateIso: string;       // "2026-05-22"

  // Family
  familyId: number;
  familyName: string;
  entitiesCovered: string[];   // ["ANU JAIN", "NEEL KAMAL", ...]

  // KPIs
  totalInvestedInr: number;
  currentValueInr: number;
  totalGainInr: number;
  familyXirrPct: number | null;
  numHoldings: number;
  numUniqueFunds: number;
  numEntities: number;
  numAmcs: number;

  // Tiered holdings (sorted by 3Y CAGR within each tier)
  starHoldings: ReportHolding[];
  keepHoldings: ReportHolding[];
  watchHoldings: ReportHolding[];
  swapHoldings: ReportHolding[];
  liquidateHoldings: ReportHolding[];

  // Tier totals
  tierTotals: {
    star:      { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
    keep:      { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
    watch:     { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
    swap:      { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
    liquidate: { count: number; investedInr: number; currentInr: number; pctOfPortfolio: number };
  };

  // Action-sheet specific
  totalReallocationInr: number;
  swapCount: number;
  liquidateCount: number;

  // RM
  rmName: string;

  // v2 intelligence (Verdict Engine v2) — surfaced in the client deliverable
  consolidationGroups: {
    subCategory: string; count: number;
    keep: { fundName: string }; consolidate: { fundName: string; currentValueInr: number }[];
    totalConsolidatableInr: number; confidence: string; rationale: string;
  }[];
  consolidationValueInr: number;
  taxSummary: {
    lines: { fundName: string; gainInr: number; gainType: string; locked: boolean; estTaxInr: number | null; note: string }[];
    exitCount: number; estTotalTaxInr: number; headline: string;
  } | null;
  // True only if a REAL client risk profile was captured. When false, verdicts ran
  // on the engine's generic default profile → reports must carry a warning banner.
  riskProfileCaptured: boolean;
  // Forward-looking plan inputs (the auto Investment Proposal). Allocation buckets
  // are % of current value; targets come from the risk model.
  forwardPlan: {
    currentEquityPct: number;      // pure-equity exposure
    currentHybridPct: number;
    currentDebtOtherPct: number;
    effectiveEquityPct: number;    // equity + ~60% of hybrid (look-through)
    targetEquityPct: number | null;
    requiredReturnPct: number | null;
    targetCorpusInr: number | null;
    yearsToGoal: number | null;
    monthlySipInr: number;
  };

  // ── The GAP (Nitrogen-style headline) — tolerated vs carried risk ──
  // toleratedTier comes from the risk model's within-equity ceiling persisted at
  // score time; carriedTier is the value-weighted risk tier of the equity+hybrid
  // sleeve as actually held. null when no real risk profile was captured.
  riskGap: {
    toleratedTier: string;
    carriedTier: string;
    pctAboveCeiling: number;       // % of equity-sleeve value in tiers ABOVE the ceiling
    hasGap: boolean;
  } | null;

  // ── Behaviour gap in rupees (indicative) ──
  // Per-holding (fund 3Y CAGR − investor XIRR), value-weighted, ONLY over
  // holdings held ≥30 months with both metrics present — the comparability
  // guard: XIRR is money-weighted over the actual period, CAGR is point-to-point
  // 3Y, so this is an INDICATIVE timing/behaviour signal, never an exact bill.
  behaviourGap: {
    weightedFundCagr3yPct: number;
    weightedInvestorXirrPct: number;
    gapPp: number;                 // fund − investor (positive = returns lost to timing)
    approxAnnualRupees: number;    // gapPp% × covered current value (0 when gap ≤ 0)
    coveragePct: number;           // % of current value the comparison covers
  } | null;

  // ── Portfolio-level risk KPIs (value-weighted fund stats) ──
  riskKpis: {
    weightedVolPct: number | null;   // weighted avg fund 3Y volatility (annualised %)
    weightedSharpe: number | null;
    coveragePct: number;             // % of current value with stats available
  } | null;

  // ── Relative performance vs a blended real-fund benchmark ──
  // Time-weighted vs time-weighted (weighted holding 3Y CAGR vs blend of a real
  // Nifty 50 index fund + a real liquid fund, mixed to the book's effective
  // equity weight). Family XIRR is shown separately — never compared directly.
  benchmark: {
    portfolioCagr3yPct: number;
    blendedBenchmarkPct: number;
    alphaPp: number;                 // portfolio − blended
    equityWeightPct: number;
    equityProxyName: string;
    equityProxyCagr3yPct: number;
    debtProxyName: string;
    debtProxyCagr3yPct: number;
    coveragePct: number;             // % of current value with 3Y CAGR present
  } | null;

  // ── Goal Monte Carlo (10k seeded lognormal paths) — null when no goal ──
  monteCarlo: (GoalMcResult & { assumedReturnPct: number; assumedVolPct: number }) | null;

  // ── Stock-level look-through (Pillar-6 completion). Dissolves each held fund
  // into its disclosed underlying stocks and aggregates the SAME stock across the
  // family — the true single-stock concentration fund-level diversification hides.
  // null when no held fund has disclosed-holdings data yet. ──
  stockLookThrough: FamilyStockOverlap | null;

  // ── Portfolio Health Score — single top-line 0-100 rollup (REEDOS-parity) ──
  portfolioHealthScore: PortfolioHealthScore;

  // ── Merged Asset-Type → Category → Fund allocation drill-down, Existing vs
  // New vs Change, all in one nested view (REEDOS "Scheme-Level Comparison" parity) ──
  allocationComparison: AllocationComparison;

  // ── Historical backtest overlay — current vs suggested portfolio, NAV-indexed
  // (REEDOS "Back Tested Performance" parity). Null when coverage is too thin. ──
  backtestOverlay: BacktestResult | null;
}

/** Coarse asset-class bucket for a fund category (for the allocation roll-up). */
function assetClassOf(category: string | null): 'equity' | 'hybrid' | 'debt' {
  const c = (category || '').toLowerCase();
  if (/aggressive hybrid|balanced advantage|dynamic asset|multi[\s-]*asset|equity savings|conservative hybrid|hybrid/.test(c)) return 'hybrid';
  if (/debt|liquid|gilt|arbitrage|duration|bond|money market|overnight|psu|credit/.test(c)) return 'debt';
  if (/flexi|large|mid|small|multi\s*cap|value|contra|focus|elss|dividend\s*yield|sector|thematic|equity|index|elss/.test(c)) return 'equity';
  return 'equity'; // unknown equity-ish default
}

/**
 * Pull a full diagnostic + holdings + scoring data, shape it into
 * report-ready form. Returns null if the diagnostic doesn't exist
 * or has no holdings.
 */
export async function loadReportData(
  diagnosticRunId: number,
  rmName: string = 'Sangeeta Shah / Ram Shah, CFP™'
): Promise<ReportData | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // ── 1. Diagnostic run + family ─────────────────────────────
  const { data: run } = await supabase
    .from('pd_diagnostic_runs')
    .select(`
      id, document_id, family_id, family_name, created_at,
      total_invested_inr, current_value_inr, family_xirr_pct,
      num_holdings, num_active_sips, monthly_sip_flow_inr,
      v2_consolidation, v2_consolidation_dupes, v2_consolidation_value_inr,
      v2_tax_summary, v2_tax_est_inr,
      rp_primary_age, rp_stated_priority, rp_life_stage,
      rm_target_equity_pct, rm_required_return_pct, rp_target_corpus_inr, rp_years_to_goal,
      rm_within_equity_ceiling
    `)
    .eq('id', diagnosticRunId)
    .maybeSingle();
  if (!run) return null;

  // ── 2. Holdings + their categories + preferred replacements ──
  const { data: holdings } = await supabase
    .from('pd_diagnostic_holdings')
    .select(`
      id, fund_name, amfi_code, category, folio_number, units,
      invested_inr, current_value_inr, unrealised_gain_inr,
      xirr_pct, cagr_3y, cagr_5y, holding_period_months,
      verdict, verdict_rationale, v2_action, v2_action_label, v2_quality_gates,
      entity:pd_family_entities!pd_diagnostic_holdings_entity_id_fkey(entity_name)
    `)
    .eq('diagnostic_run_id', diagnosticRunId)
    .order('verdict', { ascending: true });

  if (!holdings || holdings.length === 0) return null;

  // ── 3. Preferred replacements per category ─────────────────
  const { data: preferred } = await supabase
    .from('pd_preferred_funds_by_category')
    .select('category, primary_amfi_code, primary_fund_name:pd_fund_master!pd_preferred_funds_by_category_primary_amfi_code_fkey(scheme_name)');

  const replacementByCategory = new Map<string, { fundName: string; amfiCode: string }>();
  for (const p of preferred ?? []) {
    const raw = (p as Record<string, unknown>).primary_fund_name;
    const fundRow = Array.isArray(raw) ? raw[0] as Record<string, unknown> : raw as Record<string, unknown>;
    if (fundRow?.scheme_name && p.primary_amfi_code) {
      replacementByCategory.set(p.category as string, {
        fundName: fundRow.scheme_name as string,
        amfiCode: p.primary_amfi_code as string,
      });
    }
  }

  // ── 3b. Trustner Approved Buy-List (committee shortlist) ─────
  // The buy-list is the firm's house view; its APPROVED_OPEN funds are the
  // preferred replacement source (capacity-aware), superseding the legacy
  // pd_preferred_funds_by_category table. Loads gracefully (empty if absent).
  const buyList = await loadBuyList(supabase);

  // ── 4. Shape holdings ──────────────────────────────────────
  const shaped: ReportHolding[] = (holdings ?? []).map((h) => {
    const entRaw = (h as Record<string, unknown>).entity;
    const entRow = Array.isArray(entRaw) ? entRaw[0] as Record<string, unknown> : entRaw as Record<string, unknown>;
    const entityName = (entRow?.entity_name as string) ?? '—';
    const category = h.category as string | null;
    const verdict = (h.verdict as Verdict) ?? 'SWAP';
    const amfiCode = (h.amfi_code as string | null) ?? null;
    const fundName = h.fund_name as string;

    // Is this holding itself on the Trustner Buy-List?
    const onList = matchBuyList(buyList, amfiCode, fundName);

    // Replacement for sells: prefer the committee Buy-List (capacity-aware), then
    // fall back to the legacy preferred-funds table so nothing regresses.
    let buyListRepl: { fundName: string; amfiCode: string | null } | undefined;
    let legacyRepl: { fundName: string; amfiCode: string } | undefined;
    if (verdict === 'SWAP' || verdict === 'LIQUIDATE') {
      const blr = bestOpenReplacement(buyList, subCategoryKey(category), amfiCode);
      if (blr) buyListRepl = { fundName: blr.schemeName, amfiCode: blr.amfiCode };
      if (category) legacyRepl = replacementByCategory.get(category);
    }
    const replacement = buyListRepl ?? legacyRepl;

    const rawGates = (h as Record<string, unknown>).v2_quality_gates;
    const checklist = Array.isArray(rawGates) ? (rawGates as ChecklistItem[]) : null;

    return {
      id: h.id as number,
      entityName,
      fundName,
      amfiCode: amfiCode ?? undefined,
      category,
      folioNumber: (h.folio_number as string | null) ?? null,
      units: h.units != null ? Number(h.units) : null,
      investedInr: Number(h.invested_inr ?? 0),
      currentValueInr: Number(h.current_value_inr ?? 0),
      unrealisedGainInr: Number(h.unrealised_gain_inr ?? 0),
      xirrPct: h.xirr_pct as number | null,
      cagr3y: h.cagr_3y as number | null,
      cagr5y: h.cagr_5y as number | null,
      holdingPeriodMonths: h.holding_period_months as number | null,
      verdict,
      rationale: tidyRationale(h.verdict_rationale as string | null),
      v2Action: (h.v2_action as string | null) ?? null,
      v2ActionLabel: (h.v2_action_label as string | null) ?? null,
      checklist,
      onBuyList: !!onList,
      buyListStatus: onList?.status ?? null,
      preferredReplacementFundName: replacement?.fundName,
      preferredReplacementAmfiCode: replacement?.amfiCode ?? undefined,
      buyListReplacementFundName: buyListRepl?.fundName,
      buyListReplacementAmfiCode: buyListRepl?.amfiCode ?? undefined,
    };
  });

  // ── 4b. Scheme trailing returns (1Y/3Y/5Y) for the client deck ──
  // One batched read of the daily-refreshed universe view, keyed by amfi_code.
  // Stored as fractions → ×100 for percent. Best-effort: a miss just leaves the
  // cell blank ("—") on the deck; never blocks the report.
  try {
    const codes = Array.from(
      new Set(shaped.map((h) => h.amfiCode).filter((c): c is string => !!c))
    );
    if (codes.length > 0) {
      const { data: retRows } = await supabase
        .from('pd_fund_universe_latest')
        .select('amfi_code, returns_1y, returns_3y, returns_5y')
        .in('amfi_code', codes);
      const byCode = new Map<string, { r1: number | null; r3: number | null; r5: number | null }>();
      for (const r of retRows ?? []) {
        const pct = (v: unknown): number | null => {
          const n = Number(v);
          return Number.isFinite(n) && n !== 0 ? n * 100 : null;
        };
        byCode.set(String(r.amfi_code), { r1: pct(r.returns_1y), r3: pct(r.returns_3y), r5: pct(r.returns_5y) });
      }
      for (const h of shaped) {
        const r = h.amfiCode ? byCode.get(h.amfiCode) : undefined;
        h.fundRet1yPct = r?.r1 ?? null;
        h.fundRet3yPct = r?.r3 ?? null;
        h.fundRet5yPct = r?.r5 ?? null;
      }
    }
  } catch { /* universe view unavailable → leave returns blank */ }

  // ── 5. Tier the holdings ───────────────────────────────────
  const sortByCagr3y = (a: ReportHolding, b: ReportHolding) =>
    (b.cagr3y ?? -99) - (a.cagr3y ?? -99);

  const starHoldings = shaped.filter((h) => h.verdict === 'STAR').sort(sortByCagr3y);
  const keepHoldings = shaped.filter((h) => h.verdict === 'KEEP').sort(sortByCagr3y);
  const watchHoldings = shaped.filter((h) => h.verdict === 'WATCH').sort(sortByCagr3y);
  const swapHoldings = shaped.filter((h) => h.verdict === 'SWAP').sort(sortByCagr3y);
  const liquidateHoldings = shaped.filter((h) => h.verdict === 'LIQUIDATE').sort(sortByCagr3y);

  // ── 6. KPIs ────────────────────────────────────────────────
  const currentValueInr = Number(run.current_value_inr ?? shaped.reduce((s, h) => s + h.currentValueInr, 0));
  const totalInvestedInr = Number(run.total_invested_inr ?? shaped.reduce((s, h) => s + h.investedInr, 0));
  const totalGainInr = currentValueInr - totalInvestedInr;

  const uniqueFunds = new Set(shaped.map((h) => h.fundName.trim().toLowerCase())).size;
  const uniqueEntities = new Set(shaped.map((h) => h.entityName.trim().toLowerCase())).size;
  const uniqueAmcs = new Set(
    shaped
      .map((h) => h.fundName.split(/\s+/).slice(0, 2).join(' ').trim().toLowerCase())
      .filter((s) => s.length > 0)
  ).size;

  const tierTotal = (rows: ReportHolding[]) => {
    const investedInr = rows.reduce((s, h) => s + h.investedInr, 0);
    const currentInr = rows.reduce((s, h) => s + h.currentValueInr, 0);
    return {
      count: rows.length,
      investedInr,
      currentInr,
      pctOfPortfolio: totalInvestedInr > 0 ? (investedInr / totalInvestedInr) * 100 : 0,
    };
  };

  const tierTotals = {
    star: tierTotal(starHoldings),
    keep: tierTotal(keepHoldings),
    watch: tierTotal(watchHoldings),
    swap: tierTotal(swapHoldings),
    liquidate: tierTotal(liquidateHoldings),
  };

  // ── 7. Action-sheet totals ─────────────────────────────────
  const totalReallocationInr =
    swapHoldings.reduce((s, h) => s + h.currentValueInr, 0) +
    liquidateHoldings.reduce((s, h) => s + h.currentValueInr, 0);

  // ── 7b. Forward plan (allocation roll-up) — hoisted so the benchmark
  //        and Monte Carlo below can reuse the effective-equity weight ──
  const forwardPlan = (() => {
    let eq = 0, hy = 0, dt = 0;
    for (const h of shaped) {
      const cls = assetClassOf(h.category);
      if (cls === 'equity') eq += h.currentValueInr;
      else if (cls === 'hybrid') hy += h.currentValueInr;
      else dt += h.currentValueInr;
    }
    const tot = eq + hy + dt || 1;
    const pct = (n: number) => Math.round((n / tot) * 1000) / 10;
    const currentEquityPct = pct(eq), currentHybridPct = pct(hy), currentDebtOtherPct = pct(dt);
    return {
      currentEquityPct, currentHybridPct, currentDebtOtherPct,
      effectiveEquityPct: Math.round((currentEquityPct + 0.6 * currentHybridPct) * 10) / 10,
      targetEquityPct: (run.rm_target_equity_pct as number | null) ?? null,
      requiredReturnPct: (run.rm_required_return_pct as number | null) ?? null,
      targetCorpusInr: Number(run.rp_target_corpus_inr) || null,
      yearsToGoal: (run.rp_years_to_goal as number | null) ?? null,
      monthlySipInr: Number(run.monthly_sip_flow_inr) || 0,
    };
  })();

  const riskProfileCaptured =
    (run as Record<string, unknown>).rp_primary_age != null ||
    (run as Record<string, unknown>).rp_stated_priority != null ||
    (run as Record<string, unknown>).rp_life_stage != null;

  // ── 7c. The GAP — tolerated (risk-model ceiling) vs carried risk tier ──
  const TIER_SCORE: Record<string, number> = { 'Low': 1, 'Moderate': 2, 'High': 3, 'Very High': 4 };
  const TIER_BY_SCORE = ['', 'Low', 'Moderate', 'High', 'Very High'];
  let riskGap: ReportData['riskGap'] = null;
  const toleratedTier = (run as Record<string, unknown>).rm_within_equity_ceiling as string | null;
  if (riskProfileCaptured && toleratedTier && TIER_SCORE[toleratedTier]) {
    let wSum = 0, vSum = 0, aboveInr = 0;
    for (const h of holdings ?? []) {
      const cat = h.category as string | null;
      if (assetClassOf(cat) === 'debt') continue;            // within-EQUITY sleeve only
      const cur = Number(h.current_value_inr) || 0;
      const tier = categoryRiskTier(cat);
      const score = TIER_SCORE[tier] ?? 3;
      wSum += score * cur; vSum += cur;
      if (score > TIER_SCORE[toleratedTier]) aboveInr += cur;
    }
    if (vSum > 0) {
      const carriedScore = Math.round(wSum / vSum);
      const carriedTier = TIER_BY_SCORE[Math.min(4, Math.max(1, carriedScore))];
      const pctAbove = Math.round((aboveInr / vSum) * 100);
      riskGap = {
        toleratedTier,
        carriedTier,
        pctAboveCeiling: pctAbove,
        // A gap exists when the weighted tier breaches the ceiling OR when a
        // material tail (≥30% of the equity book) runs above it even though
        // the average rounds inside — a third of the book in Very-High funds
        // is a real gap, not "aligned".
        hasGap: carriedScore > TIER_SCORE[toleratedTier] || pctAbove >= 30,
      };
    }
  }

  // ── 7d. Behaviour gap in rupees (indicative; ≥30-month holdings only) ──
  let behaviourGap: ReportData['behaviourGap'] = null;
  {
    let covCur = 0, wCagr = 0, wXirr = 0;
    for (const h of shaped) {
      if (h.cagr3y == null || h.xirrPct == null || (h.holdingPeriodMonths ?? 0) < 30) continue;
      covCur += h.currentValueInr;
      wCagr += h.cagr3y * h.currentValueInr;
      wXirr += h.xirrPct * h.currentValueInr;
    }
    const coveragePct = currentValueInr > 0 ? (covCur / currentValueInr) * 100 : 0;
    if (covCur > 0 && coveragePct >= 40) {
      const fundCagr = wCagr / covCur, invXirr = wXirr / covCur;
      const gapPp = Math.round((fundCagr - invXirr) * 10) / 10;
      behaviourGap = {
        weightedFundCagr3yPct: Math.round(fundCagr * 10) / 10,
        weightedInvestorXirrPct: Math.round(invXirr * 10) / 10,
        gapPp,
        approxAnnualRupees: gapPp > 0 ? Math.round((gapPp / 100) * covCur / 1000) * 1000 : 0,
        coveragePct: Math.round(coveragePct),
      };
    }
  }

  // ── 7e. Portfolio risk KPIs — value-weighted fund stats ──
  let riskKpis: ReportData['riskKpis'] = null;
  try {
    const codes = Array.from(new Set((holdings ?? []).map((h) => h.amfi_code as string | null).filter((c): c is string => !!c)));
    if (codes.length) {
      const { data: stats } = await supabase
        .from('pd_fund_research_stats')
        .select('amfi_code, volatility, sharpe, snapshot_date')
        .in('amfi_code', codes)
        .order('snapshot_date', { ascending: false });
      const latest = new Map<string, { vol: number | null; sharpe: number | null }>();
      for (const s of stats ?? []) {
        const code = s.amfi_code as string;
        if (latest.has(code)) continue;
        const rawVol = Number(s.volatility);
        // feed stores volatility as a FRACTION; null garbage like the adapter does
        const vol = Number.isFinite(rawVol) && rawVol > 0 && rawVol <= 0.6 ? rawVol * 100 : null;
        const sh = Number.isFinite(Number(s.sharpe)) && Number(s.sharpe) !== 0 ? Number(s.sharpe) : null;
        latest.set(code, { vol, sharpe: sh });
      }
      let volW = 0, volCur = 0, shW = 0, shCur = 0;
      for (const h of holdings ?? []) {
        const st = latest.get((h.amfi_code as string) ?? '');
        const cur = Number(h.current_value_inr) || 0;
        if (st?.vol != null) { volW += st.vol * cur; volCur += cur; }
        if (st?.sharpe != null) { shW += st.sharpe * cur; shCur += cur; }
      }
      if (volCur > 0 || shCur > 0) {
        riskKpis = {
          weightedVolPct: volCur > 0 ? Math.round((volW / volCur) * 10) / 10 : null,
          weightedSharpe: shCur > 0 ? Math.round((shW / shCur) * 100) / 100 : null,
          coveragePct: currentValueInr > 0 ? Math.round((Math.max(volCur, shCur) / currentValueInr) * 100) : 0,
        };
      }
    }
  } catch { /* stats unavailable → omit the section gracefully */ }

  // ── 7f. Benchmark — weighted holding 3Y CAGR vs blended real-fund proxy ──
  // Equity proxy: Kotak Nifty 50 Index Fund Regular-Growth (AMFI 148974);
  // debt proxy: HDFC Liquid Fund Growth (AMFI 100868). Both real Regular funds,
  // CAGR computed from MFAPI NAV history (cached daily, 8s timeout).
  let benchmark: ReportData['benchmark'] = null;
  try {
    const proxyCagr3y = async (code: number): Promise<number | null> => {
      // MFAPI ignores date-range params — fetch MAX and slice the ~3Y window here.
      const hist = await getNavHistory(code, 'MAX');
      if (!hist || hist.length < 2) return null;
      const parse = (d: string): number => {
        const iso = Date.parse(d);
        if (!Number.isNaN(iso)) return iso;
        const [dd, mm, yy] = d.split('-');
        return Date.parse(`${yy}-${mm}-${dd}`);
      };
      const last = hist[hist.length - 1];
      const lastT = parse(last.date);
      const cutoff = lastT - 3 * 365.25 * 24 * 3600 * 1000;
      let first = hist[0];
      for (const p of hist) { if (parse(p.date) >= cutoff) { first = p; break; } }
      const years = (lastT - parse(first.date)) / (365.25 * 24 * 3600 * 1000);
      if (!Number.isFinite(years) || years < 2.5 || first.nav <= 0) return null;
      return (Math.pow(last.nav / first.nav, 1 / years) - 1) * 100;
    };
    // DB-first (our own NGEN-fed universe view, refreshed daily) — MFAPI NAV
    // history only as fallback, so the flagship report never depends on a
    // third-party API being up at render time.
    const proxyFromDb = async (code: string): Promise<number | null> => {
      const { data } = await supabase
        .from('pd_fund_universe_latest').select('returns_3y').eq('amfi_code', code).maybeSingle();
      const r = Number(data?.returns_3y);
      return Number.isFinite(r) && r !== 0 ? r * 100 : null;
    };
    let [eqProxy, dtProxy] = await Promise.all([proxyFromDb('148974'), proxyFromDb('100868')]);
    if (eqProxy == null) eqProxy = await proxyCagr3y(148974);
    if (dtProxy == null) dtProxy = await proxyCagr3y(100868);
    // Robustness guard: a Nifty index fund's / liquid fund's 3Y CAGR lives in a
    // sane band. If a feed-format change ever broke the unit conversion, reject
    // the proxy (→ section omitted) rather than show a garbage alpha to a client.
    if (eqProxy != null && (eqProxy < -25 || eqProxy > 45)) eqProxy = null;
    if (dtProxy != null && (dtProxy < 0 || dtProxy > 20)) dtProxy = null;
    let pW = 0, pCur = 0;
    for (const h of shaped) {
      if (h.cagr3y == null) continue;
      pW += h.cagr3y * h.currentValueInr; pCur += h.currentValueInr;
    }
    const coveragePct = currentValueInr > 0 ? (pCur / currentValueInr) * 100 : 0;
    if (eqProxy != null && dtProxy != null && pCur > 0 && coveragePct >= 40) {
      const eqW = forwardPlan.effectiveEquityPct;
      const blended = (eqW / 100) * eqProxy + (1 - eqW / 100) * dtProxy;
      const portfolioCagr = pW / pCur;
      benchmark = {
        portfolioCagr3yPct: Math.round(portfolioCagr * 10) / 10,
        blendedBenchmarkPct: Math.round(blended * 10) / 10,
        alphaPp: Math.round((portfolioCagr - blended) * 10) / 10,
        equityWeightPct: eqW,
        equityProxyName: 'Kotak Nifty 50 Index Fund (Regular-Growth)',
        equityProxyCagr3yPct: Math.round(eqProxy * 10) / 10,
        debtProxyName: 'HDFC Liquid Fund (Growth)',
        debtProxyCagr3yPct: Math.round(dtProxy * 10) / 10,
        coveragePct: Math.round(coveragePct),
      };
    }
  } catch { /* proxy NAV unavailable → omit the section gracefully */ }

  // ── 7g. Goal Monte Carlo (only when a real goal is captured) ──
  let monteCarlo: ReportData['monteCarlo'] = null;
  if (forwardPlan.targetCorpusInr && forwardPlan.targetCorpusInr > 0 && forwardPlan.yearsToGoal && forwardPlan.yearsToGoal > 0) {
    const rawReq = forwardPlan.requiredReturnPct;
    const assumedReturnPct = rawReq != null && rawReq >= 8 && rawReq <= 15 ? rawReq : 12;
    const assumedVolPct = riskKpis?.weightedVolPct ?? 14;
    const mc = runGoalMonteCarlo({
      currentValueInr,
      monthlySipInr: forwardPlan.monthlySipInr,
      years: forwardPlan.yearsToGoal,
      targetCorpusInr: forwardPlan.targetCorpusInr,
      expReturnPct: assumedReturnPct,
      volPct: assumedVolPct,
    });
    monteCarlo = { ...mc, assumedReturnPct, assumedVolPct };
  }

  // ── 7h. Stock-level look-through (true single-stock concentration) ──
  let stockLookThrough: ReportData['stockLookThrough'] = null;
  try {
    const provider = createSupabaseHoldingsProvider();
    const famHoldings = shaped
      .filter((h) => h.amfiCode && h.currentValueInr > 0)
      .map((h) => ({ amfiCode: h.amfiCode as string, valueInr: h.currentValueInr, fundName: h.fundName }));
    if (famHoldings.length > 0) {
      const agg = await aggregateFamilyStockOverlap(famHoldings, provider.getRichHoldings, {
        topN: 12,
        asOfDateByFund: provider.getAsOfDate,
      });
      // Only surface when at least one fund actually resolved to disclosed holdings.
      if (agg.hasData) stockLookThrough = agg;
    }
  } catch { /* holdings data unavailable → omit the section gracefully */ }

  // ── 7i. Portfolio Health Score — single top-line rollup (REEDOS-parity) ──
  const portfolioHealthScore = computePortfolioHealthScore({
    tierTotals,
    riskGap,
    consolidationValueInr: Number(run.v2_consolidation_value_inr) || 0,
    currentValueInr,
    behaviourGap,
  });

  // ── 7j. Merged allocation drill-down — Asset Type / Category / Fund (REEDOS-parity) ──
  const allocationComparison = buildAllocationComparison(
    shaped.map((h) => ({
      fundName: h.fundName,
      category: h.category,
      currentValueInr: h.currentValueInr,
      verdict: h.verdict,
      preferredReplacementFundName: h.preferredReplacementFundName,
    }))
  );

  // ── 7k. Backtest overlay — current vs suggested portfolio, NAV-indexed (REEDOS-parity) ──
  let backtestOverlay: ReportData['backtestOverlay'] = null;
  try {
    const currentWeights = shaped
      .filter((h) => h.currentValueInr > 0)
      .map((h) => ({ amfiCode: h.amfiCode ?? null, valueInr: h.currentValueInr }));
    const suggestedWeights = shaped
      .filter((h) => h.currentValueInr > 0)
      .map((h) => {
        const stays = h.verdict === 'STAR' || h.verdict === 'KEEP' || h.verdict === 'WATCH';
        return {
          amfiCode: (stays ? h.amfiCode : h.preferredReplacementAmfiCode) ?? null,
          valueInr: h.currentValueInr,
        };
      });
    backtestOverlay = await computeBacktest(currentWeights, suggestedWeights, 18);
  } catch { /* NAV history unavailable → omit the section gracefully */ }

  // ── 8. Format report date ──────────────────────────────────
  const reportDateIso = new Date().toISOString().slice(0, 10);
  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const entitiesCovered = Array.from(
    new Set(shaped.map((h) => h.entityName).filter((n) => n && n !== '—'))
  ).map((s) => s.toUpperCase());

  return {
    diagnosticId: run.id as number,
    documentId: run.document_id as string,
    reportDate,
    reportDateIso,

    familyId: run.family_id as number,
    familyName: run.family_name as string,
    entitiesCovered,

    totalInvestedInr,
    currentValueInr,
    totalGainInr,
    familyXirrPct: run.family_xirr_pct as number | null,
    numHoldings: shaped.length,
    numUniqueFunds: uniqueFunds,
    numEntities: uniqueEntities,
    numAmcs: uniqueAmcs,

    starHoldings,
    keepHoldings,
    watchHoldings,
    swapHoldings,
    liquidateHoldings,

    tierTotals,

    totalReallocationInr,
    swapCount: swapHoldings.length,
    liquidateCount: liquidateHoldings.length,

    rmName,

    consolidationGroups: (run.v2_consolidation as ReportData['consolidationGroups'] | null) ?? [],
    consolidationValueInr: Number(run.v2_consolidation_value_inr) || 0,
    taxSummary: (run.v2_tax_summary as ReportData['taxSummary']) ?? null,
    riskProfileCaptured,
    forwardPlan,
    riskGap,
    behaviourGap,
    riskKpis,
    benchmark,
    monteCarlo,
    stockLookThrough,
    portfolioHealthScore,
    allocationComparison,
    backtestOverlay,
  };
}

/**
 * Shared "risk profile not captured" warning banner (HTML). Returns '' when the
 * profile WAS captured. When not captured, verdicts ran on the engine's generic
 * default profile, so the deliverable must say so prominently — a registered human
 * must capture the real profile (a conversation) and re-score before this is final.
 */
export function riskNotCapturedBanner(data: ReportData): string {
  if (data.riskProfileCaptured) return '';
  return `<div style="border:1.5px solid #B45309;background:#FEF3C7;border-radius:8px;padding:10px 14px;margin:10px 0;font-size:10pt;color:#7c2d12;">
    <strong>⚠ Risk profile not captured.</strong> The verdicts below were generated against a
    <em>generic default</em> investor profile, not this client's actual risk profile. They are
    <strong>not final</strong> — the client's risk profile must be captured (a personal conversation)
    and the diagnostic re-scored before this report is relied upon or shared.
  </div>`;
}

/**
 * Format INR using Indian numbering (lakhs / crores).
 * 100000 → "₹1.00 L"
 * 10000000 → "₹1.00 Cr"
 * 35000 → "₹35,000"
 */
export function formatInrShort(inr: number): string {
  const abs = Math.abs(inr);
  const sign = inr < 0 ? '-' : '';
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)} L`;
  return `${sign}₹${abs.toLocaleString('en-IN')}`;
}

/** Format full INR with commas, no decimals. 265987 → "₹2,65,987" */
export function formatInrFull(inr: number): string {
  const sign = inr < 0 ? '-' : '';
  return `${sign}₹${Math.abs(Math.round(inr)).toLocaleString('en-IN')}`;
}

/** Format a percentage. null → "NM" (not meaningful) */
export function formatPct(p: number | null | undefined, places = 2): string {
  if (p === null || p === undefined || Number.isNaN(p)) return 'NM';
  return `${p.toFixed(places)}%`;
}
