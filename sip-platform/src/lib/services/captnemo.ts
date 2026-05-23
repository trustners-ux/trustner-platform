/* ─────────────────────────────────────────────────────────
   Captnemo / Kuvera Enrichment Service

   Uses the Captnemo proxy (mf.captnemo.in) to fetch
   enrichment data from Kuvera for a mutual fund,
   looked up by ISIN.

   Provides: expense ratio, fund rating, AUM, volatility,
   fund manager, investment objective, SIP/lumpsum minimums,
   peer comparison data, and more.

   The Kuvera response shape is mapped to our
   CaptnemoEnrichment interface for consistent usage.
   ───────────────────────────────────────────────────────── */

import type { CaptnemoEnrichment, PeerFund } from '@/types/live-fund';
import { generateFundSlug } from '@/lib/utils/fund-slug';

const CAPTNEMO_BASE = 'https://mf.captnemo.in/kuvera';

// Timeout for Captnemo requests (5 seconds)
const FETCH_TIMEOUT = 5000;

// ─── Kuvera Response Types (raw shape from API) ───

interface KuveraFundResponse {
  name?: string;
  short_name?: string;
  returns?: {
    week_1?: number | null;
    year_1?: number | null;
    year_3?: number | null;
    year_5?: number | null;
    inception?: number | null;
  };
  expense_ratio?: string | null;
  expense_ratio_date?: string | null;
  fund_manager?: string | null;
  start_date?: string | null;
  crisil_rating?: string | null;
  fund_rating?: number | null;
  fund_rating_date?: string | null;
  aum?: number | null;
  volatility?: number | null;
  lock_in_period?: number | null;
  investment_objective?: string | null;
  category?: string | null;
  fund_type?: string | null;
  fund_category?: string | null;
  lump_min?: number | null;
  sip_min?: number | null;
  sip_available?: boolean;
  tags?: string[];
  comparison?: any[];
  code?: string;
}

// ─── Main Enrichment Function ───

/**
 * Fetch enrichment data for a fund by its ISIN (growth ISIN).
 *
 * Calls the Captnemo/Kuvera API, maps the response to our
 * CaptnemoEnrichment interface. Returns null if:
 * - ISIN is missing/empty
 * - The API request fails or times out (5s)
 * - The response is not in the expected format
 */
export async function enrichByISIN(isin: string): Promise<CaptnemoEnrichment | null> {
  if (!isin || isin.trim() === '') return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(`${CAPTNEMO_BASE}/${isin}`, {
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const json = await res.json();

    // Kuvera returns an array with one element
    const raw: KuveraFundResponse = Array.isArray(json) ? json[0] : json;
    if (!raw) return null;

    return mapKuveraToEnrichment(raw);
  } catch {
    // Timeout, network error, or parse error — fail gracefully
    return null;
  }
}

// ─── Response Mapping ───

/**
 * Map raw Kuvera response to our CaptnemoEnrichment interface.
 */
function mapKuveraToEnrichment(raw: KuveraFundResponse): CaptnemoEnrichment {
  return {
    shortName: raw.short_name || raw.name || '',
    returns: {
      oneWeek: raw.returns?.week_1 ?? null,
      oneYear: raw.returns?.year_1 ?? null,
      threeYear: raw.returns?.year_3 ?? null,
      fiveYear: raw.returns?.year_5 ?? null,
      sinceInception: raw.returns?.inception ?? null,
    },
    expenseRatio: parseExpenseRatio(raw.expense_ratio),
    expenseRatioDate: raw.expense_ratio_date ?? null,
    fundManager: raw.fund_manager ?? null,
    startDate: raw.start_date ?? null,
    crisilRating: raw.crisil_rating ?? null,
    fundRating: raw.fund_rating ?? null,
    fundRatingDate: raw.fund_rating_date ?? null,
    aum: raw.aum ?? null,
    volatility: raw.volatility ?? null,
    lockInPeriod: raw.lock_in_period ?? null,
    investmentObjective: raw.investment_objective ?? null,
    category: raw.category ?? null,
    fundType: raw.fund_type ?? null,
    fundCategory: raw.fund_category ?? null,
    lumpMin: raw.lump_min ?? null,
    sipMin: raw.sip_min ?? null,
    sipAvailable: raw.sip_available ?? false,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    comparison: mapComparison(raw.comparison),
  };
}

/**
 * Parse expense_ratio from string to number.
 * Kuvera may return it as a string like "0.45" or "1.23%".
 */
function parseExpenseRatio(value: string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace('%', '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Map the Kuvera comparison array to our PeerFund interface.
 */
function mapComparison(comparison: any[] | undefined): PeerFund[] {
  if (!Array.isArray(comparison)) return [];

  return comparison
    .filter((p: any) => p && (p.name || p.short_name))
    .map((p: any) => ({
      name: p.name || p.short_name || '',
      shortName: p.short_name || p.name || '',
      code: String(p.code || p.scheme_code || ''),
      slug: p.code
        ? generateFundSlug(Number(p.code), p.name || p.short_name || '')
        : '',
      oneYear: p.returns?.year_1 ?? null,
      threeYear: p.returns?.year_3 ?? null,
      fiveYear: p.returns?.year_5 ?? null,
      sinceInception: p.returns?.inception ?? null,
      volatility: p.volatility ?? null,
      expenseRatio: parseExpenseRatio(p.expense_ratio),
      aum: p.aum ?? null,
    }));
}
