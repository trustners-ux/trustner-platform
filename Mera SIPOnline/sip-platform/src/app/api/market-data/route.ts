import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/* ------------------------------------------------------------------ */
/*  Yahoo Finance symbols for Indian market indices + commodities       */
/* ------------------------------------------------------------------ */
const SYMBOLS: Record<string, { yahoo: string; icon: string; color: string }> = {
  'Sensex':            { yahoo: '^BSESN',              icon: 'TrendingUp',  color: 'from-brand-500 to-brand-600' },
  'Nifty 50':          { yahoo: '^NSEI',               icon: 'BarChart3',   color: 'from-brand-700 to-secondary-600' },
  'Nifty Bank':        { yahoo: '^NSEBANK',            icon: 'Landmark',    color: 'from-teal-500 to-teal-600' },
  'Gold (10g)':        { yahoo: 'GC=F',                icon: 'Gem',         color: 'from-amber-500 to-yellow-600' },
  'USD/INR':           { yahoo: 'INR=X',               icon: 'DollarSign',  color: 'from-green-500 to-teal-600' },
  'Nifty Midcap 150':  { yahoo: 'NIFTYMIDCAP150.NS',   icon: 'Activity',    color: 'from-rose-500 to-pink-600' },
};

/* ------------------------------------------------------------------ */
/*  In-memory cache (60 s TTL)                                         */
/* ------------------------------------------------------------------ */
interface CachedData {
  data: MarketDataResponse[];
  timestamp: number;
}

interface MarketDataResponse {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  icon: string;
  color: string;
}

let cache: CachedData | null = null;
const CACHE_TTL = 60_000; // 60 seconds

/* ------------------------------------------------------------------ */
/*  Gold price helper — convert Troy oz USD → INR per 10g              */
/* ------------------------------------------------------------------ */
function convertGoldTo10gINR(usdPerTroyOz: number, usdInr: number): number {
  // 1 troy oz = 31.1035 grams
  const usdPerGram = usdPerTroyOz / 31.1035;
  const inrPerGram = usdPerGram * usdInr;
  return Math.round(inrPerGram * 10); // Per 10 grams
}

/* ------------------------------------------------------------------ */
/*  Fetch from Yahoo Finance                                           */
/* ------------------------------------------------------------------ */
async function fetchMarketData(): Promise<MarketDataResponse[]> {
  // Check cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const entries = Object.entries(SYMBOLS);

  // Fetch each quote individually to avoid type issues with batch API
  const quoteMap = new Map<string, { price: number; change: number; changePercent: number }>();

  await Promise.allSettled(
    entries.map(async ([, meta]) => {
      try {
        const quote = await yahooFinance.quote(meta.yahoo);
        if (quote && quote.regularMarketPrice) {
          quoteMap.set(meta.yahoo, {
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange ?? 0,
            changePercent: quote.regularMarketChangePercent ?? 0,
          });
        }
      } catch {
        // Skip failed quotes silently
      }
    })
  );

  // Get USD/INR rate for gold conversion
  const usdInrData = quoteMap.get('INR=X');
  const usdInr = usdInrData?.price ?? 83.5; // fallback

  const indicators: MarketDataResponse[] = [];

  for (const [name, meta] of entries) {
    const data = quoteMap.get(meta.yahoo);
    if (!data) continue;

    let value = data.price;
    let change = data.change;
    let changePercent = data.changePercent;

    // Convert gold from USD/troy oz → INR/10g
    if (name === 'Gold (10g)') {
      const prevPrice = value - change;
      value = convertGoldTo10gINR(value, usdInr);
      const prevValueINR = convertGoldTo10gINR(prevPrice, usdInr);
      change = value - prevValueINR;
      changePercent = prevValueINR > 0 ? ((value - prevValueINR) / prevValueINR) * 100 : 0;
    }

    indicators.push({
      name,
      symbol: meta.yahoo,
      value: Math.round(value * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      lastUpdated: new Date().toISOString(),
      icon: meta.icon,
      color: meta.color,
    });
  }

  // Update cache
  cache = { data: indicators, timestamp: Date.now() };
  return indicators;
}

/* ------------------------------------------------------------------ */
/*  GET /api/market-data                                               */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const data = await fetchMarketData();
    const isCached = cache ? Date.now() - cache.timestamp > 1000 : false;
    return NextResponse.json(
      { indicators: data, cached: isCached },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Market data fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data', indicators: [] },
      { status: 500 }
    );
  }
}
