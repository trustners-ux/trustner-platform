import Link from 'next/link';
import { ArrowLeft, Info, TrendingUp, ExternalLink, LineChart } from 'lucide-react';
import { getNavHistory } from '@/lib/services/mfapi';
import { MarketTicker } from '@/components/sections/MarketTicker';
import { NiftyAdvancedChart } from '@/components/sections/NiftyAdvancedChart';

// Without this, Next.js would statically freeze the trailing-return numbers
// at build time and never recompute them. Revalidate daily, matching the
// underlying NAV-history cache TTL, so "always-current" is actually true.
export const revalidate = 86400;

// Kotak Nifty 50 Index Fund (Regular-Growth) — the same real-fund proxy for
// Nifty 50 returns already used in the Portfolio Diagnostic's benchmark
// section (report-data.ts). Using a real index fund's NAV history means
// every number here is a genuine, fetchable figure — never a fabricated one.
const NIFTY_INDEX_FUND_CODE = 148974;
const TRAILING_WINDOWS = [1, 3, 5, 10] as const;

interface TrailingReturn {
  years: number;
  cagrPct: number | null;
}

function parseDate(d: string): number {
  const iso = Date.parse(d);
  if (!Number.isNaN(iso)) return iso;
  const [dd, mm, yy] = d.split('-');
  return Date.parse(`${yy}-${mm}-${dd}`);
}

async function computeTrailingReturns(): Promise<{ asOfDate: string; returns: TrailingReturn[] } | null> {
  try {
    const hist = await getNavHistory(NIFTY_INDEX_FUND_CODE, 'MAX');
    if (!hist || hist.length < 30) return null;
    const sorted = [...hist].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    const last = sorted[sorted.length - 1];
    const lastT = parseDate(last.date);

    const returns: TrailingReturn[] = TRAILING_WINDOWS.map((yrs) => {
      const cutoff = lastT - yrs * 365.25 * 24 * 3600 * 1000;
      let first = sorted[0];
      for (const p of sorted) {
        if (parseDate(p.date) >= cutoff) { first = p; break; }
      }
      const actualYears = (lastT - parseDate(first.date)) / (365.25 * 24 * 3600 * 1000);
      if (!Number.isFinite(actualYears) || actualYears < yrs * 0.85 || first.nav <= 0) {
        return { years: yrs, cagrPct: null };
      }
      const cagr = (Math.pow(last.nav / first.nav, 1 / actualYears) - 1) * 100;
      return { years: yrs, cagrPct: Math.round(cagr * 10) / 10 };
    });

    return { asOfDate: last.date, returns };
  } catch {
    return null;
  }
}

export default async function MarketPulsePage() {
  const trailing = await computeTrailingReturns();

  return (
    <>
      <section className="bg-hero-pattern text-white py-12">
        <div className="container-custom">
          <Link href="/research" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3">Nifty 50 Snapshot</h1>
          <p className="text-slate-300 max-w-2xl">
            An always-current reference — live index levels and genuine, NAV-derived Nifty 50 trailing
            returns. Bookmark this page for context between newsletter issues, not as a buy/sell signal.
            For weekly market commentary and narrative context, see{' '}
            <Link href="/market-pulse" className="underline hover:text-white">Market Pulse</Link>.
          </p>
        </div>
      </section>

      <MarketTicker />

      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          {/* Live chart */}
          <div className="card-base p-6 mb-8">
            <div className="flex items-center gap-2 mb-1">
              <LineChart className="w-5 h-5 text-brand" />
              <h2 className="font-bold text-primary-700">Nifty 50 — Live Chart</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">Weekly candles, powered by TradingView — the same live feed used in our market ticker.</p>
            <NiftyAdvancedChart />
          </div>

          {/* Real, NAV-derived trailing returns */}
          <div className="card-base overflow-hidden mb-8">
            <div className="p-5 border-b border-surface-200">
              <h2 className="font-bold text-primary-700">Nifty 50 Trailing Returns</h2>
              <p className="text-xs text-slate-500 mt-1">
                {trailing
                  ? `Computed from the actual NAV history of a real Nifty 50 index fund, as of ${trailing.asOfDate} — not a hardcoded illustration.`
                  : 'Live computation is temporarily unavailable — please check back shortly.'}
              </p>
            </div>
            {trailing ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-surface-200">
                {trailing.returns.map((r) => (
                  <div key={r.years} className="p-5 text-center">
                    <div className="text-xs text-slate-500 mb-1">{r.years} Year{r.years !== 1 ? 's' : ''} CAGR</div>
                    <div className={`text-xl font-bold ${r.cagrPct == null ? 'text-slate-400' : r.cagrPct >= 0 ? 'text-positive' : 'text-red-500'}`}>
                      {r.cagrPct != null ? `${r.cagrPct >= 0 ? '+' : ''}${r.cagrPct}%` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-slate-500">Data temporarily unavailable.</div>
            )}
          </div>

          {/* Honest note on PE ratio / valuation context */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              About Nifty Valuation (PE Ratio)
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              The Nifty 50&apos;s Price-to-Earnings ratio is a commonly used gauge of whether the market is
              cheap or expensive relative to its own history. NSE discontinued its free real-time PE/PB/Dividend-Yield
              data feed in July 2024, so rather than show you a number from an unofficial or scraped source, we
              point you to the official published figures:
            </p>
            <a
              href="https://www.niftyindices.com/reports/historical-data"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
            >
              NSE Indices — Official Historical PE/PB/Div-Yield Reports <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Info Note */}
          <div className="bg-brand-50 rounded-lg p-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              <strong className="text-primary-700">Note:</strong> This page is educational market context, not
              investment advice or a buy/sell signal. Trustner Asset Services Pvt. Ltd. is an AMFI Registered
              Mutual Fund Distributor (ARN-286886) — mutual fund investments are subject to market risks. Past
              performance does not guarantee future returns.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
