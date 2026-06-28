/**
 * GET /api/funds/universe
 *
 * Public fund-universe feed for the /funds/explore page.
 * Joins pd_fund_master (live NAV + identity) with pd_fund_research_stats
 * (rich periodic snapshot — returns across 16 horizons, risk metrics,
 * allocation, valuation, etc.).
 *
 * Supports query params:
 *   ?category=<external_category>     filter by NGEN category
 *   ?broad=Equity|Debt|Hybrid|Other|Solution  filter by broad bucket
 *   ?q=<search>                       case-insensitive scheme_name search
 *   ?amc=<amc_name>                   filter by AMC
 *   ?sort=<col>:asc|desc              sort by column
 *   ?page=1&pageSize=50               pagination
 *
 * All proprietary feed scores are EXCLUDED from the public response. Only
 * industry-standard metrics are exposed (returns, Sharpe, Sortino, etc.).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// Whitelist of sortable columns
const SORTABLE = new Set([
  'scheme_name', 'amc_name', 'external_category',
  'live_nav', 'aum_inr_cr', 'ter', 'launch_date',
  'returns_1d', 'returns_5d', 'returns_mtd', 'returns_ytd',
  'returns_1m', 'returns_3m', 'returns_6m',
  'returns_1y', 'returns_2y', 'returns_3y', 'returns_5y', 'returns_7y', 'returns_10y', 'returns_15y',
  'returns_since_launch',
  'sharpe', 'sortino', 'volatility',
  'pe', 'pb', 'mkt_cap_cr',
  'large_cap_pct', 'mid_cap_pct', 'small_cap_pct', 'equity_pct',
  'ytm', 'avg_maturity', 'duration',
]);

// Whitelist of columns to return. NGEN/feed proprietary scores omitted.
const SELECT_COLUMNS = [
  'amfi_code', 'scheme_name', 'amc_name', 'amfi_category', 'amfi_sub_category',
  'external_category', 'broad_bucket', 'snapshot_date',
  'live_nav', 'live_nav_at', 'nav_date',
  'aum_inr_cr', 'riskometer', 'ter', 'launch_date',
  'returns_1d', 'returns_5d', 'returns_mtd', 'returns_ytd',
  'returns_1m', 'returns_3m', 'returns_6m',
  'returns_1y', 'returns_2y', 'returns_3y', 'returns_5y', 'returns_7y', 'returns_10y', 'returns_15y',
  'returns_since_launch',
  'annual_2025', 'annual_2024', 'annual_2023', 'annual_2022', 'annual_2021',
  'volatility', 'sharpe', 'sortino',
  'equity_pct', 'debt_pct', 'cash_pct', 'net_equity_pct',
  'large_cap_pct', 'mid_cap_pct', 'small_cap_pct',
  'holdings_count', 'top_3_pct', 'top_5_pct', 'top_10_pct', 'top_20_pct',
  'pe', 'pb', 'mkt_cap_cr',
  'ytm', 'avg_maturity', 'duration',
  'aaa_pct', 'aa_pct', 'a_pct', 'sov_pct',
  'trustner_preferred',
].join(',');

// Valid broad bucket values (computed by the view's CASE expression)
const VALID_BUCKETS = new Set(['Equity', 'Debt', 'Hybrid', 'Other', 'Solution']);

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
  }

  const url = new URL(req.url);
  const sp = url.searchParams;
  const category = sp.get('category');
  const broad = sp.get('broad');
  const q = sp.get('q')?.trim();
  const amc = sp.get('amc');
  const sortRaw = sp.get('sort') || 'aum_inr_cr:desc';
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
  // Cap at 2000 so power users (CSV export, advanced screener) can pull the
  // whole filtered set in one request. Default remains 50 for normal pagination.
  const pageSize = Math.min(2000, Math.max(10, parseInt(sp.get('pageSize') || '50', 10)));

  // Parse sort safely
  const [sortCol, sortDirRaw] = sortRaw.split(':');
  const safeSortCol = SORTABLE.has(sortCol) ? sortCol : 'aum_inr_cr';
  const ascending = sortDirRaw === 'asc';

  let query = supabase
    .from('pd_fund_universe_latest')
    .select(SELECT_COLUMNS, { count: 'exact' });

  // Only include funds that have a research snapshot (otherwise the page would
  // show 4,000+ rows with mostly-empty cells for the legacy AMFI-only universe).
  // The view returns NULL for snapshot_date when there's no research stats row.
  query = query.not('snapshot_date', 'is', null);

  if (category) query = query.eq('external_category', category);
  if (amc) query = query.eq('amc_name', amc);
  if (q) query = query.ilike('scheme_name', `%${q}%`);
  if (broad && VALID_BUCKETS.has(broad)) {
    query = query.eq('broad_bucket', broad);
  }

  query = query
    .order(safeSortCol, { ascending, nullsFirst: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;

  // If the underlying table/view doesn't exist yet, return empty universe
  // with a pendingSetup flag instead of a 500. Lets the UI render a
  // friendly "loading research universe" state.
  if (error) {
    const missingTable =
      /not\s+find\s+the\s+table|relation .* does not exist|schema cache/i.test(error.message);
    if (missingTable) {
      return NextResponse.json({
        rows: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        pendingSetup: true,
        message: 'Fund research universe is being prepared. Data will appear shortly.',
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Serve OUR SEBI-standard self-computed metrics as the PRIMARY numbers ──
  // pd_fund_metrics is refreshed nightly by /api/cron/universe-metrics from
  // authoritative NAV (memory project-funds-auto-engine). We prefer those for
  // the windows we compute (returns + risk), keep the NGEN snapshot for the
  // windows we don't (MTD/YTD/2Y/7Y/10Y/15Y + valuation/allocation), and ATTACH
  // the NGEN value as a `ngen_*` comparison field. Defensive: if pd_fund_metrics
  // doesn't exist yet (migration 052 not applied), keep the NGEN values as-is.
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  let metricsAsOf: string | null = null;
  // primary metric → (display column, ngen comparison key)
  const MAP: Array<[string, string, string]> = [
    ['ret_1d', 'returns_1d', 'ngen_ret_1d'],
    ['ret_1w', 'returns_5d', 'ngen_ret_5d'],
    ['ret_1m', 'returns_1m', 'ngen_ret_1m'],
    ['ret_3m', 'returns_3m', 'ngen_ret_3m'],
    ['ret_6m', 'returns_6m', 'ngen_ret_6m'],
    ['ret_1y', 'returns_1y', 'ngen_ret_1y'],
    ['ret_3y', 'returns_3y', 'ngen_ret_3y'],
    ['ret_5y', 'returns_5y', 'ngen_ret_5y'],
    ['ret_si', 'returns_since_launch', 'ngen_ret_si'],
    ['volatility', 'volatility', 'ngen_volatility'],
    ['sharpe', 'sharpe', 'ngen_sharpe'],
    ['sortino', 'sortino', 'ngen_sortino'],
    ['max_drawdown', 'max_drawdown', 'ngen_max_drawdown'],
  ];
  try {
    const codes = [...new Set(rows.map((r) => r.amfi_code).filter(Boolean))] as string[];
    const metrics: Record<string, unknown>[] = [];
    for (let i = 0; i < codes.length; i += 300) {
      const { data: chunk, error: mErr } = await supabase
        .from('pd_fund_metrics')
        .select('amfi_code, asof_date, identity_ok, ret_1d, ret_1w, ret_1m, ret_3m, ret_6m, ret_1y, ret_3y, ret_5y, ret_si, volatility, sharpe, sortino, max_drawdown')
        .in('amfi_code', codes.slice(i, i + 300));
      if (mErr) throw mErr; // table missing → bail, keep NGEN
      if (chunk) metrics.push(...(chunk as unknown as Record<string, unknown>[]));
    }
    const m = new Map(metrics.map((x) => [String(x.amfi_code), x]));
    for (const r of rows) {
      const fm = m.get(String(r.amfi_code));
      if (!fm || fm.identity_ok === false) { r.return_source = 'ngen'; continue; }
      for (const [metricKey, displayKey, ngenKey] of MAP) {
        if (fm[metricKey] != null) {
          r[ngenKey] = r[displayKey];          // preserve ngen for comparison
          r[displayKey] = fm[metricKey];       // primary = our computed value
        }
      }
      r.return_source = 'computed';
      const asof = fm.asof_date as string | null;
      if (asof && (!metricsAsOf || asof > metricsAsOf)) metricsAsOf = asof;
    }
  } catch { /* pd_fund_metrics not present yet — serve NGEN snapshot unchanged */ }

  return NextResponse.json({
    rows,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
    metricsAsOf,
  });
}
