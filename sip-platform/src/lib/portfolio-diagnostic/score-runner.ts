/**
 * Portfolio Diagnostic — Scoring core (shared).
 *
 * The full scoring pipeline, extracted from the POST /score route so it can be
 * invoked from BOTH the authenticated route and offline tooling (e.g. an
 * admin re-score) with IDENTICAL logic — no divergence.
 *
 * Pipeline: load run+holdings+SIPs → 4-tier fund-master match → category
 * benchmarks → legacy analyzeHolding (cagr/quartile/SIP) → Verdict Engine v2
 * (authoritative verdicts + consolidation + tax + risk model) → re-tally →
 * SIP linking → audit event.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { analyzeHolding } from '@/lib/portfolio-diagnostic/scoring-engine';
import { fuzzyMatchSchemeName, normaliseSchemeName, detectPlanType, isPlausibleCodeMatch } from '@/lib/portfolio-diagnostic/fund-data-client';
import { sanitizeSchemeName } from '@/lib/portfolio-diagnostic/cas-parser';
import { linkSipsToHoldings, analyzeSip } from '@/lib/portfolio-diagnostic/sip-analytics';
import { scoreDiagnosticV2, riskInputsFromRun, type V2HoldingInput } from '@/lib/portfolio-diagnostic/v2/adapter';
import { reconcileSameFundFolios, type FolioReconcileItem } from '@/lib/portfolio-diagnostic/v2/overlap-engine';
import { logPdEvent } from '@/lib/portfolio-diagnostic/audit';
import type {
  Verdict, FundCategory, RawHolding, RawSip, FundMaster, CategoryBenchmark,
  AnalyzedHolding, AnalyzedSip, EntityType,
} from '@/lib/portfolio-diagnostic/types';

export interface RiskProfileInput {
  primaryAge?: number; lifeStage?: string;
  monthlyIncomeInr?: number; monthlyExpenseInr?: number;
  livingDependsOnThis?: boolean; netWorthBufferInr?: number;
  longestHorizonYears?: number; statedPriority?: string;
  pastDrawdownBehaviour?: string; targetCorpusInr?: number; yearsToGoal?: number;
}

export interface ScoreResult {
  ok: boolean;
  status: number;          // HTTP-style status for the route to relay
  error?: string;
  scored?: number;
  skipped?: number;
  skipReasons?: string[];
  verdictCounts?: Record<Verdict, number>;
}

function inrRupees(n: number | null | undefined): number {
  if (n === null || n === undefined || !isFinite(n)) return 0;
  return Math.round(n);
}

/**
 * Run (or re-run) scoring for a diagnostic. Caller is responsible for auth.
 * Pass `riskProfile` to correct the client's profile before scoring (edit-from-
 * review); omit for a plain re-score. `actorEmail` is recorded in the time-log.
 */
export async function scoreDiagnostic(
  supabase: SupabaseClient,
  diagnosticRunId: number,
  opts: { riskProfile?: RiskProfileInput | null; actorEmail: string }
): Promise<ScoreResult> {
  // ── Step 1: Load diagnostic + holdings + SIPs ──────────────
  const { data: run } = await supabase
    .from('pd_diagnostic_runs')
    .select('id, status, family_id, family_name, rp_primary_age, rp_life_stage, rp_monthly_income_inr, rp_monthly_expense_inr, rp_living_depends_on_this, rp_net_worth_buffer_inr, rp_longest_horizon_years, rp_stated_priority, rp_past_drawdown_behaviour, rp_questionnaire_score, rp_target_corpus_inr, rp_years_to_goal')
    .eq('id', diagnosticRunId)
    .single();

  if (!run) return { ok: false, status: 404, error: 'Diagnostic not found' };

  if (!['DRAFT', 'CHANGES_REQUESTED', 'SUBMITTED', 'IN_REVIEW', 'ESCALATED'].includes(run.status as string)) {
    return { ok: false, status: 400, error: `Cannot score from status ${run.status}. Only draft/review-stage runs can be re-scored.` };
  }

  // ── Optional: apply an updated risk profile (edit-from-review) ──
  let rpBodyApplied = false;
  const rp = opts.riskProfile;
  if (rp && typeof rp === 'object') {
    rpBodyApplied = true;
    const rpUpdate = {
      rp_primary_age: rp.primaryAge ?? null,
      rp_life_stage: rp.lifeStage ?? null,
      rp_monthly_income_inr: rp.monthlyIncomeInr != null ? inrRupees(rp.monthlyIncomeInr) : null,
      rp_monthly_expense_inr: rp.monthlyExpenseInr != null ? inrRupees(rp.monthlyExpenseInr) : null,
      rp_living_depends_on_this: rp.livingDependsOnThis ?? null,
      rp_net_worth_buffer_inr: rp.netWorthBufferInr != null ? inrRupees(rp.netWorthBufferInr) : null,
      rp_longest_horizon_years: rp.longestHorizonYears ?? null,
      rp_stated_priority: rp.statedPriority ?? null,
      rp_past_drawdown_behaviour: rp.pastDrawdownBehaviour ?? null,
      rp_target_corpus_inr: rp.targetCorpusInr != null && rp.targetCorpusInr > 0 ? inrRupees(rp.targetCorpusInr) : null,
      rp_years_to_goal: rp.yearsToGoal != null && rp.yearsToGoal > 0 ? rp.yearsToGoal : null,
    };
    await supabase.from('pd_diagnostic_runs').update(rpUpdate).eq('id', diagnosticRunId);
    Object.assign(run as Record<string, unknown>, rpUpdate);
  }

  const hasRealProfile =
    (run as Record<string, unknown>).rp_primary_age != null ||
    (run as Record<string, unknown>).rp_stated_priority != null ||
    (run as Record<string, unknown>).rp_life_stage != null;

  const { data: holdings } = await supabase
    .from('pd_diagnostic_holdings')
    .select('id, entity_id, fund_name, amfi_code, units, invested_inr, current_value_inr, first_investment_date, folio_number, entity:pd_family_entities(entity_name, entity_type)')
    .eq('diagnostic_run_id', diagnosticRunId);

  if (!holdings || holdings.length === 0) return { ok: false, status: 400, error: 'No holdings to score' };

  const { data: sips } = await supabase
    .from('pd_diagnostic_sips')
    .select('id, entity_id, fund_name, amfi_code, monthly_amount_inr, actual_amount_inr, frequency, start_date, status, has_step_up, step_up_pct, step_up_frequency, entity:pd_family_entities(entity_name)')
    .eq('diagnostic_run_id', diagnosticRunId);

  // ── Step 2: Load matching fund_master rows (4-tier matcher) ──
  const amfiCodes = holdings.map((h) => h.amfi_code).filter(Boolean) as string[];

  const { data: fundsByCode } = await supabase
    .from('pd_fund_master')
    .select('amfi_code, scheme_name, amc_name, category, current_nav, fund_manager, manager_since_date, cagr_1y, cagr_3y, cagr_5y, cagr_10y, category_rank_3y, category_rank_5y, category_total, trustner_preferred, last_refreshed_at, aum_inr_cr, expense_ratio, sub_category')
    .in('amfi_code', amfiCodes.length > 0 ? amfiCodes : ['_no_match_']);

  const fundsByHoldingId = new Map<number, FundMaster>();

  // Load the FULL fund master. PostgREST caps ONE response at 1000 rows, but
  // the master holds ~4,200 funds — so we MUST paginate. Without this, any
  // fund beyond row 1000 is invisible to the matcher: a held fund that exists
  // is either skipped, or (worse) mis-bound to a similar name that happens to
  // sit inside the first-1000 window (e.g. Axis Small Cap → its Direct twin,
  // Axis Midcap → JM Midcap). This was the root cause of the run-21 mismatches.
  const MASTER_COLS = 'amfi_code, scheme_name, amc_name, category, current_nav, fund_manager, manager_since_date, cagr_1y, cagr_3y, cagr_5y, cagr_10y, category_rank_3y, category_rank_5y, category_total, trustner_preferred, last_refreshed_at, aum_inr_cr, expense_ratio, sub_category';
  const firstPage = await supabase.from('pd_fund_master').select(MASTER_COLS).order('amfi_code').range(0, 999);
  const masterList = firstPage.data ?? [];
  let pageLen = masterList.length;
  let from = 1000;
  while (pageLen === 1000) {
    const { data: page } = await supabase.from('pd_fund_master').select(MASTER_COLS).order('amfi_code').range(from, from + 999);
    pageLen = page?.length ?? 0;
    if (page && page.length) masterList.push(...page);
    from += 1000;
  }

  const masterByPlan: { regular: typeof masterList; direct: typeof masterList } = { regular: [], direct: [] };
  for (const f of masterList) {
    masterByPlan[detectPlanType((f.scheme_name as string) ?? '')].push(f);
  }

  for (const h of holdings) {
    // Tier 1 — by stored amfi_code, but ONLY if that code's fund is
    // plausible for the holding name. A CAS PDF (or an older matcher)
    // can persist a wrong code; trusting it blindly is how a "Small Cap"
    // holding ended up scored as a "Multi Cap" / "Liquid" fund. If the
    // stored code disagrees on AMC or category, fall through to name
    // matching (and self-heal the stored code with the correct one).
    const direct = fundsByCode?.find((f) => f.amfi_code === h.amfi_code);
    if (
      direct &&
      isPlausibleCodeMatch((h.fund_name as string) ?? '', (direct.scheme_name as string) ?? '') &&
      // …and the plan agrees. A Trustner (MFD) client holds Regular plans;
      // a stored Direct-plan code on a Regular-implied holding (a leftover
      // from an older match) must NOT be trusted — fall through and re-match
      // to the Regular sibling (Tier 3 searches same-plan first; Tier 4 falls
      // back to the other plan if no same-plan fund exists, so we never lose it).
      detectPlanType(sanitizeSchemeName((h.fund_name as string) ?? '')) === detectPlanType((direct.scheme_name as string) ?? '')
    ) {
      fundsByHoldingId.set(h.id as number, toFundMaster(direct)); continue;
    }

    const name = sanitizeSchemeName(h.fund_name as string);
    if (!name) continue;

    const exactHit = masterList.find((f) => ((f.scheme_name as string) ?? '').toLowerCase() === name.toLowerCase());
    if (exactHit) { fundsByHoldingId.set(h.id as number, toFundMaster(exactHit)); continue; }

    const planType = detectPlanType(name);
    const candidates = masterByPlan[planType];
    const match = fuzzyMatchSchemeName(name, candidates.map((c) => ({ amfiCode: c.amfi_code as string, schemeName: c.scheme_name as string })));
    if (match) {
      const matched = candidates.find((c) => c.amfi_code === match.amfiCode);
      if (matched) { fundsByHoldingId.set(h.id as number, toFundMaster(matched)); continue; }
    }

    const otherCandidates = masterByPlan[planType === 'regular' ? 'direct' : 'regular'];
    const fallback = fuzzyMatchSchemeName(name, otherCandidates.map((c) => ({ amfiCode: c.amfi_code as string, schemeName: c.scheme_name as string })));
    if (fallback) {
      const matched = otherCandidates.find((c) => c.amfi_code === fallback.amfiCode);
      if (matched) fundsByHoldingId.set(h.id as number, toFundMaster(matched));
    }
    void normaliseSchemeName;
  }

  // ── Step 3: Load category benchmarks ───────────────────────
  const categories = Array.from(new Set(Array.from(fundsByHoldingId.values()).map((f) => f.category)));
  const { data: benchmarks } = await supabase
    .from('pd_category_benchmarks')
    .select('category, median_3y, median_5y, top_10_pct_3y, bottom_10_pct_3y, total_funds_in_category, as_of_date')
    .in('category', categories.length > 0 ? categories : ['_'])
    .order('as_of_date', { ascending: false });

  const benchmarkByCategory = new Map<FundCategory, CategoryBenchmark>();
  for (const b of benchmarks ?? []) {
    const cat = b.category as FundCategory;
    if (!benchmarkByCategory.has(cat)) benchmarkByCategory.set(cat, toCategoryBenchmark(b));
  }

  // ── Step 4: Score each holding + write back ────────────────
  const analyzedHoldings: AnalyzedHolding[] = [];
  let scored = 0;
  let skipped = 0;
  const skipReasons: string[] = [];

  for (const h of holdings) {
    const fund = fundsByHoldingId.get(h.id as number);
    if (!fund) { skipped++; skipReasons.push(`${h.fund_name}: no matching fund in master`); continue; }

    const benchmark = benchmarkByCategory.get(fund.category) ?? ({
      category: fund.category, median3y: 14, median5y: 14, top10Pct3y: 22, bottom10Pct3y: 8,
      totalFundsInCategory: 0, asOfDate: new Date().toISOString().split('T')[0],
    } as CategoryBenchmark);

    const raw: RawHolding = {
      entityName: extractEntityField(h.entity, 'entity_name') ?? 'Unknown',
      entityType: (extractEntityField(h.entity, 'entity_type') as EntityType) ?? 'Individual',
      fundName: h.fund_name as string,
      folioNumber: h.folio_number as string | undefined,
      amcName: fund.amcName,
      units: Number(h.units) || 0,
      currentValue: Number(h.current_value_inr) || 0,
      investedAmount: Number(h.invested_inr) || 0,
      firstInvestmentDate: h.first_investment_date as string | undefined,
    };

    const analyzed = analyzeHolding({ raw, fundMaster: fund, benchmark, entityId: String(h.entity_id), holdingId: String(h.id) });

    let preferredReplacementAmfiCode: string | null = null;
    let finalRationale = analyzed.verdictRationale;
    if (analyzed.verdict === 'SWAP') {
      const { data: pair } = await supabase
        .from('pd_preferred_swaps')
        .select('recommended_amfi_code, recommended_scheme_name, rationale')
        .eq('exit_amfi_code', fund.amfiCode).eq('active', true).maybeSingle();
      if (pair) {
        preferredReplacementAmfiCode = pair.recommended_amfi_code as string;
        finalRationale = `Trustner-preferred swap → ${pair.recommended_scheme_name}. ${pair.rationale as string}`;
      }
    }

    await supabase.from('pd_diagnostic_holdings').update({
      amfi_code: fund.amfiCode, category: fund.category,
      xirr_pct: analyzed.xirrPct, holding_period_months: analyzed.holdingPeriodMonths,
      cagr_1y: analyzed.cagr1y, cagr_3y: analyzed.cagr3y, cagr_5y: analyzed.cagr5y,
      category_median_3y: analyzed.categoryMedian3y, category_median_5y: analyzed.categoryMedian5y,
      category_quartile: analyzed.categoryQuartile, composite_score: analyzed.compositeScore,
      verdict: analyzed.verdict, verdict_rationale: finalRationale,
      recommended_replacement_amfi_code: preferredReplacementAmfiCode,
    }).eq('id', h.id as number);

    analyzedHoldings.push(analyzed);
    scored++;
  }

  // ── Step 4b: Verdict Engine v2 (authoritative) ─────────────
  try {
    const currentInvestable = holdings.reduce((s, h) => s + (Number(h.current_value_inr) || 0), 0);
    const holderHasOtherIncome = Number((run as Record<string, unknown>).rp_monthly_income_inr) > 0;
    const v2Inputs: V2HoldingInput[] = holdings.map((h) => {
      const fund = fundsByHoldingId.get(h.id as number);
      const nm = (h.fund_name as string) || '';
      const isIdcw = /idcw|dividend|payout|income distribution/i.test(nm);
      return {
        holdingId: h.id as number, fundName: nm,
        amfiCode: (fund?.amfiCode ?? (h.amfi_code as string)) || null,
        categoryHint: fund?.category ?? null,
        currentValueInr: Number(h.current_value_inr) || 0,
        investedInr: Number(h.invested_inr) || 0,
        xirrPct: null, fundOption: isIdcw ? 'idcw' : 'growth', holderHasOtherIncome,
        holdingPeriodMonths: h.first_investment_date
          ? Math.max(0, Math.round((Date.now() - new Date(h.first_investment_date as string).getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
          : null,
      };
    });
    const riskInputs = riskInputsFromRun(run as Record<string, unknown>, currentInvestable);
    const v2 = await scoreDiagnosticV2(supabase, v2Inputs, riskInputs);

    for (const r of v2.holdings) {
      const v = r.verdict;
      await supabase.from('pd_diagnostic_holdings').update({
        verdict: r.legacyVerdict,
        verdict_rationale: v?.rationale ?? undefined,
        v2_quality_verdict: v?.quality ?? null,
        v2_quality_gates: v?.detail?.quality?.checklist ?? v?.detail?.quality?.gates ?? null,
        v2_suitability: v?.suitability ?? null,
        v2_fund_risk_tier: v?.fundRiskTier ?? null,
        v2_forward_aum: v?.detail?.forward?.aumHeadroom ?? null,
        v2_forward_downside: v?.detail?.forward?.downside ?? null,
        v2_action: v?.action ?? null,
        v2_action_label: v?.actionLabel ?? null,
        v2_rationale: v?.rationale ?? null,
        v2_fund_option: r.fundStats ? (/idcw|dividend/i.test(r.fundStats.schemeName) ? 'idcw' : 'growth') : null,
        v2_rolling_3y_pct: r.rolling3yPct != null ? Number((r.rolling3yPct * 100).toFixed(4)) : null,
      }).eq('id', r.holdingId);
    }

    // ── Step 4c: same-fund folio reconciliation ───────────────
    // Multiple folios of the SAME fund held by the SAME holder are ONE position
    // and must carry ONE consistent verdict. In particular, a tiny lot of a fund
    // whose main folio is KEEP must NOT read "LIQUIDATE" — that contradicts the
    // keep. We align the verdict across folios and turn a tiny-lot redeem into a
    // folio-MERGE suggestion (consolidate, don't redeem). See overlap-engine.
    const entityNameById = new Map<unknown, string>();
    for (const h of holdings) {
      const en = extractEntityField(h.entity, 'entity_name');
      if (en && !entityNameById.has(h.entity_id)) entityNameById.set(h.entity_id, en);
    }
    const reconcileItems: FolioReconcileItem[] = v2.holdings.map((r) => {
      const input = v2Inputs.find((i) => i.holdingId === r.holdingId);
      const h = holdings.find((x) => x.id === r.holdingId);
      return {
        holdingId: r.holdingId,
        amfiCode: input?.amfiCode ?? null,
        entityId: (h?.entity_id as string | number | null) ?? null,
        entityName: h ? (entityNameById.get(h.entity_id) ?? null) : null,
        currentValueInr: input?.currentValueInr ?? 0,
        fundName: input?.fundName ?? '',
        verdict: r.legacyVerdict,
        action: r.verdict?.action ?? null,
        rationale: r.verdict?.rationale ?? '',
      };
    });
    const { overrides: folioOverrides } = reconcileSameFundFolios(reconcileItems);
    for (const o of folioOverrides) {
      await supabase.from('pd_diagnostic_holdings').update({
        verdict: o.verdict, v2_action: o.action,
        verdict_rationale: o.rationale, v2_rationale: o.rationale,
      }).eq('id', o.holdingId);
    }

    const rm = v2.riskModel;
    await supabase.from('pd_diagnostic_runs').update({
      risk_profile_captured: hasRealProfile,
      rm_capacity_score: rm.capacityScore, rm_tolerance_score: rm.toleranceScore,
      rm_required_return_pct: rm.requiredReturnPct, rm_binding_constraint: rm.bindingConstraint,
      rm_target_equity_pct: rm.targetEquityPct, rm_age_rule_equity_pct: rm.ageRuleEquityPct,
      rm_capacity_overrode_age: rm.capacityOverrodeAge, rm_within_equity_ceiling: rm.withinEquityCeiling,
      rm_profile_label: rm.profileLabel, rm_client_posture: v2.posture, rm_rationale: rm.rationale,
      engine_version: '2.0.0',
      v2_consolidation: v2.consolidation.groups,
      v2_consolidation_dupes: v2.consolidation.duplicateFundCount,
      v2_consolidation_value_inr: Math.round(v2.consolidation.totalConsolidatableInr),
      v2_tax_summary: v2.taxSummary,
      v2_tax_est_inr: Math.round(v2.taxSummary.estTotalTaxInr),
    }).eq('id', diagnosticRunId);
  } catch (e) {
    console.error('[PD v2] engine pass failed, falling back to legacy verdicts:', e);
  }

  // ── Step 5: Re-tally verdict counts ────────────────────────
  const tally: Record<Verdict, number> = { STAR: 0, KEEP: 0, WATCH: 0, SWAP: 0, LIQUIDATE: 0 };
  let totalSwapValue = 0;
  let totalLiquidateValue = 0;
  const { data: scoredRows } = await supabase
    .from('pd_diagnostic_holdings').select('verdict, current_value_inr').eq('diagnostic_run_id', diagnosticRunId);
  for (const row of scoredRows ?? []) {
    const verdict = (row.verdict as Verdict) ?? 'WATCH';
    if (tally[verdict] !== undefined) tally[verdict]++;
    if (verdict === 'SWAP') totalSwapValue += Number(row.current_value_inr) || 0;
    if (verdict === 'LIQUIDATE') totalLiquidateValue += Number(row.current_value_inr) || 0;
  }

  await supabase.from('pd_diagnostic_runs').update({
    verdict_star_count: tally.STAR, verdict_keep_count: tally.KEEP, verdict_watch_count: tally.WATCH,
    verdict_swap_count: tally.SWAP, verdict_liquidate_count: tally.LIQUIDATE,
    total_swap_value_inr: inrRupees(totalSwapValue), total_liquidate_value_inr: inrRupees(totalLiquidateValue),
  }).eq('id', diagnosticRunId);

  // ── Step 6: Score SIPs (link to scored holdings) ───────────
  if (sips && sips.length > 0) {
    const analyzedSips: AnalyzedSip[] = [];
    for (const s of sips) {
      const fund = fundsByHoldingId.get(holdings.find((h) => h.entity_id === s.entity_id && h.fund_name === s.fund_name)?.id as number);
      if (!fund) continue;
      const raw: RawSip = {
        entityName: extractEntityField(s.entity, 'entity_name') ?? 'Unknown',
        fundName: s.fund_name as string,
        monthlyAmountInr: Number(s.monthly_amount_inr) || 0,
        actualAmountInr: Number(s.actual_amount_inr) || 0,
        frequency: s.frequency as RawSip['frequency'],
        startDate: s.start_date as string, status: s.status as RawSip['status'],
        hasStepUp: Boolean(s.has_step_up), stepUpPct: s.step_up_pct as number | undefined,
      };
      analyzedSips.push(analyzeSip({ raw, fundMaster: fund, entityId: String(s.entity_id) }));
    }
    const linked = linkSipsToHoldings({ sips: analyzedSips, holdings: analyzedHoldings });
    for (let i = 0; i < linked.length; i++) {
      const sip = linked[i];
      const dbSip = sips[i];
      if (!dbSip) continue;
      await supabase.from('pd_diagnostic_sips').update({
        category: sip.category, age_in_months: sip.ageInMonths,
        expected_annual_inflow_inr: inrRupees(sip.expectedAnnualInflowInr),
        expected_5y_inflow_inr: inrRupees(sip.expected5YInflowInr),
        fund_verdict: sip.fundVerdict, recommended_action: sip.recommendedAction,
        recommended_redirect_fund: sip.recommendedRedirectFund,
      }).eq('id', dbSip.id as number);
    }
  }

  await logPdEvent(supabase, {
    runId: diagnosticRunId, actorEmail: opts.actorEmail,
    action: rpBodyApplied ? 'RISK_PROFILE_EDIT' : 'RE_SCORE',
    fromStatus: run.status as string, toStatus: run.status as string,
    metadata: { scored, skipped },
  });

  return { ok: true, status: 200, scored, skipped, skipReasons, verdictCounts: tally };
}

// ── helpers ──
function toFundMaster(row: Record<string, unknown>): FundMaster {
  return {
    amfiCode: row.amfi_code as string, schemeName: row.scheme_name as string, amcName: row.amc_name as string,
    category: row.category as FundCategory, subCategory: row.sub_category as string | undefined,
    currentNav: Number(row.current_nav) || 0, aumInrCr: Number(row.aum_inr_cr) || 0,
    expenseRatio: Number(row.expense_ratio) || undefined,
    fundManager: row.fund_manager as string | undefined, managerSinceDate: row.manager_since_date as string | undefined,
    cagr1y: row.cagr_1y as number | null, cagr3y: row.cagr_3y as number | null,
    cagr5y: row.cagr_5y as number | null, cagr10y: row.cagr_10y as number | null,
    categoryRank3y: row.category_rank_3y as number | undefined, categoryRank5y: row.category_rank_5y as number | undefined,
    categoryTotal: row.category_total as number | undefined, trustnerPreferred: Boolean(row.trustner_preferred),
    lastRefreshedAt: row.last_refreshed_at as string,
  };
}

function toCategoryBenchmark(row: Record<string, unknown>): CategoryBenchmark {
  return {
    category: row.category as FundCategory,
    median3y: Number(row.median_3y) || 0, median5y: Number(row.median_5y) || 0,
    top10Pct3y: Number(row.top_10_pct_3y) || 0, bottom10Pct3y: Number(row.bottom_10_pct_3y) || 0,
    totalFundsInCategory: (row.total_funds_in_category as number) || 0, asOfDate: row.as_of_date as string,
  };
}

function extractEntityField(entity: unknown, key: string): string | undefined {
  if (!entity) return undefined;
  if (Array.isArray(entity)) return entity.length > 0 ? ((entity[0] as Record<string, string>)[key]) : undefined;
  if (typeof entity === 'object' && entity !== null && key in entity) return (entity as Record<string, string>)[key];
  return undefined;
}
