'use client';

/**
 * FundNavChartCanonical
 *
 * Interactive NAV history chart for /funds/[amfi_code]. Pulls from
 * /api/funds/by-amfi/[amfi_code]/nav-history (MFAPI proxy with 24h cache).
 * Supports 1Y / 3Y / 5Y / MAX toggle.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';

interface Props {
  amfiCode: string;
  schemeName: string;
}

interface MFAPIPoint {
  date: string; // DD-MM-YYYY
  nav: string;
}

interface ChartPoint {
  ts: number;
  date: string;
  nav: number;
}

type Range = '1Y' | '3Y' | '5Y' | 'MAX';

const RANGE_DAYS: Record<Range, number | null> = {
  '1Y': 365,
  '3Y': 365 * 3,
  '5Y': 365 * 5,
  MAX: null,
};

function parseDDMMYYYY(s: string): number {
  const [d, m, y] = s.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

const fmtINR = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateShort = (ts: number) =>
  new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

export function FundNavChartCanonical({ amfiCode, schemeName }: Props) {
  const [raw, setRaw] = useState<ChartPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('3Y');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/funds/by-amfi/${amfiCode}/nav-history`);
        if (!res.ok) {
          throw new Error(`Failed to load NAV history (${res.status})`);
        }
        const json = await res.json();
        const points: ChartPoint[] = (json?.data ?? [])
          .map((p: MFAPIPoint) => ({
            ts: parseDDMMYYYY(p.date),
            date: p.date,
            nav: parseFloat(p.nav),
          }))
          .filter((p: ChartPoint) => !isNaN(p.nav) && !isNaN(p.ts))
          // MFAPI returns newest first → sort ascending for the chart
          .sort((a: ChartPoint, b: ChartPoint) => a.ts - b.ts);
        if (!cancelled) {
          setRaw(points);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load NAV history');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [amfiCode]);

  const data = useMemo(() => {
    if (!raw) return [];
    const days = RANGE_DAYS[range];
    if (days == null) return raw;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return raw.filter((p) => p.ts >= cutoff);
  }, [raw, range]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const first = data[0].nav;
    const last = data[data.length - 1].nav;
    const change = ((last - first) / first) * 100;
    return { first, last, change };
  }, [data]);

  return (
    <section className="py-8 bg-surface-100">
      <div className="container-custom">
        <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">NAV History</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily NAV from AMFI. Use the range buttons to zoom in.
              </p>
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {(['1Y', '3Y', '5Y', 'MAX'] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    range === r
                      ? 'bg-white text-brand shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {stats && (
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div>
                <span className="text-slate-500">Start: </span>
                <span className="font-semibold tabular-nums">₹{fmtINR(stats.first)}</span>
              </div>
              <div>
                <span className="text-slate-500">Latest: </span>
                <span className="font-semibold tabular-nums">₹{fmtINR(stats.last)}</span>
              </div>
              <div>
                <span className="text-slate-500">Change: </span>
                <span
                  className={`font-semibold tabular-nums ${
                    stats.change >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {stats.change >= 0 ? '+' : ''}
                  {stats.change.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          <div className="h-72 lg:h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading NAV history…
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center text-rose-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            ) : data.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No NAV data available for this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`nav-grad-${amfiCode}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0c4a6e" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#0c4a6e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={fmtDateShort}
                    stroke="#94a3b8"
                    style={{ fontSize: 11 }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `₹${Math.round(v)}`}
                    stroke="#94a3b8"
                    style={{ fontSize: 11 }}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value: number) => [`₹${fmtINR(value)}`, 'NAV']}
                    labelFormatter={(label: number) =>
                      new Date(label).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    }
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="nav"
                    stroke="#0c4a6e"
                    strokeWidth={2}
                    fill={`url(#nav-grad-${amfiCode})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            NAV data sourced from AMFI via the public MFAPI feed. {schemeName} · AMFI {amfiCode}.
          </p>
        </div>
      </div>
    </section>
  );
}
