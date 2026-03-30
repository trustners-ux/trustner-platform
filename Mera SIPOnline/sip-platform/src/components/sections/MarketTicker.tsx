'use client';

import { useEffect, useRef } from 'react';

export function MarketTicker() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous widget
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'BSE:SENSEX', title: 'Sensex' },
        { proName: 'NSE:NIFTY', title: 'Nifty 50' },
        { proName: 'NSE:BANKNIFTY', title: 'Bank Nifty' },
        { proName: 'TVC:GOLD', title: 'Gold' },
        { proName: 'FX_IDC:USDINR', title: 'USD/INR' },
        { proName: 'NSE:NIFTYMIDCAP150', title: 'Midcap 150' },
      ],
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: 'regular',
      colorTheme: 'dark',
      locale: 'in',
    });
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="bg-primary-700 border-b border-white/10 overflow-hidden">
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ minHeight: '46px' }}
      />
    </div>
  );
}
