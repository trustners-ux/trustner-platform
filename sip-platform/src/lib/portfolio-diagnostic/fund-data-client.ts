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
      // 60s timeout — MFAPI can be slow under load
      signal: AbortSignal.timeout(60_000),
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

const AMFI_NAV_URL = 'https://portal.amfiindia.com/spages/NAVAll.txt';

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
    if (!line || line.startsWith('Scheme Code;')) continue;

    // Lines without semicolons are headers (scheme-type or AMC name)
    if (!line.includes(';')) {
      // Scheme-type header looks like:
      //   "Open Ended Schemes(Debt Scheme - Banking and PSU Fund)"
      //   "Open Ended Schemes(Equity Scheme - Large Cap Fund)"
      //   "Close Ended Schemes(Income)"
      // The category sits INSIDE the parentheses, often after a dash.
      const schemeTypeMatch = line.match(/^(Open|Close|Interval)\s+Ended\s+Schemes?\s*\((.+?)\)/i);
      if (schemeTypeMatch) {
        currentSchemeType = schemeTypeMatch[1] + ' Ended';
        const rawCategory = schemeTypeMatch[2].trim();
        // Strip the "Equity Scheme - " / "Debt Scheme - " / "Hybrid Scheme - " prefix
        const dashIdx = rawCategory.indexOf(' - ');
        currentCategory = dashIdx > 0 ? rawCategory.slice(dashIdx + 3).trim() : rawCategory;
        continue;
      }
      // AMC header lines look like:  "Aditya Birla Sun Life Mutual Fund"
      if (/mutual fund\s*$/i.test(line)) {
        currentAmc = line;
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
 * Extract the SEBI fund-category token that defines what a scheme IS
 * (small cap vs multi cap vs liquid …). This is the single most
 * discriminating part of an Indian scheme name, yet a plain token
 * overlap weights "small" no more than "canara" — which is how
 * "Canara Robeco Small Cap" once matched "Canara Robeco Multi Cap".
 *
 * Returns a canonical key, or null when the name carries no determinate
 * category token (e.g. a truncated "ICICI Prudential Multi", or a
 * sectoral/FoF name) — null means "don't use category as a guard".
 *
 * Order matters: the most specific phrase must be tested first
 * (largemid before large/mid, multiasset before multi, etc.).
 */
export function extractCategoryToken(name: string): string | null {
  const s = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (/(largeandmidcap|largemidcap|largeandmid|largemid)/.test(s)) return 'largemid';
  if (/multiassetallocation|multiasset/.test(s)) return 'multiasset';
  if (/multicap/.test(s)) return 'multi';
  if (/(flexicap|flexi)/.test(s)) return 'flexi';
  if (/smallcap/.test(s)) return 'small';
  if (/midcap/.test(s)) return 'mid';
  if (/largecap|bluechip/.test(s)) return 'large';
  if (/(elss|taxsaver|taxsaving|longtermequity|taxrelief)/.test(s)) return 'elss';
  if (/dividendyield/.test(s)) return 'dividendyield';
  if (/focus(s)?ed/.test(s)) return 'focused';
  if (/contra/.test(s)) return 'contra';
  if (/value(fund|discovery|oriented)?/.test(s) && !/valueresearch/.test(s)) return 'value';
  if (/balancedadvantage|dynamicasset/.test(s)) return 'baf';
  if (/aggressivehybrid|equityhybrid/.test(s)) return 'agghybrid';
  if (/conservativehybrid/.test(s)) return 'conshybrid';
  if (/equitysavings/.test(s)) return 'equitysavings';
  if (/arbitrage/.test(s)) return 'arbitrage';
  if (/overnight/.test(s)) return 'overnight';
  if (/liquidfund|liquid/.test(s)) return 'liquid';
  if (/(index|nifty|sensex|etf)/.test(s)) return 'index';
  return null;
}

/** First (AMC) token of a normalised scheme name — "axis", "hdfc", "icici"… */
export function amcHeadToken(name: string): string {
  return normaliseSchemeName(name).split(/\s+/)[0] || '';
}

/**
 * Sanity-check a candidate fund against a holding name before trusting
 * it. Used both as a guard on a pre-stored amfi_code (a CAS PDF or an
 * older matcher can write a wrong code) and inside the fuzzy matcher.
 * Rejects when the two disagree on AMC or on fund category — the two
 * ways a confident-but-wrong match happens (wrong AMC: Axis→Union;
 * wrong sub-category: Small→Multi, Focused→Liquid).
 */
export function isPlausibleCodeMatch(holdingName: string, fundSchemeName: string): boolean {
  const hCat = extractCategoryToken(holdingName);
  const fCat = extractCategoryToken(fundSchemeName);
  if (hCat && fCat && hCat !== fCat) return false;
  const hAmc = amcHeadToken(holdingName);
  const fAmc = amcHeadToken(fundSchemeName);
  if (hAmc && fAmc && hAmc !== fAmc) return false;
  return true;
}

/**
 * Match a raw CAS scheme name to a fund_master AMFI code via fuzzy
 * matching. The CAS PDF often abbreviates names; we normalise both
 * sides and use substring + token overlap, then HARD-GUARD on AMC and
 * fund-category so a high token overlap can never cross a category or
 * an AMC. When every candidate conflicts, we return null (an honest
 * "no match") rather than a confidently-wrong fund — a wrong verdict
 * on a client's portfolio is worse than a flagged gap.
 *
 * Returns null if no confident match (>=0.5 score after guards).
 */
export function fuzzyMatchSchemeName(
  casName: string,
  candidates: Array<{ amfiCode: string; schemeName: string }>
): { amfiCode: string; confidence: number } | null {
  const norm = normaliseSchemeName(casName);
  const normTokens = new Set(norm.split(/\s+/).filter((t) => t.length > 2));
  const casCat = extractCategoryToken(casName);
  const casAmc = amcHeadToken(casName);

  let bestMatch: { amfiCode: string; confidence: number } | null = null;

  for (const candidate of candidates) {
    const candNorm = normaliseSchemeName(candidate.schemeName);
    const candTokens = new Set(candNorm.split(/\s+/).filter((t) => t.length > 2));

    // ── HARD GUARDS: a category or AMC conflict disqualifies outright ──
    const candCat = extractCategoryToken(candidate.schemeName);
    if (casCat && candCat && casCat !== candCat) continue;
    const candAmc = amcHeadToken(candidate.schemeName);
    if (casAmc && candAmc && casAmc !== candAmc) continue;

    // Token overlap (Jaccard)
    const intersection = [...normTokens].filter((t) => candTokens.has(t)).length;
    const union = new Set([...normTokens, ...candTokens]).size;
    const jaccard = union === 0 ? 0 : intersection / union;

    // Substring bonus
    const substringScore =
      candNorm.includes(norm) || norm.includes(candNorm) ? 0.15 : 0;

    // Small agreement bonus so the right plan/category wins close ties
    const agreementBonus =
      (casCat && candCat && casCat === candCat ? 0.05 : 0) +
      (casAmc && candAmc && casAmc === candAmc ? 0.05 : 0);

    const confidence = Math.min(1, jaccard + substringScore + agreementBonus);

    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { amfiCode: candidate.amfiCode, confidence };
    }
  }

  // 0.5 threshold — after the abbreviation expansion in normaliseSchemeName,
  // a 0.5 Jaccard means at least half the distinctive tokens match, which
  // is a strong signal for these tightly-structured Indian scheme names.
  if (!bestMatch || bestMatch.confidence < 0.5) return null;
  return bestMatch;
}

/**
 * Normalise a scheme name for fuzzy matching. The goal: produce a
 * canonical form that's the same whether the source said "Bandhan
 * Small Cap Fund Reg (G)" or "BANDHAN SMALL CAP FUND - REGULAR PLAN
 * GROWTH". We do this by:
 *   1. Expanding AMC abbreviations BEFORE stripping noise words
 *      (icici pru → icici prudential, ppfas → parag parikh, etc.)
 *   2. Expanding plan-option suffixes ((G) → growth, Reg → regular)
 *   3. Stripping all noise words AFTER expansion
 *
 * Exported so the score-route matcher can re-use it.
 */
export function normaliseSchemeName(name: string): string {
  return name
    .toLowerCase()
    // ── Expand AMC abbreviations FIRST (before parens stripping) ──
    .replace(/\bicici pru\b/g, 'icici prudential')
    .replace(/\bpru\b/g, 'prudential')
    .replace(/\babsl\b/g, 'aditya birla sun life')
    .replace(/\bppfas\b/g, 'parag parikh')
    .replace(/\bhdfc mf\b/g, 'hdfc')
    .replace(/\bsbi mf\b/g, 'sbi')
    // ── Legacy AMC rename so an old CAS name still matches the master ──
    .replace(/\breliance\b/g, 'nippon india')
    // ── Expand plan/option suffixes ──
    .replace(/\(g\)\s*$/g, ' growth')
    .replace(/\(d\)\s*$/g, ' dividend')
    .replace(/\(idcw\)\s*$/g, ' idcw')
    // ── Strip all non-alphanumerics ──
    .replace(/[^a-z0-9\s]/g, ' ')
    // ── Strip noise words (do this LAST so abbreviations got expanded) ──
    .replace(/\b(growth|reg|regular|direct|dir|plan|fund|scheme|idcw|dividend|reinvestment|payout|option)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect whether a scheme name refers to a Regular or Direct plan.
 * Crucial for matching the right AMFI code — most funds have both
 * variants with different codes.
 *
 *   "Bandhan Small Cap Fund Reg (G)"          → 'regular'
 *   "Bandhan Small Cap Fund (Direct) (G)"     → 'direct'
 *   "BANDHAN SMALL CAP FUND - REGULAR PLAN..." → 'regular'
 *   plain "Bandhan Small Cap Fund (G)"        → 'regular' (default — retail
 *                                                clients almost always have
 *                                                Regular plans via MFDs)
 */
export function detectPlanType(name: string): 'regular' | 'direct' {
  const lower = name.toLowerCase();
  if (/\bdirect\b/.test(lower) || /\bdir\b/.test(lower)) return 'direct';
  return 'regular';
}
