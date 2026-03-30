/* ─────────────────────────────────────────────────────────
   MFapi.in Service

   Wraps all calls to the free MFapi.in API for:
   - Searching mutual fund schemes by name
   - Fetching latest NAV + metadata
   - Fetching historical NAV near a target date
   - Fetching full NAV history (for charts)
   - Calculating CAGR returns from historical NAVs

   Based on patterns from the existing live-nav/route.ts
   but extracted into a reusable service layer.
   ───────────────────────────────────────────────────────── */

import type { FundSearchResult, NavHistoryPoint } from '@/types/live-fund';
import { cacheGet, cacheSet, CACHE_TTL } from './cache';

const MFAPI_BASE = 'https://api.mfapi.in/mf';

// ─── MFapi Response Types ───

export interface MfapiLatestResponse {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
    isin_growth: string | null;
    isin_div_reinvestment: string | null;
  };
  data: Array<{ date: string; nav: string }>;
  status: string;
}

interface MfapiSearchResult {
  schemeCode: number;
  schemeName: string;
}

// ─── Date Utilities ───

/**
 * Parse MFapi date format (DD-MM-YYYY) to a JS Date.
 * MFapi returns dates like "07-03-2026".
 */
export function parseMfapiDate(dateStr: string): Date {
  const [dd, mm, yyyy] = dateStr.split('-');
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

/**
 * Format a Date to YYYY-MM-DD for MFapi query params.
 */
export function toQueryDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Format a Date to DD-MM-YYYY (MFapi display format).
 */
function toMfapiDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${dd}-${mm}-${yyyy}`;
}

// ─── CAGR Calculation ───

/**
 * Calculate Compound Annual Growth Rate.
 * Returns the rate as a decimal (e.g. 0.12 for 12%).
 */
export function cagr(currentNav: number, oldNav: number, years: number): number {
  if (oldNav <= 0 || years <= 0) return 0;
  return Math.pow(currentNav / oldNav, 1 / years) - 1;
}

// ─── API Functions ───

/**
 * Search for mutual fund schemes by name.
 * Returns up to 20 results. Cached for 30 minutes.
 */
export async function searchSchemes(query: string): Promise<FundSearchResult[]> {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = cacheGet<FundSearchResult[]>('search', cacheKey, CACHE_TTL.search);
  if (cached) return cached;

  try {
    const res = await fetch(
      `${MFAPI_BASE}/search?q=${encodeURIComponent(query)}`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];

    const results: MfapiSearchResult[] = await res.json();
    if (!Array.isArray(results)) return [];

    const mapped: FundSearchResult[] = results.slice(0, 20).map((r) => ({
      schemeCode: r.schemeCode,
      schemeName: r.schemeName,
    }));

    cacheSet('search', cacheKey, mapped);
    return mapped;
  } catch {
    return [];
  }
}

/**
 * Fetch the latest NAV and full metadata for a scheme.
 * Returns null if the fetch fails or scheme is not found.
 */
export async function getLatestNav(schemeCode: number): Promise<MfapiLatestResponse | null> {
  try {
    const res = await fetch(
      `${MFAPI_BASE}/${schemeCode}/latest`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;

    const json: MfapiLatestResponse = await res.json();
    if (json.status !== 'SUCCESS' || !json.data?.length) return null;

    return json;
  } catch {
    return null;
  }
}

/**
 * Find the closest NAV to a target date (within a 10-day window).
 * Searches +/- 5 days around the target date to handle
 * weekends and holidays when NAV isn't published.
 */
export async function fetchNavNearDate(
  schemeCode: number,
  targetDate: Date
): Promise<{ nav: number; date: string } | null> {
  try {
    const start = new Date(targetDate);
    start.setDate(start.getDate() - 5);
    const end = new Date(targetDate);
    end.setDate(end.getDate() + 5);

    const res = await fetch(
      `${MFAPI_BASE}/${schemeCode}?startDate=${toQueryDate(start)}&endDate=${toQueryDate(end)}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;

    const json = await res.json();
    if (json.status !== 'SUCCESS' || !json.data?.length) return null;

    // Data is reverse-chronological; find entry closest to target
    let closest = json.data[0];
    let minDiff = Math.abs(parseMfapiDate(closest.date).getTime() - targetDate.getTime());

    for (const entry of json.data) {
      const diff = Math.abs(parseMfapiDate(entry.date).getTime() - targetDate.getTime());
      if (diff < minDiff) {
        closest = entry;
        minDiff = diff;
      }
    }

    return { nav: parseFloat(closest.nav), date: closest.date };
  } catch {
    return null;
  }
}

/**
 * Fetch NAV history for charting.
 *
 * For 1Y/3Y/5Y: uses startDate/endDate query params.
 * For MAX: fetches all data.
 *
 * Samples to max 500 points for chart performance —
 * keeps first, last, and evenly-spaced intermediate points.
 */
export async function getNavHistory(
  schemeCode: number,
  period: '1Y' | '3Y' | '5Y' | 'MAX'
): Promise<NavHistoryPoint[]> {
  const cacheKey = `navHistory:${schemeCode}:${period}`;
  const cached = cacheGet<NavHistoryPoint[]>('navHistory', cacheKey, CACHE_TTL.navHistory);
  if (cached) return cached;

  try {
    let url = `${MFAPI_BASE}/${schemeCode}`;

    // For specific periods, use date range params
    if (period !== 'MAX') {
      const now = new Date();
      const start = new Date(now);
      const yearsBack = period === '1Y' ? 1 : period === '3Y' ? 3 : 5;
      start.setFullYear(start.getFullYear() - yearsBack);
      url += `?startDate=${toQueryDate(start)}&endDate=${toQueryDate(now)}`;
    }

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];

    const json = await res.json();
    if (json.status !== 'SUCCESS' || !json.data?.length) return [];

    // MFapi data is reverse-chronological; reverse to chronological
    const allPoints: NavHistoryPoint[] = json.data
      .reverse()
      .map((entry: { date: string; nav: string }) => {
        const parsed = parseMfapiDate(entry.date);
        return {
          date: toQueryDate(parsed),
          nav: parseFloat(entry.nav),
        };
      });

    // Sample to max 500 points for chart performance
    const sampled = sampleNavPoints(allPoints, 500);

    cacheSet('navHistory', cacheKey, sampled);
    return sampled;
  } catch {
    return [];
  }
}

/**
 * Calculate 1Y, 3Y, 5Y CAGR returns for a scheme.
 * Uses fetchNavNearDate to find historical NAVs and
 * the cagr function for calculation.
 */
export async function calculateReturns(
  schemeCode: number,
  currentNav: number,
  navDate: string
): Promise<{ oneYear: number | null; threeYear: number | null; fiveYear: number | null }> {
  const today = parseMfapiDate(navDate);

  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const threeYearsAgo = new Date(today);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  const fiveYearsAgo = new Date(today);
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const [nav1Y, nav3Y, nav5Y] = await Promise.all([
    fetchNavNearDate(schemeCode, oneYearAgo),
    fetchNavNearDate(schemeCode, threeYearsAgo),
    fetchNavNearDate(schemeCode, fiveYearsAgo),
  ]);

  return {
    oneYear: nav1Y ? cagr(currentNav, nav1Y.nav, 1) : null,
    threeYear: nav3Y ? cagr(currentNav, nav3Y.nav, 3) : null,
    fiveYear: nav5Y ? cagr(currentNav, nav5Y.nav, 5) : null,
  };
}

// ─── Internal Helpers ───

/**
 * Downsample NAV history to a maximum number of points.
 * Keeps first and last points, then evenly spaces the rest.
 */
function sampleNavPoints(points: NavHistoryPoint[], maxPoints: number): NavHistoryPoint[] {
  if (points.length <= maxPoints) return points;

  const sampled: NavHistoryPoint[] = [points[0]];
  const step = (points.length - 1) / (maxPoints - 1);

  for (let i = 1; i < maxPoints - 1; i++) {
    const idx = Math.round(i * step);
    sampled.push(points[idx]);
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}

// Re-export toMfapiDate for potential use by other services
export { toMfapiDate };
