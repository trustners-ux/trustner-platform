import { NextResponse } from 'next/server';

/* ─────────────────────────────────────────────────────────
   Live Fund NAV & Return Data API

   Uses api.mfapi.in (free, no auth) to fetch real-time NAV
   and calculate 1Y, 3Y, 5Y CAGR returns.

   GET /api/funds/live-nav?q=Nippon India Large Cap
   GET /api/funds/live-nav?code=106235
   ───────────────────────────────────────────────────────── */

const MFAPI_BASE = 'https://api.mfapi.in/mf';

// In-memory cache (per serverless instance, ~24hr TTL)
const cache = new Map<string, { data: FundNavData; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface FundNavData {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  currentNav: number;
  navDate: string;
  returns: {
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
  };
  fetchedAt: string;
}

// Parse MFAPI date format (DD-MM-YYYY) to Date
function parseMfapiDate(dateStr: string): Date {
  const [dd, mm, yyyy] = dateStr.split('-');
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

// Format date to MFAPI query format (YYYY-MM-DD)
function toQueryDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Calculate CAGR
function cagr(currentNav: number, oldNav: number, years: number): number {
  if (oldNav <= 0 || years <= 0) return 0;
  return Math.pow(currentNav / oldNav, 1 / years) - 1;
}

// Find closest NAV to a target date (within a 10-day window)
async function fetchNavNearDate(schemeCode: number, targetDate: Date): Promise<{ nav: number; date: string } | null> {
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

// Search scheme by name
async function searchScheme(query: string): Promise<{ schemeCode: number; schemeName: string } | null> {
  try {
    const res = await fetch(`${MFAPI_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    // Prefer Regular Growth plan
    const regularGrowth = results.find((r: { schemeName: string }) => {
      const name = r.schemeName.toLowerCase();
      return (
        (name.includes('regular') || !name.includes('direct')) &&
        (name.includes('growth'))
      );
    });

    const match = regularGrowth || results[0];
    return { schemeCode: match.schemeCode, schemeName: match.schemeName };
  } catch {
    return null;
  }
}

// Fetch full fund data with returns
async function fetchFundData(schemeCode: number): Promise<FundNavData | null> {
  try {
    // Get latest NAV + metadata
    const latestRes = await fetch(`${MFAPI_BASE}/${schemeCode}/latest`, { next: { revalidate: 3600 } });
    if (!latestRes.ok) return null;
    const latestJson = await latestRes.json();
    if (latestJson.status !== 'SUCCESS' || !latestJson.data?.length) return null;

    const meta = latestJson.meta;
    const latestEntry = latestJson.data[0];
    const currentNav = parseFloat(latestEntry.nav);
    const navDate = latestEntry.date;

    const today = parseMfapiDate(navDate);

    // Fetch historical NAVs for return calculations
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
      schemeCode,
      schemeName: meta.scheme_name,
      fundHouse: meta.fund_house,
      category: meta.scheme_category,
      currentNav,
      navDate,
      returns: {
        oneYear: nav1Y ? cagr(currentNav, nav1Y.nav, 1) : null,
        threeYear: nav3Y ? cagr(currentNav, nav3Y.nav, 3) : null,
        fiveYear: nav5Y ? cagr(currentNav, nav5Y.nav, 5) : null,
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const code = searchParams.get('code');

  if (!query && !code) {
    return NextResponse.json(
      { error: 'Provide ?q=fund+name or ?code=123456' },
      { status: 400 }
    );
  }

  let schemeCode: number;

  if (code) {
    schemeCode = Number(code);
  } else {
    // Search by name
    const found = await searchScheme(query!);
    if (!found) {
      return NextResponse.json(
        { error: `No fund found for "${query}"` },
        { status: 404 }
      );
    }
    schemeCode = found.schemeCode;
  }

  // Check cache
  const cacheKey = String(schemeCode);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  // Fetch fresh data
  const data = await fetchFundData(schemeCode);
  if (!data) {
    return NextResponse.json(
      { error: 'Failed to fetch fund data from MFAPI' },
      { status: 502 }
    );
  }

  // Cache it
  cache.set(cacheKey, { data, ts: Date.now() });

  return NextResponse.json(data);
}
