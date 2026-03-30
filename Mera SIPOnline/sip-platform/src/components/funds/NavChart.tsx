'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useNavHistory } from '@/lib/hooks/useNavHistory';

interface NavChartProps {
  schemeCode: number;
}

type Period = '1Y' | '3Y' | '5Y' | 'MAX';

const PERIODS: { label: string; value: Period }[] = [
  { label: '1Y', value: '1Y' },
  { label: '3Y', value: '3Y' },
  { label: '5Y', value: '5Y' },
  { label: 'Max', value: 'MAX' },
];

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  } catch {
    return dateStr;
  }
}

interface TooltipPayloadItem {
  value: number;
  payload: { date: string; nav: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  return (
    <div className="bg-white rounded-lg shadow-elevated border border-surface-300/70 px-3 py-2">
      <p className="text-xs text-slate-500 mb-0.5">{formatDate(point.payload.date)}</p>
      <p className="text-sm font-bold text-primary-700">
        {'\u20B9'}{point.value.toFixed(2)}
      </p>
    </div>
  );
}

export function NavChart({ schemeCode }: NavChartProps) {
  const [period, setPeriod] = useState<Period>('3Y');
  const { data, loading, error } = useNavHistory(schemeCode, period);

  // Format tick labels for X axis
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((point) => ({
      ...point,
      formattedDate: formatDate(point.date),
    }));
  }, [data]);

  // Calculate min/max for Y axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    const navValues = chartData.map((d) => d.nav);
    const min = Math.min(...navValues);
    const max = Math.max(...navValues);
    const padding = (max - min) * 0.05;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  return (
    <section className="section-padding bg-surface-100">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand" />
            <h2 className="text-display-sm text-primary-700">NAV History</h2>
          </div>

          {/* Period selector */}
          <div className="flex bg-white rounded-lg p-0.5 border border-surface-300/70">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-4 py-1.5 text-xs font-semibold rounded-md transition-all',
                  period === p.value
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-500 hover:text-primary-700'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-300/70 p-4 sm:p-6 shadow-card">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-brand mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-slate-400">Loading NAV data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm text-slate-400">No NAV data available for this period.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F766E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0F766E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DED8" vertical={false} />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 10, fill: '#9A8E82' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2DED8' }}
                  interval="preserveStartEnd"
                  minTickGap={60}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: '#9A8E82' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `\u20B9${v}`}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="nav"
                  stroke="#0F766E"
                  strokeWidth={2}
                  fill="url(#navGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#0F766E', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
