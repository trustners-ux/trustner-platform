/**
 * Portfolio Diagnostic — Fund Data Client
 *
 * Wrapper around MFAPI.in (free public mutual fund API) + AMFI's
 * daily NAV file. Used by the weekly cron to populate pd_fund_master.
 *
 * Sources:
 *   - MFAPI.in:           https://api.mfapi.in/mf/{schemeCode}
 *   - AMFI Daily NAV:     https://www.amfiindia.com/spages/NAVAll.txt
 *
 * No API keys required. Free and unrestricted (per their docs as of 2026).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import type { FundCategory } from './types';

// ─────────────────────────────────────────────────────────────────
// MFAPI.in client
// ─────────────────────────────────────────────────────────────────

const MFAPI_BASE_URL = 'https://api.mfapi.in';

export interface MfApiNavEntry {
  date: string;       // 'DD-MM-YYYY' format from MFAPI
  nav: string;        // string, parse to number
}

export interface MfApiSchemeResponse {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
    isin_growth?: string;
    isin_div_reinvestment?: string;
  };
  data: MfApiNavEntry[];   // sorted descending (most recent first)
  status: string;
}

/**
 * Fetch the full NAV history for a single scheme. Returns null on error.
 */
export async function fetchMfApiScheme(
  schemeCode: string
): Promise<MfApiSchemeResponse | null> {
  try {
    const url = `${MFAPI_BASE_URL}/mf/${schemeCode}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      // 30s timeout via AbortController
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.warn(`[MFAPI] ${schemeCode} returned ${res.status}`);
      return null;
    }

    const data = (await res.json()) as MfApiSchemeResponse;
    if (data.status !== 'SUCCESS' || !data.data || data.data.length === 0) {
      return null;
    }
    return data;
  } catch (e) {
    console.warn(`[MFAPI] fetch error for ${schemeCode}:`, (e as Error).message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// AMFI Daily NAV file
// ─────────────────────────────────────────────────────────────────

const AMFI_NAV_URL = 'https://www.amfiindia.com/spages/NAVAll.txt';

export interface AmfiNavRow {
  schemeCode: string;
  isinGrowth?: string;
  isinDivReinvestment?: string;
  schemeName: string;
  nav: number;
  date: string;       // 'DD-MMM-YYYY' from AMFI; we normalise to YYYY-MM-DD
  amcName: string;
  schemeType: string;
  category: string;   // raw AMFI category — we map to our FundCategory
}

/**
 * Fetch and parse the daily AMFI NAV file. ~12,000 rows.
 * The file format is semi-structured: AMC headers, scheme-type headers,
 * then `code;ISIN1;ISIN2;name;nav;date` lines.
 */
export async function fetchAmfiNavFile(): Promise<AmfiNavRow[]> {
  const res = await fetch(AMFI_NAV_URL, {
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new Error(`AMFI NAV file returned ${res.status}`);
  }
  const text = await res.text();
  return parseAmfiNavFile(text);
}

/**
 * Parse the raw AMFI NAV file text into structured rows.
 * Exposed separately so we can unit-test the parser without a network call.
 */
export function parseAmfiNavFile(text: string): AmfiNavRow[] {
  const lines = text.split(/\r?\n/);
  const rows: AmfiNavRow[] = [];

  let currentAmc = '';
  let currentSchemeType = '';
  let currentCategory = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // AMC blocks are introduced like:  "Mutual Fund\nAxis Mutual Fund\n..."
    // We detect them by the pattern: lines that contain "Mutual Fund" but no semicolons
    if (!line.includes(';')) {
      // Likely a header (AMC name or scheme type)
      if (/mutual fund/i.test(line) && !line.includes('Open Ended')) {
        currentAmc = line;
      } else if (/open ended|close ended|interval/i.test(line)) {
        currentSchemeType = line;
        // Try to extract category from scheme-type header
        const categoryMatch = line.match(/-\s*(.+?)\s+Schemes?$/i);
        if (categoryMatch) currentCategory = categoryMatch[1].trim();
      }
      continue;
    }

    // Data row: schemeCode;ISIN-Growth;ISIN-DivReinv;schemeName;nav;date
    const parts = line.split(';').map((p) => p.trim());
    if (parts.length < 6) continue;

    const [schemeCode, isin1, isin2, schemeName, navStr, dateStr] = parts;
    const nav = parseFloat(navStr);
    if (!Number.isFinite(nav) || nav <= 0) continue;

    rows.push({
      schemeCode,
      isinGrowth: isin1 || undefined,
      isinDivReinvestment: isin2 || undefined,
      schemeName,
      nav,
      date: normaliseAmfiDate(dateStr),
      amcName: currentAmc,
      schemeType: currentSchemeType,
      category: currentCategory,
    });
  }

  return rows;
}

function normaliseAmfiDate(amfiDate: string): string {
  // '01-Apr-2026' → '2026-04-01'
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };
  const parts = amfiDate.split('-');
  if (parts.length !== 3) return amfiDate;
  const [d, m, y] = parts;
  const mm = months[m] ?? '01';
  return `${y}-${mm}-${d.padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────
// CAGR computation from NAV history
// ─────────────────────────────────────────────────────────────────

/**
 * Compute Compound Annual Growth Rate over N years using the most
 * recent NAV and the NAV ~N years ago.
 *
 * Returns null if insufficient history.
 */
export function computeCagrFromNavHistory(
  navHistory: MfApiNavEntry[],
  years: number
): number | null {
  if (!navHistory || navHistory.length === 0) return null;

  // Sort descending (most recent first) — MFAPI usually returns this way
  // but be defensive.
  const sorted = [...navHistory].sort((a, b) => {
    return parseDdMmYyyy(b.date).getTime() - parseDdMmYyyy(a.date).getTime();
  });

  const latest = sorted[0];
  if (!latest) return null;
  const latestNav = parseFloat(latest.nav);
  const latestDate = parseDdMmYyyy(latest.date);

  // Find NAV closest to (latestDate - years)
  const targetDate = new Date(latestDate);
  targetDate.setFullYear(targetDate.getFullYear() - years);

  // Walk through sorted (descending) and find first entry on or before target
  let baseEntry: MfApiNavEntry | null = null;
  for (const entry of sorted) {
    const d = parseDdMmYyyy(entry.date);
    if (d <= targetDate) {
      baseEntry = entry;
      break;
    }
  }

  if (!baseEntry) return null;
  const baseNav = parseFloat(baseEntry.nav);
  if (!Number.isFinite(baseNav) || baseNav <= 0) return null;

  const ratio = latestNav / baseNav;
  if (ratio <= 0) return null;
  return (Math.pow(ratio, 1 / years) - 1) * 100;
}

function parseDdMmYyyy(s: string): Date {
  // '01-04-2026' → Date
  const [d, m, y] = s.split('-').map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d);
}

// ─────────────────────────────────────────────────────────────────
// Category mapping (AMFI raw → our FundCategory enum)
// ─────────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, FundCategory> = {
  'Large Cap Fund': 'Large Cap',
  'Large & Mid Cap Fund': 'Large & Mid Cap',
  'Mid Cap Fund': 'Mid Cap',
  'Small Cap Fund': 'Small Cap',
  'Flexi Cap Fund': 'Flexi Cap',
  'Multi Cap Fund': 'Multi Cap',
  'Focused Fund': 'Focused',
  'Value Fund': 'Value',
  'Contra Fund': 'Contra',
  'ELSS': 'ELSS',
  'Aggressive Hybrid Fund': 'Aggressive Hybrid',
  'Conservative Hybrid Fund': 'Conservative Hybrid',
  'Multi Asset Allocation': 'Multi Asset',
  'Balanced Advantage': 'Balanced Advantage',
  'Arbitrage Fund': 'Arbitrage',
  'Liquid Fund': 'Liquid',
  'Ultra Short Duration Fund': 'Ultra Short',
  'Short Duration Fund': 'Short Duration',
  'Medium Duration Fund': 'Medium Duration',
  'Long Duration Fund': 'Long Duration',
  'Corporate Bond Fund': 'Corporate Bond',
  'Gilt Fund': 'Gilt',
  'Index Funds': 'Index',
  'Sectoral/Thematic': 'Sectoral / Thematic',
  'Gold ETFs': 'Gold ETF',
  'FoFs (Overseas)': 'International',
};

export function mapAmfiCategoryToInternal(
  amfiCategory: string
): FundCategory {
  if (!amfiCategory) return 'Other';

  // Exact match
  if (CATEGORY_MAP[amfiCategory]) return CATEGORY_MAP[amfiCategory];

  // Fuzzy match on key fragments
  const lower = amfiCategory.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key.toLowerCase())) return val;
  }

  // Fragment fallbacks
  if (lower.includes('small cap')) return 'Small Cap';
  if (lower.includes('mid cap')) return 'Mid Cap';
  if (lower.includes('large cap')) return 'Large Cap';
  if (lower.includes('flexi')) return 'Flexi Cap';
  if (lower.includes('multi cap')) return 'Multi Cap';
  if (lower.includes('hybrid')) return 'Aggressive Hybrid';
  if (lower.includes('index')) return 'Index';
  if (lower.includes('liquid')) return 'Liquid';
  if (lower.includes('debt')) return 'Short Duration';
  if (lower.includes('arbitrage')) return 'Arbitrage';
  if (lower.includes('gold')) return 'Gold ETF';
  if (lower.includes('international') || lower.includes('overseas')) return 'International';
  if (lower.includes('sectoral') || lower.includes('thematic')) return 'Sectoral / Thematic';

  return 'Other';
}

// ─────────────────────────────────────────────────────────────────
// Category benchmark calculator
// ─────────────────────────────────────────────────────────────────

export interface CategoryBenchmarkRow {
  category: FundCategory;
  median3y: number;
  median5y: number;
  top10Pct3y: number;
  bottom10Pct3y: number;
  totalFundsInCategory: number;
  asOfDate: string;
}

/**
 * Given a list of funds with 3Y and 5Y CAGRs, compute the category-wise
 * percentile benchmarks (median, top-10%, bottom-10%).
 */
export function computeCategoryBenchmarks(
  funds: Array<{
    category: FundCategory;
    cagr3y: number | null;
    cagr5y: number | null;
  }>,
  asOfDate: string
): CategoryBenchmarkRow[] {
  // Group by category
  const byCategory = new Map<FundCategory, Array<{ cagr3y: number | null; cagr5y: number | null }>>();
  for (const f of funds) {
    if (!byCategory.has(f.category)) byCategory.set(f.category, []);
    byCategory.get(f.category)!.push({ cagr3y: f.cagr3y, cagr5y: f.cagr5y });
  }

  const rows: CategoryBenchmarkRow[] = [];
  for (const [category, items] of byCategory.entries()) {
    const cagr3yValues = items.map((i) => i.cagr3y).filter((v): v is number => v !== null);
    const cagr5yValues = items.map((i) => i.cagr5y).filter((v): v is number => v !== null);

    if (cagr3yValues.length === 0) continue; // skip categories with no data

    rows.push({
      category,
      median3y: percentile(cagr3yValues, 50),
      median5y: cagr5yValues.length > 0 ? percentile(cagr5yValues, 50) : 0,
      top10Pct3y: percentile(cagr3yValues, 90),
      bottom10Pct3y: percentile(cagr3yValues, 10),
      totalFundsInCategory: items.length,
      asOfDate,
    });
  }

  return rows;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// ─────────────────────────────────────────────────────────────────
// Fund-name → AMFI code resolver (for CAS parsing matching)
// ─────────────────────────────────────────────────────────────────

/**
 * Match a raw CAS scheme name to a fund_master AMFI code via fuzzy
 * matching. The CAS PDF often abbreviates names; we normalise both
 * sides and use substring + token overlap.
 *
 * Returns null if no confident match (>=0.7 score).
 */
export function fuzzyMatchSchemeName(
  casName: string,
  candidates: Array<{ amfiCode: string; schemeName: string }>
): { amfiCode: string; confidence: number } | null {
  const norm = normaliseSchemeName(casName);
  const normTokens = new Set(norm.split(/\s+/).filter((t) => t.length > 2));

  let bestMatch: { amfiCode: string; confidence: number } | null = null;

  for (const candidate of candidates) {
    const candNorm = normaliseSchemeName(candidate.schemeName);
    const candTokens = new Set(candNorm.split(/\s+/).filter((t) => t.length > 2));

    // Token overlap (Jaccard)
    const intersection = [...normTokens].filter((t) => candTokens.has(t)).length;
    const union = new Set([...normTokens, ...candTokens]).size;
    const jaccard = union === 0 ? 0 : intersection / union;

    // Substring bonus
    const substringScore =
      candNorm.includes(norm) || norm.includes(candNorm) ? 0.15 : 0;

    const confidence = Math.min(1, jaccard + substringScore);

    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { amfiCode: candidate.amfiCode, confidence };
    }
  }

  if (!bestMatch || bestMatch.confidence < 0.7) return null;
  return bestMatch;
}

function normaliseSchemeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    // Common synonyms / suffixes we strip
    .replace(/\b(growth|reg|direct|plan|fund|scheme|idcw|dividend|reinvestment|payout)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
