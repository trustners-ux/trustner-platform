/**
 * pd-fund-detail.ts
 *
 * Server-only helpers for per-fund detail pages at /funds/[amfi_code].
 *
 * Reads from the pd_fund_universe_latest view (pd_fund_master + latest
 * pd_fund_research_stats snapshot) with a STRICT whitelist that excludes
 * all proprietary feed_* scores. The view is defined in migration 016.
 *
 * Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import 'server-only';
import { getSupabaseAdmin } from '@/lib/db/supabase';

// ─── Public Fund Detail shape (NO feed_* fields) ───────────
export interface FundDetail {
  // Identity
  amfi_code: string;
  scheme_name: string;
  amc_name: string | null;
  amfi_category: string | null;
  amfi_sub_category: string | null;
  external_category: string | null;
  broad_bucket: string | null;
  snapshot_date: string | null;

  // NAV + price
  live_nav: number | null;
  live_nav_at: string | null;
  nav_date: string | null;

  // Scheme info
  aum_inr_cr: number | null;
  riskometer: string | null;
  ter: number | null;
  launch_date: string | null;

  // Returns — periodic
  returns_1d: number | null;
  returns_5d: number | null;
  returns_mtd: number | null;
  returns_ytd: number | null;
  returns_1m: number | null;
  returns_3m: number | null;
  returns_6m: number | null;
  returns_1y: number | null;
  returns_2y: number | null;
  returns_3y: number | null;
  returns_5y: number | null;
  returns_7y: number | null;
  returns_10y: number | null;
  returns_15y: number | null;
  returns_since_launch: number | null;

  // Returns — calendar-year
  annual_2025: number | null;
  annual_2024: number | null;
  annual_2023: number | null;
  annual_2022: number | null;
  annual_2021: number | null;

  // Risk
  volatility: number | null;
  sharpe: number | null;
  sortino: number | null;

  // Allocation
  equity_pct: number | null;
  debt_pct: number | null;
  cash_pct: number | null;
  net_equity_pct: number | null;
  large_cap_pct: number | null;
  mid_cap_pct: number | null;
  small_cap_pct: number | null;
  holdings_count: number | null;
  top_3_pct: number | null;
  top_5_pct: number | null;
  top_10_pct: number | null;
  top_20_pct: number | null;

  // Valuation
  pe: number | null;
  pb: number | null;
  mkt_cap_cr: number | null;

  // Debt
  ytm: number | null;
  avg_maturity: number | null;
  duration: number | null;
  aaa_pct: number | null;
  aa_pct: number | null;
  a_pct: number | null;
  sov_pct: number | null;

  // Curation
  trustner_preferred: boolean | null;
}

// Public whitelist — proprietary feed_* columns are explicitly excluded.
const PUBLIC_SELECT = [
  'amfi_code',
  'scheme_name',
  'amc_name',
  'amfi_category',
  'amfi_sub_category',
  'external_category',
  'broad_bucket',
  'snapshot_date',
  'live_nav',
  'live_nav_at',
  'nav_date',
  'aum_inr_cr',
  'riskometer',
  'ter',
  'launch_date',
  'returns_1d',
  'returns_5d',
  'returns_mtd',
  'returns_ytd',
  'returns_1m',
  'returns_3m',
  'returns_6m',
  'returns_1y',
  'returns_2y',
  'returns_3y',
  'returns_5y',
  'returns_7y',
  'returns_10y',
  'returns_15y',
  'returns_since_launch',
  'annual_2025',
  'annual_2024',
  'annual_2023',
  'annual_2022',
  'annual_2021',
  'volatility',
  'sharpe',
  'sortino',
  'equity_pct',
  'debt_pct',
  'cash_pct',
  'net_equity_pct',
  'large_cap_pct',
  'mid_cap_pct',
  'small_cap_pct',
  'holdings_count',
  'top_3_pct',
  'top_5_pct',
  'top_10_pct',
  'top_20_pct',
  'pe',
  'pb',
  'mkt_cap_cr',
  'ytm',
  'avg_maturity',
  'duration',
  'aaa_pct',
  'aa_pct',
  'a_pct',
  'sov_pct',
  'trustner_preferred',
].join(',');

/**
 * The NGEN feed (and thus pd_fund_universe_latest) stores every percent-style
 * field as a FRACTION (0.0859 = 8.59%, 0.0213 = 2.13% TER). The fund-detail
 * page + OG image + by-amfi API all format these as `n.toFixed()%` — so without
 * a ×100 here every fund showed returns/TER/volatility 100× too small
 * ("-0.0% 1Y"). Convert at the single data boundary so all consumers are
 * consistent. Ratios/absolutes (sharpe, sortino, pe, pb, mkt-cap) pass through.
 */
const PCT_FIELDS: readonly string[] = [
  'returns_1d', 'returns_5d', 'returns_1m', 'returns_3m', 'returns_6m',
  'returns_1y', 'returns_2y', 'returns_3y', 'returns_5y', 'returns_7y',
  'returns_10y', 'returns_15y', 'returns_since_launch',
  'annual_2025', 'annual_2024', 'annual_2023', 'annual_2022', 'annual_2021',
  'ter', 'volatility', 'hist_var', 'imp_var',
  'equity_pct', 'debt_pct', 'cash_pct', 'net_equity_pct',
  'large_cap_pct', 'mid_cap_pct', 'small_cap_pct',
  'top_3_pct', 'top_5_pct', 'top_10_pct', 'top_20_pct',
  'ytm', 'net_ytm', 'aaa_pct', 'aa_pct', 'a_pct', 'sov_pct', 'turnover_cost',
];

function normalizeFundPercents(row: FundDetail | null): FundDetail | null {
  if (!row) return row;
  const out = { ...row } as unknown as Record<string, unknown>;
  for (const k of PCT_FIELDS) {
    const v = out[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v * 100;
  }
  // Drop known feed garbage (now in %): an equity TER never exceeds ~2.5%, and
  // a fund's annualised vol never exceeds ~60% — implausible values are corrupt.
  if (typeof out.ter === 'number' && (out.ter as number) > 3.5) out.ter = null;
  if (typeof out.volatility === 'number' && (out.volatility as number) > 60) out.volatility = null;
  return out as unknown as FundDetail;
}

/**
 * Fetch a single fund row from pd_fund_universe_latest by amfi_code.
 * Returns null if not found, DB unavailable, or amfi_code is malformed.
 */
export async function getFundByAmfiCode(
  amfi_code: string
): Promise<FundDetail | null> {
  if (!/^[0-9]{4,7}$/.test(amfi_code)) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('pd_fund_universe_latest')
    .select(PUBLIC_SELECT)
    .eq('amfi_code', amfi_code)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeFundPercents(data as unknown as FundDetail);
}

export interface SitemapFundRef {
  amfi_code: string;
  lastModified: string; // ISO
}

/**
 * Every indexable per-fund page for the sitemap. We index the Regular-plan,
 * Growth-ish universe only — Trustner is an MFD that sells Regular plans, so
 * Direct twins must NOT be indexed, and IDCW (dividend-distribution) variants
 * are near-duplicate thin pages that would dilute the canonical Growth scheme.
 * Requires a live NAV (a page with no NAV is not worth a crawl budget).
 */
export async function getSitemapFundCodes(): Promise<SitemapFundRef[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const out: SitemapFundRef[] = [];
  const PAGE = 1000;
  for (let from = 0; from < 8000; from += PAGE) {
    const { data, error } = await supabase
      .from('pd_fund_universe_latest')
      .select('amfi_code, live_nav_at, snapshot_date')
      .not('live_nav', 'is', null)
      .not('scheme_name', 'ilike', '%direct%')
      .not('scheme_name', 'ilike', '%idcw%')
      .order('amfi_code', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data as Array<Record<string, unknown>>) {
      const code = r.amfi_code;
      if (typeof code !== 'string' || !/^[0-9]{4,7}$/.test(code)) continue;
      out.push({
        amfi_code: code,
        lastModified:
          (typeof r.live_nav_at === 'string' && r.live_nav_at) ||
          (typeof r.snapshot_date === 'string' && r.snapshot_date) ||
          new Date().toISOString(),
      });
    }
    if (data.length < PAGE) break;
  }
  return out;
}

/**
 * Fetch top peers in the same external_category, ordered by AUM (desc),
 * excluding the current fund. Used for the peer-comparison block.
 */
export async function getCategoryPeers(
  external_category: string,
  excludeAmfiCode: string,
  limit = 8
): Promise<FundDetail[]> {
  if (!external_category) return [];

  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pd_fund_universe_latest')
    .select(PUBLIC_SELECT)
    .eq('external_category', external_category)
    .neq('amfi_code', excludeAmfiCode)
    .not('snapshot_date', 'is', null)
    .order('aum_inr_cr', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as unknown as FundDetail[]).map((r) => normalizeFundPercents(r)!);
}

/**
 * Compute the category median for the 9 standard return horizons.
 * Used to render the "Category Median" row in the returns table.
 * Pulls up to 200 peers in the category to keep the median stable.
 */
export interface CategoryMedianReturns {
  returns_1d: number | null;
  returns_5d: number | null;
  returns_1m: number | null;
  returns_3m: number | null;
  returns_6m: number | null;
  returns_1y: number | null;
  returns_3y: number | null;
  returns_5y: number | null;
  returns_10y: number | null;
  sampleSize: number;
}

export async function getCategoryMedianReturns(
  external_category: string
): Promise<CategoryMedianReturns | null> {
  if (!external_category) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const RETURN_COLS = [
    'returns_1d',
    'returns_5d',
    'returns_1m',
    'returns_3m',
    'returns_6m',
    'returns_1y',
    'returns_3y',
    'returns_5y',
    'returns_10y',
  ] as const;

  const { data, error } = await supabase
    .from('pd_fund_universe_latest')
    .select(RETURN_COLS.join(','))
    .eq('external_category', external_category)
    .not('snapshot_date', 'is', null)
    .limit(200);

  if (error || !data || data.length === 0) return null;

  const median = (vals: number[]): number | null => {
    if (vals.length === 0) return null;
    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  };

  const rows = data as unknown as Array<Record<string, number | null>>;
  const result = {} as Record<string, number | null>;
  for (const col of RETURN_COLS) {
    const vals = rows
      .map((r) => r[col])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const m = median(vals);
    // Returns are stored as fractions in the feed — convert to display percent
    // so the peer-median lines up with the (already ×100) per-fund returns.
    result[col] = m === null ? null : m * 100;
  }

  return {
    returns_1d: result.returns_1d,
    returns_5d: result.returns_5d,
    returns_1m: result.returns_1m,
    returns_3m: result.returns_3m,
    returns_6m: result.returns_6m,
    returns_1y: result.returns_1y,
    returns_3y: result.returns_3y,
    returns_5y: result.returns_5y,
    returns_10y: result.returns_10y,
    sampleSize: rows.length,
  };
}

/**
 * Detects whether a scheme name indicates a Direct Plan.
 * Trustner serves Regular plans only — UI must suppress the Start-SIP CTA
 * for Direct schemes and show a note instead.
 */
export function isDirectPlan(scheme_name: string): boolean {
  return /\bdirect\b/i.test(scheme_name);
}
