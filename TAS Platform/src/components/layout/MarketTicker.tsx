"use client";

import { useEffect, useRef } from "react";

export default function MarketTicker() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any previous widget
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "BSE:SENSEX", title: "SENSEX" },
        { proName: "NSE:NIFTY", title: "NIFTY 50" },
        { proName: "NSE:BANKNIFTY", title: "BANK NIFTY" },
        { proName: "TVC:GOLD", title: "GOLD" },
        { proName: "FX_IDC:USDINR", title: "USD/INR" },
        { proName: "NSE:NIFTYMIDCAP100", title: "NIFTY MIDCAP" },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: "adaptive",
      colorTheme: "light",
      locale: "en",
    });

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="border-b border-gray-100 bg-white">
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: "46px", overflow: "hidden" }}
      >
        {/* TradingView Widget loads here */}
        <div className="flex h-[46px] animate-pulse items-center justify-center text-xs text-gray-400">
          Loading market data...
        </div>
      </div>
    </div>
  );
}
