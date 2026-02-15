"use client";

import { memo } from "react";

function MarketTicker() {
  return (
    <div className="border-b border-gray-100 bg-white">
      <div style={{ height: "46px", overflow: "hidden" }}>
        <iframe
          src="https://s.tradingview.com/embed-widget/ticker-tape/?locale=en#%7B%22symbols%22%3A%5B%7B%22proName%22%3A%22BSE%3ASENSEX%22%2C%22title%22%3A%22SENSEX%22%7D%2C%7B%22proName%22%3A%22NSE%3ANIFTY%22%2C%22title%22%3A%22NIFTY%2050%22%7D%2C%7B%22proName%22%3A%22NSE%3ABANKNIFTY%22%2C%22title%22%3A%22BANK%20NIFTY%22%7D%2C%7B%22proName%22%3A%22TVC%3AGOLD%22%2C%22title%22%3A%22GOLD%22%7D%2C%7B%22proName%22%3A%22FX_IDC%3AUSDINR%22%2C%22title%22%3A%22USD%2FINR%22%7D%2C%7B%22proName%22%3A%22NSE%3ANIFTYMIDCAP100%22%2C%22title%22%3A%22NIFTY%20MIDCAP%22%7D%5D%2C%22showSymbolLogo%22%3Atrue%2C%22isTransparent%22%3Afalse%2C%22displayMode%22%3A%22adaptive%22%2C%22colorTheme%22%3A%22light%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A46%2C%22utm_source%22%3A%22trustner.in%22%2C%22utm_medium%22%3A%22widget_new%22%2C%22utm_campaign%22%3A%22ticker-tape%22%7D"
          style={{
            width: "100%",
            height: "46px",
            border: "none",
            display: "block",
          }}
          title="Market Ticker"
          loading="eager"
          allowTransparency
        />
      </div>
    </div>
  );
}

export default memo(MarketTicker);
