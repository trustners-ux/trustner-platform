/* ─────────────────────────────────────────────────────────
   Unified Fund Data Service

   Orchestrates MFapi.in and Captnemo/Kuvera APIs to
   provide a single, merged view of mutual fund data.

   Key functions:
   - getFundDetail()    — Full fund detail with enrichment
   - getFundSummary()   — Lighter version for lists/cards
   - searchFunds()      — Cached search proxy
   - getTopPerformers() — Top-ranked funds from Trustner
                          curated list, enriched with live NAV

   All responses are cached in-memory (per serverless
   instance) with appropriate TTLs.
   ───────────────────────────────────────────────────────── */

import type {
  LiveFundDetail,
  LiveFundSummary,
  FundSearchResult,
} from '@/types/live-fund';
import type { FundCategory } from '@/types/funds';
import { cacheGet, cacheSet, CACHE_TTL } from './cache';
import {
  getLatestNav,
  calculateReturns,
  searchSchemes,
} from './mfapi';
import { enrichByISIN } from './captnemo';
import { generateFundSlug } from '@/lib/utils/fund-slug';
import {
  CURRENT_TRUSTNER_LIST,
  getTopRankedFunds,
  getFundsByRank,
} from '@/data/funds/trustner';

// ─── Fund Detail (full merged data) ───

/**
 * Get full fund detail by scheme code.
 *
 * Orchestration:
 * 1. Check cache (namespace: 'fundDetail', TTL: 6 hours)
 * 2. Fetch latest NAV + metadata from MFapi.in
 * 3. In parallel:
 *    a. Calculate 1Y/3Y/5Y returns from NAV history
 *    b. Enrich via Captnemo/Kuvera (using ISIN)
 * 4. Merge into LiveFundDetail
 * 5. Cache and return
 *
 * Returns null if MFapi fetch fails (fund not found).
 */
export async function getFundDetail(schemeCode: number): Promise<LiveFundDetail | null> {
  const cacheKey = String(schemeCode);

  // 1. Check cache
  const cached = cacheGet<LiveFundDetail>('fundDetail', cacheKey, CACHE_TTL.fundDetail);
  if (cached) {
    return { ...cached, cached: true };
  }

  // 2. Fetch latest NAV + metadata from MFapi
  const latest = await getLatestNav(schemeCode);
  if (!latest || !latest.data?.length) return null;

  const meta = latest.meta;
  const latestEntry = latest.data[0];
  const currentNav = parseFloat(latestEntry.nav);
  const navDate = latestEntry.date;
  const isinGrowth = meta.isin_growth || null;
  const isinDivReinvestment = meta.isin_div_reinvestment || null;

  // 3. In parallel: calculate returns + enrich via Captnemo
  const [calculatedReturns, enriched] = await Promise.all([
    calculateReturns(schemeCode, currentNav, navDate),
    isinGrowth ? enrichByISIN(isinGrowth) : Promise.resolve(null),
  ]);

  // 4. Merge into LiveFundDetail
  const slug = generateFundSlug(schemeCode, meta.scheme_name);

  const detail: LiveFundDetail = {
    schemeCode,
    schemeName: meta.scheme_name,
    fundHouse: meta.fund_house,
    schemeCategory: meta.scheme_category,
    schemeType: meta.scheme_type,
    isinGrowth,
    isinDivReinvestment,
    currentNav,
    navDate,
    calculatedReturns,
    enriched,
    slug,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };

  // 5. Cache and return
  cacheSet('fundDetail', cacheKey, detail);
  return detail;
}

// ─── Fund Summary (lighter version) ───

/**
 * Get a lightweight fund summary for list/card views.
 *
 * Uses cached detail if available; otherwise fetches fresh
 * data. The summary is a subset of the full detail,
 * pulling enriched data (AUM, expense ratio, rating) when
 * available.
 */
export async function getFundSummary(schemeCode: number): Promise<LiveFundSummary | null> {
  // Try to use cached full detail first
  const cachedDetail = cacheGet<LiveFundDetail>(
    'fundDetail',
    String(schemeCode),
    CACHE_TTL.fundDetail
  );

  if (cachedDetail) {
    return detailToSummary(cachedDetail);
  }

  // Fetch full detail (which also caches it)
  const detail = await getFundDetail(schemeCode);
  if (!detail) return null;

  return detailToSummary(detail);
}

/**
 * Convert a LiveFundDetail to a LiveFundSummary.
 * Picks the best available returns (enriched > calculated).
 */
function detailToSummary(detail: LiveFundDetail): LiveFundSummary {
  // Prefer enriched returns over calculated if available
  const returns = {
    oneYear: detail.enriched?.returns?.oneYear ?? detail.calculatedReturns.oneYear,
    threeYear: detail.enriched?.returns?.threeYear ?? detail.calculatedReturns.threeYear,
    fiveYear: detail.enriched?.returns?.fiveYear ?? detail.calculatedReturns.fiveYear,
  };

  return {
    schemeCode: detail.schemeCode,
    schemeName: detail.schemeName,
    fundHouse: detail.fundHouse,
    category: detail.enriched?.category || detail.schemeCategory,
    currentNav: detail.currentNav,
    navDate: detail.navDate,
    returns,
    aum: detail.enriched?.aum ?? null,
    expenseRatio: detail.enriched?.expenseRatio ?? null,
    rating: detail.enriched?.fundRating ?? null,
    slug: detail.slug,
  };
}

// ─── Search ───

/**
 * Search for mutual fund schemes by name.
 * Cached proxy to MFapi.in search. Returns up to 20 results.
 */
export async function searchFunds(query: string): Promise<FundSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  return searchSchemes(query);
}

// ─── Top Performers ───

/**
 * Get top-performing funds, optionally filtered by category.
 *
 * Uses Trustner curated fund list as the source of truth
 * for top rankings, then enriches each with live NAV data.
 *
 * Strategy:
 * - If category is provided, get rank-1 funds in that category
 * - Otherwise, get top-ranked funds across all categories
 * - For each, attempt to resolve scheme code and fetch live summary
 * - Falls back to static data if live fetch fails
 *
 * Results are cached for 12 hours.
 */
export async function getTopPerformers(category?: string): Promise<LiveFundSummary[]> {
  const cacheKey = `topPerformers:${category || 'all'}`;
  const cached = cacheGet<LiveFundSummary[]>(
    'topPerformers',
    cacheKey,
    CACHE_TTL.topPerformers
  );
  if (cached) return cached;

  // Get curated funds from Trustner static data
  let curatedFunds;
  if (category) {
    curatedFunds = getFundsByRank(category as FundCategory);
  } else {
    curatedFunds = getTopRankedFunds(15);
  }

  if (!curatedFunds.length) return [];

  // For each curated fund, try to find it via MFapi search
  // and enrich with live NAV data
  const summaryPromises = curatedFunds.map(async (fund) => {
    try {
      // Search MFapi by the fund's full name to get scheme code
      const searchResults = await searchSchemes(fund.name);

      if (!searchResults.length) {
        // Fallback: return static data as a summary
        return curatedFundToSummary(fund);
      }

      // Use the first matching result's scheme code
      const schemeCode = searchResults[0].schemeCode;

      // Try to get live summary
      const liveSummary = await getFundSummary(schemeCode);
      if (liveSummary) return liveSummary;

      // Fallback to static data
      return curatedFundToSummary(fund);
    } catch {
      // Any error: fallback to static data
      return curatedFundToSummary(fund);
    }
  });

  const results = await Promise.all(summaryPromises);

  // Filter out nulls and cache
  const validResults = results.filter(
    (r): r is LiveFundSummary => r !== null
  );

  cacheSet('topPerformers', cacheKey, validResults);
  return validResults;
}

// ─── Helpers ───

/**
 * Convert a Trustner curated fund (static data) into a LiveFundSummary.
 * Used as fallback when live API calls fail.
 */
function curatedFundToSummary(
  fund: ReturnType<typeof getTopRankedFunds>[number]
): LiveFundSummary {
  return {
    schemeCode: 0, // Unknown — static data doesn't have MFapi scheme code
    schemeName: fund.name,
    fundHouse: extractFundHouse(fund.name),
    category: fund.category,
    currentNav: 0,
    navDate: CURRENT_TRUSTNER_LIST.lastUpdated,
    returns: {
      oneYear: fund.returns.oneYear,
      threeYear: fund.returns.threeYear,
      fiveYear: fund.returns.fiveYear || null,
    },
    aum: fund.aumCr,
    expenseRatio: fund.ter,
    rating: null,
    slug: generateFundSlug(0, fund.name),
  };
}

/**
 * Extract fund house name from scheme name.
 * Most scheme names start with the AMC name.
 * e.g. "Nippon India Large Cap Fund (G)" -> "Nippon India"
 */
function extractFundHouse(schemeName: string): string {
  // Common keywords that mark the end of fund house name
  const keywords = [
    'Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'Multi Cap',
    'ELSS', 'Focused', 'Value', 'Index', 'Contra',
    'Multi Asset', 'Balanced Advantage', 'Aggressive Hybrid',
    'Equity Savings', 'Conservative Hybrid', 'Gold', 'Silver',
    'Fund of Fund', 'Liquid', 'Ultra Short', 'Short Term',
    'Overnight', 'Money Market', 'Dynamic Bond',
  ];

  for (const kw of keywords) {
    const idx = schemeName.indexOf(kw);
    if (idx > 0) {
      return schemeName.substring(0, idx).trim();
    }
  }

  // Fallback: take first two words
  const parts = schemeName.split(/\s+/);
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] || 'Unknown';
}

// ─── Category Utilities ───

/**
 * Get all available fund categories from the Trustner curated list.
 * Cached for 24 hours.
 */
export function getAvailableCategories(): string[] {
  return CURRENT_TRUSTNER_LIST.categories.map((c) => c.displayName);
}
