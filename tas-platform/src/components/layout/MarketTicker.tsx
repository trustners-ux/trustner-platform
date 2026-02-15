"use client";

import { useEffect, useRef, useState } from "react";

export default function MarketTicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous content
    const container = containerRef.current;
    container.innerHTML = "";

    // Create the widget container div
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    // Create the script element with TradingView config
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;

    // TradingView expects the config as text content of the script
    script.textContent = JSON.stringify({
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

    script.onload = () => {
      setIsLoaded(true);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      container.appendChild(script);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="border-b border-gray-100 bg-white">
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: "46px", overflow: "hidden" }}
      >
        {!isLoaded && (
          <div className="flex h-[46px] animate-pulse items-center justify-center text-xs text-gray-400">
            Loading market data...
          </div>
        )}
      </div>
    </div>
  );
}
