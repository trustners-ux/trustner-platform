import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/* ------------------------------------------------------------------ */
/*  26 Major Indian stocks + indices for the ticker strip               */
/* ------------------------------------------------------------------ */
const TICKER_SYMBOLS: { name: string; yahoo: string; isIndex: boolean }[] = [
  // Indices
  { name: 'NIFTY 50',       yahoo: '^NSEI',             isIndex: true },
  { name: 'SENSEX',         yahoo: '^BSESN',            isIndex: true },
  { name: 'BANK NIFTY',     yahoo: '^NSEBANK',          isIndex: true },

  // Large-cap stocks
  { name: 'RELIANCE',       yahoo: 'RELIANCE.NS',       isIndex: false },
  { name: 'TCS',            yahoo: 'TCS.NS',            isIndex: false },
  { name: 'HDFC BANK',      yahoo: 'HDFCBANK.NS',       isIndex: false },
  { name: 'INFOSYS',        yahoo: 'INFY.NS',           isIndex: false },
  { name: 'ICICI BANK',     yahoo: 'ICICIBANK.NS',      isIndex: false },
  { name: 'BHARTI AIRTEL',  yahoo: 'BHARTIARTL.NS',     isIndex: false },
  { name: 'SBI',            yahoo: 'SBIN.NS',           isIndex: false },
  { name: 'ITC',            yahoo: 'ITC.NS',            isIndex: false },
  { name: 'TATA MOTORS',    yahoo: 'TATAMOTORS.NS',     isIndex: false },
  { name: 'WIPRO',          yahoo: 'WIPRO.NS',          isIndex: false },
  { name: 'HUL',            yahoo: 'HINDUNILVR.NS',     isIndex: false },
  { name: 'KOTAK BANK',     yahoo: 'KOTAKBANK.NS',      isIndex: false },
  { name: 'LT',             yahoo: 'LT.NS',             isIndex: false },
  { name: 'AXIS BANK',      yahoo: 'AXISBANK.NS',       isIndex: false },
  { name: 'BAJAJ FINANCE',  yahoo: 'BAJFINANCE.NS',     isIndex: false },
  { name: 'MARUTI',         yahoo: 'MARUTI.NS',         isIndex: false },
  { name: 'ASIAN PAINTS',   yahoo: 'ASIANPAINT.NS',     isIndex: false },
  { name: 'TITAN',          yahoo: 'TITAN.NS',          isIndex: false },
  { name: 'HCLTECH',        yahoo: 'HCLTECH.NS',       isIndex: false },
  { name: 'ADANI PORTS',    yahoo: 'ADANIPORTS.NS',     isIndex: false },
  { name: 'SUNPHARMA',      yahoo: 'SUNPHARMA.NS',      isIndex: false },
  { name: 'POWER GRID',     yahoo: 'POWERGRID.NS',      isIndex: false },
  { name: 'NTPC',           yahoo: 'NTPC.NS',           isIndex: false },
];

/* ------------------------------------------------------------------ */
/*  In-memory cache (60 s TTL)                                         */
/* ------------------------------------------------------------------ */
interface StockResponse {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  isIndex: boolean;
}

interface CachedTicker {
  stocks: StockResponse[];
  timestamp: number;
}

let tickerCache: CachedTicker | null = null;
const CACHE_TTL = 60_000; // 60 seconds

/* ------------------------------------------------------------------ */
/*  Fetch quotes from Yahoo Finance                                    */
/* ------------------------------------------------------------------ */
async function fetchTickerData(): Promise<StockResponse[]> {
  // Check cache
  if (tickerCache && Date.now() - tickerCache.timestamp < CACHE_TTL) {
    return tickerCache.stocks;
  }

  const quoteMap = new Map<string, { price: number; change: number; changePercent: number }>();

  // Fetch in parallel with allSettled for graceful failures
  await Promise.allSettled(
    TICKER_SYMBOLS.map(async (sym) => {
      try {
        const quote = await yahooFinance.quote(sym.yahoo);
        if (quote && quote.regularMarketPrice) {
          quoteMap.set(sym.yahoo, {
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange ?? 0,
            changePercent: quote.regularMarketChangePercent ?? 0,
          });
        }
      } catch {
        // Skip failed quotes
      }
    })
  );

  const stocks: StockResponse[] = [];

  for (const sym of TICKER_SYMBOLS) {
    const data = quoteMap.get(sym.yahoo);
    if (!data) continue;

    stocks.push({
      name: sym.name,
      symbol: sym.yahoo,
      price: Math.round(data.price * 100) / 100,
      change: Math.round(data.change * 100) / 100,
      changePercent: Math.round(data.changePercent * 100) / 100,
      isIndex: sym.isIndex,
    });
  }

  // Update cache
  if (stocks.length > 0) {
    tickerCache = { stocks, timestamp: Date.now() };
  }

  return stocks;
}

/* ------------------------------------------------------------------ */
/*  GET /api/stock-ticker                                              */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const stocks = await fetchTickerData();
    return NextResponse.json(
      { stocks, timestamp: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Stock ticker fetch failed:', error);
    return NextResponse.json(
      { stocks: [], error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
