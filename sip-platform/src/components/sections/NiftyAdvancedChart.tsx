'use client';

import { useEffect, useRef } from 'react';

/**
 * TradingView "Advanced Chart" embed for the Nifty 50 index — same
 * zero-fabrication-risk technique as MarketTicker.tsx (live data rendered
 * directly by TradingView, no scraped/reverse-engineered feed).
 */
export function NiftyAdvancedChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'NSE:NIFTY',
      interval: 'W',
      timezone: 'Asia/Kolkata',
      theme: 'light',
      style: '1',
      locale: 'in',
      hide_top_toolbar: true,
      hide_legend: false,
      save_image: false,
      support_host: 'https://www.tradingview.com',
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div className="tradingview-widget-container w-full" style={{ height: '420px' }} ref={containerRef} />
  );
}
