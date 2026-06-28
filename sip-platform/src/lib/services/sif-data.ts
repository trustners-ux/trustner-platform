/**
 * Live SIF universe — sourced from AMFI's OFFICIAL Specialized Investment Fund
 * NAV API (https://www.amfiindia.com/api/sif-latest-nav).
 *
 * This is the authoritative regulator feed: every live SIF scheme, its strategy
 * category, official SIF scheme code (Sd_Id), ISIN, latest NAV and NAV date.
 * Trustner is empanelled with every SIF house, so this is also our product
 * catalogue. We fetch it server-side and cache it, so /funds/sif always shows
 * official, current data with a single honest "as of" date — beating aggregators
 * whose "live" claims are often weeks stale and internally inconsistent.
 *
 * No database, no migration: a server fetch with ISR caching. Graceful fallback
 * to an empty universe if AMFI is briefly unreachable.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886 (MF & SIF Distributor)
 */

export const SIF_NAV_API = 'https://www.amfiindia.com/api/sif-latest-nav';
export const SIF_MIN_INVESTMENT_INR = 1_000_000; // SEBI floor: ₹10 lakh

export type SifStrategy =
  | 'Hybrid Long-Short'
  | 'Equity Long-Short'
  | 'Equity Ex-Top 100 Long-Short'
  | 'Active Asset Allocator'
  | 'Sector Rotation Long-Short'
  | 'Other';

export interface SifFund {
  /** Cleaned display name, e.g. "qSIF Hybrid Long-Short Fund". */
  name: string;
  /** SIF house brand from AMFI, e.g. "qsif SIF", "Magnum SIF". */
  sifHouse: string;
  /** Real AMC name. */
  amc: string;
  strategy: SifStrategy;
  /** Latest NAV (of the canonical plan we picked). */
  nav: number | null;
  navDate: string | null; // as printed by AMFI, e.g. "12-Jun-2026"
  /** Which plan the NAV is from. */
  navPlan: 'Regular-Growth' | 'Direct-Growth' | 'Other' | 'Awaited';
  /** Official AMFI SIF scheme code, e.g. "SIF-7". */
  schemeCode: string;
  isin: string | null;
  minInvestmentInr: number;
}

export interface SifUniverse {
  funds: SifFund[];
  total: number;
  byStrategy: { strategy: SifStrategy; count: number }[];
  amcCount: number;
  navAsOf: string | null;     // the latest NAV date across the universe
  ok: boolean;                // false if AMFI fetch failed
}

// SIF-house brand → real AMC. Some houses publish under their AMC name already.
const SIF_HOUSE_TO_AMC: Record<string, string> = {
  'altiva sif': 'Edelweiss Mutual Fund',
  'isif sif': 'ICICI Prudential Mutual Fund',
  'qsif sif': 'Quant Mutual Fund',
  'magnum sif': 'SBI Mutual Fund',
  'titanium sif': 'Tata Mutual Fund',
  'dynasif sif': '360 ONE Mutual Fund',
  'arudha sif': 'Bandhan Mutual Fund',
  'apex sif': 'Aditya Birla Sun Life Mutual Fund',
  'arthaya sif': 'Union Mutual Fund',
  'diviniti sif': 'ITI Mutual Fund',
  'sapphire sif': 'Franklin Templeton Mutual Fund',
  'franklin templeton mutual fund': 'Franklin Templeton Mutual Fund',
  'the wealth company mutual fund': 'The Wealth Company Mutual Fund',
  'mirae asset mutual fund': 'Mirae Asset Mutual Fund',
};

function mapStrategy(category: string): SifStrategy {
  const c = category.toLowerCase();
  if (c.includes('ex-top 100') || c.includes('ex top 100')) return 'Equity Ex-Top 100 Long-Short';
  if (c.includes('active asset allocator')) return 'Active Asset Allocator';
  if (c.includes('sector rotation')) return 'Sector Rotation Long-Short';
  if (c.includes('hybrid')) return 'Hybrid Long-Short';
  if (c.includes('equity') && c.includes('long-short')) return 'Equity Long-Short';
  return 'Other';
}

function amcOf(sifHouse: string): string {
  return SIF_HOUSE_TO_AMC[sifHouse.trim().toLowerCase()] ?? (sifHouse.replace(/\bsif\b/i, '').trim() || sifHouse);
}

/** Strip plan/option suffixes from a NavName + tidy AMFI's spacing/casing quirks. */
function cleanName(navName: string): string {
  let n = navName
    .replace(/\s*[-–—]?\s*(direct|regular)\s*(plan)?\b.*$/i, '')
    .replace(/\s*[-–—]\s*(growth|idcw|payout|reinvest|dividend).*$/i, '')
    .replace(/\s+(direct|regular)\s+(growth|idcw|payout|reinvest).*$/i, '')
    .replace(/\s*-\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  // AMFI spacing/typo quirks: "Ex- Top 100", "Long - Short", "Actice"
  n = n
    .replace(/ex-?\s*top\s*100/gi, 'Ex-Top 100')
    .replace(/long\s*-\s*short/gi, 'Long-Short')
    .replace(/\bactice\b/gi, 'Active')
    .replace(/\blong\s+short\b/gi, 'Long-Short');
  // Brand casing: qsif → qSIF, isif → iSIF, etc.
  n = n.replace(/^qsif\b/i, 'qSIF').replace(/^isif\b/i, 'iSIF')
       .replace(/^dynasif\b/i, 'DynaSIF').replace(/^wsif\b/i, 'WSIF')
       .replace(/\bsif\b/gi, 'SIF');
  return n.replace(/\s+/g, ' ').trim();
}

interface RawScheme {
  SIFName?: string; category?: string; Sd_Id?: string;
  ISINPO?: string; ISINRI?: string; NavName?: string;
  Date?: string; NetAssetValue?: number;
}

/** Parse the AMFI SIF API payload into the deduped fund universe. */
export function parseSifPayload(payload: unknown): SifUniverse {
  const raw: RawScheme[] = [];
  const data = (payload as { data?: Array<{ categories?: Array<{ groups?: Array<{ schemes?: RawScheme[] }> }> }> })?.data ?? [];
  for (const t of data) for (const cat of t.categories ?? []) for (const g of cat.groups ?? []) for (const s of g.schemes ?? []) raw.push(s);

  // Group by (SIF house + strategy) — each house runs at most one fund per strategy.
  const groups = new Map<string, RawScheme[]>();
  for (const s of raw) {
    const house = (s.SIFName ?? '').trim();
    const strat = mapStrategy(s.category ?? '');
    if (!house || strat === 'Other') continue;
    const key = `${house.toLowerCase()}|||${strat}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(s);
  }

  const funds: SifFund[] = [];
  let latestDate: { iso: number; raw: string } | null = null;

  for (const [key, schemes] of groups) {
    const [, strategy] = key.split('|||') as [string, SifStrategy];
    const isGrowth = (n: string) => /growth/i.test(n) && !/idcw|payout|reinvest|dividend/i.test(n);
    const isReg = (n: string) => /\bregular\b/i.test(n);
    const isDir = (n: string) => /\bdirect\b/i.test(n);
    const valid = (s: RawScheme) => s.NetAssetValue != null && s.NetAssetValue > 0;

    const regGrowth = schemes.find((s) => isReg(s.NavName ?? '') && isGrowth(s.NavName ?? '') && valid(s));
    const dirGrowth = schemes.find((s) => isDir(s.NavName ?? '') && isGrowth(s.NavName ?? '') && valid(s));
    const anyGrowth = schemes.find((s) => isGrowth(s.NavName ?? '') && valid(s));
    const anyValid = schemes.find(valid);
    const pick = regGrowth ?? dirGrowth ?? anyGrowth ?? anyValid ?? schemes[0];
    const navPlan: SifFund['navPlan'] = regGrowth ? 'Regular-Growth' : dirGrowth ? 'Direct-Growth' : (pick && valid(pick)) ? 'Other' : 'Awaited';

    const house = pick.SIFName ?? '';
    const name = cleanName(pick.NavName ?? house);
    const nav = pick.NetAssetValue != null && pick.NetAssetValue > 0 ? pick.NetAssetValue : null;
    const navDate = nav != null ? (pick.Date ?? null) : null;

    if (navDate) {
      const t = Date.parse(navDate.replace(/-/g, ' '));
      if (!isNaN(t) && (!latestDate || t > latestDate.iso)) latestDate = { iso: t, raw: navDate };
    }

    funds.push({
      name,
      sifHouse: house,
      amc: amcOf(house),
      strategy,
      nav,
      navDate,
      navPlan,
      schemeCode: pick.Sd_Id ?? '',
      isin: pick.ISINPO || pick.ISINRI || null,
      minInvestmentInr: SIF_MIN_INVESTMENT_INR,
    });
  }

  // Order: by strategy (hybrid first — largest), then AMC.
  const STRAT_ORDER: SifStrategy[] = ['Hybrid Long-Short', 'Equity Long-Short', 'Equity Ex-Top 100 Long-Short', 'Active Asset Allocator', 'Sector Rotation Long-Short', 'Other'];
  funds.sort((a, b) => (STRAT_ORDER.indexOf(a.strategy) - STRAT_ORDER.indexOf(b.strategy)) || a.amc.localeCompare(b.amc));

  const byStrategy = STRAT_ORDER
    .map((strategy) => ({ strategy, count: funds.filter((f) => f.strategy === strategy).length }))
    .filter((x) => x.count > 0);

  return {
    funds,
    total: funds.length,
    byStrategy,
    amcCount: new Set(funds.map((f) => f.amc)).size,
    navAsOf: latestDate?.raw ?? null,
    ok: funds.length > 0,
  };
}

// ─────────────────────────────────────────────────────────────────
// RICH SIF universe — live engine (NAV/1D/5D/SI/1M/3M) + editorial (TFS/verdict)
// ─────────────────────────────────────────────────────────────────
//
// The merasif engine (sif-nav.php) already does the hard part: it pulls the
// official AMFI SIF NAV by scheme code, keeps a daily archive (so 1D/5D and SI
// are exact), and merges Value-Research figures. It's CORS-open and cached, so
// merasip simply consumes it and overlays the Trustner editorial layer (TFS +
// verdict) we keep locally — giving /funds/sif the identical, full table.

import {
  SIF_EDITORIAL, SIF_CAT_LABEL, SIF_CAT_ORDER, SIF_VR_AS_OF,
  type SifCat, type SifVerdict,
} from '@/data/sif/sif-editorial';

/** merasif live SIF engine. Returns { funds:{<id>:{nav,d1,d5,si,m1,m3,aum,risk,ter,source}}, navAsOf, vrAsOf }. */
export const SIF_ENGINE_URL = 'https://www.merasif.com/sif-nav.php';

export interface SifRichRow {
  id: string;
  name: string;
  amc: string;
  cat: SifCat;
  catLabel: string;
  incept: string;
  nav: number | null;
  navDate: string | null;
  d1: number | null;   // 1-day %  (from the daily archive)
  d5: number | null;   // 5-day %
  m1: number | null;   // 1-month %
  m3: number | null;   // 3-month %
  si: number | null;   // since-inception % (NAV vs face)
  aum: number | null;  // ₹ Cr
  risk: number | null; // riskometer band 1–6
  ter: number | null;  // %
  face: number;
  sd: string | null;   // SIF scheme code
  tfs: number | null;  // Trustner Fund Score
  verdict: SifVerdict;
  /** 'amfi' = official live NAV; 'vr' = Value-Research seed; 'none' = awaited. */
  source: 'amfi' | 'vr' | 'none';
}

export interface SifRichUniverse {
  rows: SifRichRow[];
  total: number;
  officialCount: number;   // rows on an official live AMFI NAV
  amcCount: number;
  navAsOf: string | null;  // ISO date of the engine's latest NAV
  vrAsOf: string;          // Value-Research seed date
  engineOk: boolean;       // false if the live engine was unreachable (seeds shown)
  byCat: { cat: SifCat; label: string; count: number }[];
}

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

interface EngineFund {
  nav?: unknown; navDate?: unknown; d1?: unknown; d5?: unknown; si?: unknown;
  m1?: unknown; m3?: unknown; aum?: unknown; risk?: unknown; ter?: unknown;
  sd?: unknown; source?: unknown;
}

/**
 * Full SIF universe for /funds/sif: every fund's live NAV / 1D / 5D / SI / 1M /
 * 3M / AUM / risk / TER (from the merasif engine) merged with its TFS + verdict
 * (Trustner editorial). Always returns all 25 funds — if the engine is briefly
 * down it falls back to the Value-Research seeds so the table never goes blank.
 * ISR-cached 30 min (matches the engine's own cache).
 */
export async function getSifUniverseRich(): Promise<SifRichUniverse> {
  let engine: { funds?: Record<string, EngineFund>; navAsOf?: string; vrAsOf?: string } | null = null;
  try {
    const res = await fetch(SIF_ENGINE_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (TrustnerSIF/1.0)' },
      next: { revalidate: 1800 },
    });
    if (res.ok) engine = await res.json();
  } catch {
    engine = null;
  }
  const engineFunds = engine?.funds ?? {};
  const engineOk = Object.keys(engineFunds).length > 0;

  const rows: SifRichRow[] = SIF_EDITORIAL.map((e) => {
    const L = engineFunds[e.id] ?? {};
    const nav = numOrNull(L.nav);
    const source: SifRichRow['source'] =
      L.source === 'amfi' ? 'amfi' : nav != null ? 'amfi' : 'none';
    return {
      id: e.id,
      name: e.name,
      amc: e.amc,
      cat: e.cat,
      catLabel: SIF_CAT_LABEL[e.cat],
      incept: e.incept,
      nav,
      navDate: typeof L.navDate === 'string' ? L.navDate : null,
      d1: numOrNull(L.d1),
      d5: numOrNull(L.d5),
      m1: numOrNull(L.m1) ?? e.seed.m1,
      m3: numOrNull(L.m3) ?? e.seed.m3,
      si: numOrNull(L.si),
      aum: numOrNull(L.aum) ?? e.seed.aum,
      risk: numOrNull(L.risk) ?? e.seed.risk,
      ter: numOrNull(L.ter) ?? e.seed.ter,
      face: e.face,
      sd: typeof L.sd === 'string' ? L.sd : null,
      tfs: e.tfs,
      verdict: e.verdict,
      source,
    };
  });

  const byCat = SIF_CAT_ORDER
    .map((cat) => ({ cat, label: SIF_CAT_LABEL[cat], count: rows.filter((r) => r.cat === cat).length }))
    .filter((x) => x.count > 0);

  return {
    rows,
    total: rows.length,
    officialCount: rows.filter((r) => r.source === 'amfi').length,
    amcCount: new Set(rows.map((r) => r.amc)).size,
    navAsOf: engine?.navAsOf ?? null,
    vrAsOf: engine?.vrAsOf ?? SIF_VR_AS_OF,
    engineOk,
    byCat,
  };
}

/** Fetch + parse the live SIF universe from AMFI (ISR-cached ~6h). */
export async function getLiveSifUniverse(): Promise<SifUniverse> {
  try {
    const res = await fetch(SIF_NAV_API, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (TrustnerSIF/1.0)' },
      next: { revalidate: 21_600 }, // 6 hours
    });
    if (!res.ok) return { funds: [], total: 0, byStrategy: [], amcCount: 0, navAsOf: null, ok: false };
    return parseSifPayload(await res.json());
  } catch {
    return { funds: [], total: 0, byStrategy: [], amcCount: 0, navAsOf: null, ok: false };
  }
}
