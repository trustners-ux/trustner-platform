/**
 * Portfolio Diagnostic — Scoring Runner
 *
 * POST /api/admin/portfolio-diagnostic/[id]/score
 *
 * Walks every holding in the diagnostic, looks up the matched fund in
 * pd_fund_master, loads the latest category benchmark, runs the
 * deterministic scoring engine, and updates each holding with:
 *   - cagr_1y / 3y / 5y
 *   - category_median_3y / 5y
 *   - category_quartile
 *   - composite_score
 *   - verdict + verdict_rationale
 *   - recommended_replacement_amfi_code (for SWAP)
 *
 * Then re-tallies the diagnostic run's verdict counts.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  analyzeHolding,
  computeApproxXirr,
  computeHoldingPeriodMonths,
} from '@/lib/portfolio-diagnostic/scoring-engine';
import { fuzzyMatchSchemeName } from '@/lib/portfolio-diagnostic/fund-data-client';
import {
  linkSipsToHoldings,
  analyzeSip,
} from '@/lib/portfolio-diagnostic/sip-analytics';
import type {
  Verdict,
  FundCategory,
  RawHolding,
  RawSip,
  FundMaster,
  CategoryBenchmark,
  AnalyzedHolding,
  AnalyzedSip,
  EntityType,
} from '@/lib/portfolio-diagnostic/types';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const diagnosticRunId = parseInt(id, 10);

  // Auth
  const email = await resolveEmployeeEmail();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // ── Step 1: Load diagnostic + holdings + SIPs ──────────────
  const { data: run } = await supabase
    .from('pd_diagnostic_runs')
    .select('id, status, family_id, family_name')
    .eq('id', diagnosticRunId)
    .single();

  if (!run) {
    return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
  }

  if (!['DRAFT', 'CHANGES_REQUESTED', 'SUBMITTED', 'IN_REVIEW', 'ESCALATED'].includes(run.status as string)) {
    return NextResponse.json(
      { error: `Cannot score from status ${run.status}. Only draft/review-stage runs can be re-scored.` },
      { status: 400 }
    );
  }

  const { data: holdings } = await supabase
    .from('pd_diagnostic_holdings')
    .select('id, entity_id, fund_name, amfi_code, units, invested_inr, current_value_inr, first_investment_date, folio_number, entity:pd_family_entities(entity_name, entity_type)')
    .eq('diagnostic_run_id', diagnosticRunId);

  if (!holdings || holdings.length === 0) {
    return NextResponse.json({ error: 'No holdings to score' }, { status: 400 });
  }

  const { data: sips } = await supabase
    .from('pd_diagnostic_sips')
    .select('id, entity_id, fund_name, amfi_code, monthly_amount_inr, actual_amount_inr, frequency, start_date, status, has_step_up, step_up_pct, step_up_frequency, entity:pd_family_entities(entity_name)')
    .eq('diagnostic_run_id', diagnosticRunId);

  // ── Step 2: Load matching fund_master rows ─────────────────
  const amfiCodes = holdings.map((h) => h.amfi_code).filter(Boolean) as string[];
  const fundNames = holdings.map((h) => h.fund_name).filter(Boolean) as string[];

  const { data: fundsByCode } = await supabase
    .from('pd_fund_master')
    .select('amfi_code, scheme_name, amc_name, category, current_nav, fund_manager, manager_since_date, cagr_1y, cagr_3y, cagr_5y, cagr_10y, category_rank_3y, category_rank_5y, category_total, trustner_preferred, last_refreshed_at, aum_inr_cr, expense_ratio, sub_category')
    .in('amfi_code', amfiCodes.length > 0 ? amfiCodes : ['_no_match_']);

  // For holdings without an AMFI code, try in priority order:
  //   1. Exact name match (case-insensitive)
  //   2. ILIKE match against a small candidate set built from name keywords
  //   3. Fuzzy token match across Trustner-preferred funds only
  const fundsByHoldingId = new Map<number, FundMaster>();
  for (const h of holdings) {
    // Path 1: direct AMFI code match
    const direct = fundsByCode?.find((f) => f.amfi_code === h.amfi_code);
    if (direct) {
      fundsByHoldingId.set(h.id as number, toFundMaster(direct));
      continue;
    }

    const name = (h.fund_name as string) ?? '';
    if (!name) continue;

    // Path 2: exact match (case-insensitive)
    const { data: exactRows } = await supabase
      .from('pd_fund_master')
      .select('amfi_code, scheme_name, amc_name, category, current_nav, fund_manager, manager_since_date, cagr_1y, cagr_3y, cagr_5y, cagr_10y, category_rank_3y, category_rank_5y, category_total, trustner_preferred, last_refreshed_at, aum_inr_cr, expense_ratio, sub_category')
      .ilike('scheme_name', name)
      .limit(5);

    if (exactRows && exactRows.length > 0) {
      fundsByHoldingId.set(h.id as number, toFundMaster(exactRows[0]));
      continue;
    }

    // Path 3: substring match on first 3 distinctive tokens
    const tokens = name
      .split(/[\s\-,]+/)
      .filter((t) => t.length > 3 && !/(growth|direct|regular|plan|fund|idcw)/i.test(t))
      .slice(0, 3);

    if (tokens.length > 0) {
      // Build a query that requires ALL tokens
      let q = supabase
        .from('pd_fund_master')
        .select('amfi_code, scheme_name, amc_name, category, current_nav, fund_manager, manager_since_date, cagr_1y, cagr_3y, cagr_5y, cagr_10y, category_rank_3y, category_rank_5y, category_total, trustner_preferred, last_refreshed_at, aum_inr_cr, expense_ratio, sub_category')
        .ilike('scheme_name', '%growth%')
        .ilike('scheme_name', '%direct%');
      for (const tok of tokens) q = q.ilike('scheme_name', `%${tok}%`);
      const { data: tokenRows } = await q.limit(5);

      if (tokenRows && tokenRows.length > 0) {
        // Prefer the one whose name length is shortest (cleanest match)
        tokenRows.sort((a, b) => a.scheme_name.length - b.scheme_name.length);
        fundsByHoldingId.set(h.id as number, toFundMaster(tokenRows[0]));
        continue;
      }
    }

    // Path 4: fall back to fuzzy match against Trustner-preferred set
    const { data: preferredRows } = await supabase
      .from('pd_fund_master')
      .select('amfi_code, scheme_name, amc_name, category, current_nav, fund_manager, manager_since_date, cagr_1y, cagr_3y, cagr_5y, cagr_10y, category_rank_3y, category_rank_5y, category_total, trustner_preferred, last_refreshed_at, aum_inr_cr, expense_ratio, sub_category')
      .eq('trustner_preferred', true);
    if (preferredRows && preferredRows.length > 0) {
      const candidateList = preferredRows.map((c) => ({
        amfiCode: c.amfi_code as string,
        schemeName: c.scheme_name as string,
      }));
      const match = fuzzyMatchSchemeName(name, candidateList);
      if (match) {
        const matched = preferredRows.find((c) => c.amfi_code === match.amfiCode);
        if (matched) fundsByHoldingId.set(h.id as number, toFundMaster(matched));
      }
    }
  }

  // ── Step 3: Load category benchmarks ───────────────────────
  const categories = Array.from(
    new Set(
      Array.from(fundsByHoldingId.values()).map((f) => f.category)
    )
  );

  const { data: benchmarks } = await supabase
    .from('pd_category_benchmarks')
    .select('category, median_3y, median_5y, top_10_pct_3y, bottom_10_pct_3y, total_funds_in_category, as_of_date')
    .in('category', categories.length > 0 ? categories : ['_'])
    .order('as_of_date', { ascending: false });

  // Pick latest per category
  const benchmarkByCategory = new Map<FundCategory, CategoryBenchmark>();
  for (const b of benchmarks ?? []) {
    const cat = b.category as FundCategory;
    if (!benchmarkByCategory.has(cat)) {
      benchmarkByCategory.set(cat, toCategoryBenchmark(b));
    }
  }

  // ── Step 4: Score each holding + write back ────────────────
  const analyzedHoldings: AnalyzedHolding[] = [];
  let scored = 0;
  let skipped = 0;
  const skipReasons: string[] = [];

  for (const h of holdings) {
    const fund = fundsByHoldingId.get(h.id as number);
    if (!fund) {
      skipped++;
      skipReasons.push(`${h.fund_name}: no matching fund in master`);
      continue;
    }

    // Use a synthetic benchmark if none exists yet for this category
    const benchmark =
      benchmarkByCategory.get(fund.category) ??
      ({
        category: fund.category,
        median3y: 14, // industry-average equity proxy
        median5y: 14,
        top10Pct3y: 22,
        bottom10Pct3y: 8,
        totalFundsInCategory: 0,
        asOfDate: new Date().toISOString().split('T')[0],
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

    const analyzed = analyzeHolding({
      raw,
      fundMaster: fund,
      benchmark,
      entityId: String(h.entity_id),
      holdingId: String(h.id),
    });

    // Update DB with scored values
    await supabase
      .from('pd_diagnostic_holdings')
      .update({
        amfi_code: fund.amfiCode,
        category: fund.category,
        xirr_pct: analyzed.xirrPct,
        holding_period_months: analyzed.holdingPeriodMonths,
        cagr_1y: analyzed.cagr1y,
        cagr_3y: analyzed.cagr3y,
        cagr_5y: analyzed.cagr5y,
        category_median_3y: analyzed.categoryMedian3y,
        category_median_5y: analyzed.categoryMedian5y,
        category_quartile: analyzed.categoryQuartile,
        composite_score: analyzed.compositeScore,
        verdict: analyzed.verdict,
        verdict_rationale: analyzed.verdictRationale,
      })
      .eq('id', h.id as number);

    analyzedHoldings.push(analyzed);
    scored++;
  }

  // ── Step 5: Re-tally verdict counts on the diagnostic run ──
  const tally: Record<Verdict, number> = { STAR: 0, KEEP: 0, WATCH: 0, SWAP: 0, LIQUIDATE: 0 };
  let totalSwapValue = 0;
  let totalLiquidateValue = 0;
  for (const ah of analyzedHoldings) {
    tally[ah.verdict]++;
    if (ah.verdict === 'SWAP') totalSwapValue += ah.currentValueInr;
    if (ah.verdict === 'LIQUIDATE') totalLiquidateValue += ah.currentValueInr;
  }

  await supabase
    .from('pd_diagnostic_runs')
    .update({
      verdict_star_count: tally.STAR,
      verdict_keep_count: tally.KEEP,
      verdict_watch_count: tally.WATCH,
      verdict_swap_count: tally.SWAP,
      verdict_liquidate_count: tally.LIQUIDATE,
      total_swap_value_inr: totalSwapValue,
      total_liquidate_value_inr: totalLiquidateValue,
    })
    .eq('id', diagnosticRunId);

  // ── Step 6: Score SIPs (link to scored holdings) ───────────
  if (sips && sips.length > 0) {
    const analyzedSips: AnalyzedSip[] = [];
    for (const s of sips) {
      const fund = fundsByHoldingId.get(
        // Find holding for same entity + fund
        holdings.find(
          (h) =>
            h.entity_id === s.entity_id &&
            h.fund_name === s.fund_name
        )?.id as number
      );

      if (!fund) continue; // can't analyze SIP without fund data

      const raw: RawSip = {
        entityName: extractEntityField(s.entity, 'entity_name') ?? 'Unknown',
        fundName: s.fund_name as string,
        monthlyAmountInr: Number(s.monthly_amount_inr) || 0,
        actualAmountInr: Number(s.actual_amount_inr) || 0,
        frequency: s.frequency as RawSip['frequency'],
        startDate: s.start_date as string,
        status: s.status as RawSip['status'],
        hasStepUp: Boolean(s.has_step_up),
        stepUpPct: s.step_up_pct as number | undefined,
      };

      const analyzed = analyzeSip({
        raw,
        fundMaster: fund,
        entityId: String(s.entity_id),
      });
      analyzedSips.push(analyzed);
    }
    const linked = linkSipsToHoldings({ sips: analyzedSips, holdings: analyzedHoldings });

    for (let i = 0; i < linked.length; i++) {
      const sip = linked[i];
      const dbSip = sips[i];
      if (!dbSip) continue;
      await supabase
        .from('pd_diagnostic_sips')
        .update({
          category: sip.category,
          age_in_months: sip.ageInMonths,
          expected_annual_inflow_inr: sip.expectedAnnualInflowInr,
          expected_5y_inflow_inr: sip.expected5YInflowInr,
          fund_verdict: sip.fundVerdict,
          recommended_action: sip.recommendedAction,
          recommended_redirect_fund: sip.recommendedRedirectFund,
        })
        .eq('id', dbSip.id as number);
    }
  }

  return NextResponse.json({
    success: true,
    scored,
    skipped,
    skipReasons,
    verdictCounts: tally,
  });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return payload.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) return payload.email;
  }
  return null;
}

function toFundMaster(row: Record<string, unknown>): FundMaster {
  return {
    amfiCode: row.amfi_code as string,
    schemeName: row.scheme_name as string,
    amcName: row.amc_name as string,
    category: row.category as FundCategory,
    subCategory: row.sub_category as string | undefined,
    currentNav: Number(row.current_nav) || 0,
    aumInrCr: Number(row.aum_inr_cr) || 0,
    expenseRatio: Number(row.expense_ratio) || undefined,
    fundManager: row.fund_manager as string | undefined,
    managerSinceDate: row.manager_since_date as string | undefined,
    cagr1y: row.cagr_1y as number | null,
    cagr3y: row.cagr_3y as number | null,
    cagr5y: row.cagr_5y as number | null,
    cagr10y: row.cagr_10y as number | null,
    categoryRank3y: row.category_rank_3y as number | undefined,
    categoryRank5y: row.category_rank_5y as number | undefined,
    categoryTotal: row.category_total as number | undefined,
    trustnerPreferred: Boolean(row.trustner_preferred),
    lastRefreshedAt: row.last_refreshed_at as string,
  };
}

function toCategoryBenchmark(row: Record<string, unknown>): CategoryBenchmark {
  return {
    category: row.category as FundCategory,
    median3y: Number(row.median_3y) || 0,
    median5y: Number(row.median_5y) || 0,
    top10Pct3y: Number(row.top_10_pct_3y) || 0,
    bottom10Pct3y: Number(row.bottom_10_pct_3y) || 0,
    totalFundsInCategory: (row.total_funds_in_category as number) || 0,
    asOfDate: row.as_of_date as string,
  };
}

function extractEntityField(entity: unknown, key: string): string | undefined {
  if (!entity) return undefined;
  if (Array.isArray(entity)) {
    return entity.length > 0 ? ((entity[0] as Record<string, string>)[key]) : undefined;
  }
  if (typeof entity === 'object' && entity !== null && key in entity) {
    return (entity as Record<string, string>)[key];
  }
  return undefined;
}
