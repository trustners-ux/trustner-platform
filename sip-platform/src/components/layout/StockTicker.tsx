'use client';

import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StockData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  isIndex: boolean;
}

/* ------------------------------------------------------------------ */
/*  Fallback data shown while API loads / if it fails                   */
/* ------------------------------------------------------------------ */
const FALLBACK_DATA: StockData[] = [
  { name: 'NIFTY 50', symbol: '^NSEI', price: 22500, change: 125.30, changePercent: 0.56, isIndex: true },
  { name: 'SENSEX', symbol: '^BSESN', price: 74200, change: 412.50, changePercent: 0.56, isIndex: true },
  { name: 'BANK NIFTY', symbol: '^NSEBANK', price: 48300, change: -210.40, changePercent: -0.43, isIndex: true },
  { name: 'TATA MOTORS', symbol: 'TATAMOTORS.NS', price: 780, change: 12.45, changePercent: 1.62, isIndex: false },
  { name: 'INFOSYS', symbol: 'INFY.NS', price: 1520, change: -18.20, changePercent: -1.18, isIndex: false },
  { name: 'WIPRO', symbol: 'WIPRO.NS', price: 475, change: 5.60, changePercent: 1.19, isIndex: false },
  { name: 'RELIANCE', symbol: 'RELIANCE.NS', price: 2890, change: 34.50, changePercent: 1.21, isIndex: false },
  { name: 'TCS', symbol: 'TCS.NS', price: 3650, change: -28.10, changePercent: -0.76, isIndex: false },
  { name: 'HDFC BANK', symbol: 'HDFCBANK.NS', price: 1580, change: 15.20, changePercent: 0.97, isIndex: false },
  { name: 'ICICI BANK', symbol: 'ICICIBANK.NS', price: 1120, change: 8.90, changePercent: 0.80, isIndex: false },
  { name: 'SBI', symbol: 'SBIN.NS', price: 820, change: -5.30, changePercent: -0.64, isIndex: false },
  { name: 'BHARTI AIRTEL', symbol: 'BHARTIARTL.NS', price: 1650, change: 22.80, changePercent: 1.40, isIndex: false },
  { name: 'HUL', symbol: 'HINDUNILVR.NS', price: 2380, change: -12.40, changePercent: -0.52, isIndex: false },
  { name: 'ITC', symbol: 'ITC.NS', price: 445, change: 3.20, changePercent: 0.72, isIndex: false },
  { name: 'KOTAK BANK', symbol: 'KOTAKBANK.NS', price: 1780, change: 14.60, changePercent: 0.83, isIndex: false },
  { name: 'LT', symbol: 'LT.NS', price: 3420, change: -45.20, changePercent: -1.30, isIndex: false },
  { name: 'AXIS BANK', symbol: 'AXISBANK.NS', price: 1080, change: 9.50, changePercent: 0.89, isIndex: false },
  { name: 'BAJAJ FINANCE', symbol: 'BAJFINANCE.NS', price: 7200, change: 85.40, changePercent: 1.20, isIndex: false },
  { name: 'MARUTI', symbol: 'MARUTI.NS', price: 12400, change: -150.00, changePercent: -1.19, isIndex: false },
  { name: 'ASIAN PAINTS', symbol: 'ASIANPAINT.NS', price: 2850, change: 18.90, changePercent: 0.67, isIndex: false },
  { name: 'HCLTECH', symbol: 'HCLTECH.NS', price: 1420, change: -16.30, changePercent: -1.14, isIndex: false },
  { name: 'TITAN', symbol: 'TITAN.NS', price: 3250, change: 42.60, changePercent: 1.33, isIndex: false },
  { name: 'ADANI PORTS', symbol: 'ADANIPORTS.NS', price: 1380, change: -22.40, changePercent: -1.60, isIndex: false },
  { name: 'POWER GRID', symbol: 'POWERGRID.NS', price: 310, change: 4.80, changePercent: 1.57, isIndex: false },
  { name: 'NTPC', symbol: 'NTPC.NS', price: 365, change: 6.20, changePercent: 1.73, isIndex: false },
  { name: 'SUNPHARMA', symbol: 'SUNPHARMA.NS', price: 1680, change: -8.50, changePercent: -0.50, isIndex: false },
];

/* ------------------------------------------------------------------ */
/*  Format number for display                                          */
/* ------------------------------------------------------------------ */
function formatPrice(price: number, isIndex: boolean): string {
  if (isIndex) {
    return price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  if (price >= 10000) {
    return price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  return price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ------------------------------------------------------------------ */
/*  Single ticker item                                                  */
/* ------------------------------------------------------------------ */
function TickerItem({ stock }: { stock: StockData }) {
  const isPositive = stock.change > 0;
  const isNeutral = stock.change === 0;
  const color = isNeutral ? 'text-gray-400' : isPositive ? 'text-emerald-400' : 'text-red-400';
  const bgColor = isNeutral ? 'bg-gray-500/10' : isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10';
  const arrow = isNeutral ? '' : isPositive ? '▲' : '▼';

  return (
    <div className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
      {/* Stock name */}
      <span className={`text-xs font-bold ${stock.isIndex ? 'text-yellow-300' : 'text-gray-300'}`}>
        {stock.name}
      </span>

      {/* Price */}
      <span className="text-xs font-semibold text-white">
        ₹{formatPrice(stock.price, stock.isIndex)}
      </span>

      {/* Change badge */}
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${color} ${bgColor} px-1.5 py-0.5 rounded`}>
        <span>{arrow}</span>
        <span>{Math.abs(stock.change).toFixed(2)}</span>
        <span className="opacity-70">({Math.abs(stock.changePercent).toFixed(2)}%)</span>
      </span>

      {/* Separator dot */}
      <span className="text-gray-600 ml-2">•</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main StockTicker Component                                         */
/* ------------------------------------------------------------------ */
export function StockTicker() {
  const [stocks, setStocks] = useState<StockData[]>(FALLBACK_DATA);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  /* Fetch live data from our API */
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const res = await fetch('/api/stock-ticker', { next: { revalidate: 60 } });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (isMounted && data.stocks && data.stocks.length > 0) {
          setStocks(data.stocks);
        }
      } catch {
        // Keep fallback data
      }
    }

    fetchData();

    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60_000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  /* Duplicate the stock list 4x for seamless infinite loop */
  const extendedStocks = [...stocks, ...stocks, ...stocks, ...stocks];

  return (
    <div
      className="bg-[#0a0a0a] border-b border-gray-800/50 overflow-hidden relative"
      style={{ height: '32px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Subtle gradient edges for smooth fade */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />

      {/* Scrolling track */}
      <div
        ref={trackRef}
        className="flex items-center h-full"
        style={{
          animation: `tickerScroll 120s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
          width: 'max-content',
        }}
      >
        {extendedStocks.map((stock, i) => (
          <TickerItem key={`${stock.symbol}-${i}`} stock={stock} />
        ))}
      </div>

      {/* CSS animation */}
      <style jsx>{`
        @keyframes tickerScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
