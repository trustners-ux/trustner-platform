/**
 * FundAllocationBlock — three sub-cards:
 *   1. Asset mix (equity/debt/cash) — horizontal stacked bar
 *   2. Market-cap split (large/mid/small) — stacked bar
 *   3. Top-N concentration (top 3/5/10/20)
 *
 * Gracefully renders "Coming soon" when data is null.
 */

import { PieChart, BarChart3, Layers } from 'lucide-react';
import type { FundDetail } from '@/lib/services/pd-fund-detail';

interface Props {
  fund: FundDetail;
}

const pct = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`);

function StackedBar({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.value.toFixed(1)}%`}
          />
        ))}
      </div>
      <ul className="space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">
              {s.value.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComingSoon({ note }: { note: string }) {
  return (
    <div className="text-xs text-slate-500 italic h-full flex items-center justify-center py-6 border border-dashed border-slate-200 rounded-md">
      {note}
    </div>
  );
}

export function FundAllocationBlock({ fund }: Props) {
  // Asset mix — only if any of equity/debt/cash is non-null
  const assetMix: Array<{ label: string; value: number; color: string }> = [];
  if (fund.equity_pct != null && fund.equity_pct > 0)
    assetMix.push({ label: 'Equity', value: fund.equity_pct, color: '#0c4a6e' });
  if (fund.debt_pct != null && fund.debt_pct > 0)
    assetMix.push({ label: 'Debt', value: fund.debt_pct, color: '#0f766e' });
  if (fund.cash_pct != null && fund.cash_pct > 0)
    assetMix.push({ label: 'Cash & Equivalents', value: fund.cash_pct, color: '#94a3b8' });

  // Market-cap split
  const capSplit: Array<{ label: string; value: number; color: string }> = [];
  if (fund.large_cap_pct != null && fund.large_cap_pct > 0)
    capSplit.push({ label: 'Large Cap', value: fund.large_cap_pct, color: '#0c4a6e' });
  if (fund.mid_cap_pct != null && fund.mid_cap_pct > 0)
    capSplit.push({ label: 'Mid Cap', value: fund.mid_cap_pct, color: '#b45309' });
  if (fund.small_cap_pct != null && fund.small_cap_pct > 0)
    capSplit.push({ label: 'Small Cap', value: fund.small_cap_pct, color: '#be123c' });

  return (
    <section className="py-8 bg-surface-100">
      <div className="container-custom">
        <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-4">
          Portfolio Allocation
        </h2>
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Asset mix */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-4 h-4 text-brand-700" />
              <h3 className="text-sm font-semibold text-slate-900">Asset Mix</h3>
            </div>
            {assetMix.length > 0 ? (
              <StackedBar segments={assetMix} />
            ) : (
              <ComingSoon note="Asset mix data coming soon" />
            )}
            {fund.net_equity_pct != null && (
              <div className="mt-3 text-[11px] text-slate-500">
                Net equity exposure (after derivatives): {pct(fund.net_equity_pct)}
              </div>
            )}
          </div>

          {/* Market-cap split */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-brand-700" />
              <h3 className="text-sm font-semibold text-slate-900">Market-Cap Split</h3>
            </div>
            {capSplit.length > 0 ? (
              <StackedBar segments={capSplit} />
            ) : (
              <ComingSoon note="Market-cap split coming soon" />
            )}
          </div>

          {/* Concentration */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-brand-700" />
              <h3 className="text-sm font-semibold text-slate-900">Concentration</h3>
            </div>
            {fund.top_3_pct == null &&
            fund.top_5_pct == null &&
            fund.top_10_pct == null &&
            fund.top_20_pct == null ? (
              <ComingSoon note="Top-holding concentration coming soon" />
            ) : (
              <ul className="space-y-2">
                {[
                  { label: 'Top 3 holdings', value: fund.top_3_pct },
                  { label: 'Top 5 holdings', value: fund.top_5_pct },
                  { label: 'Top 10 holdings', value: fund.top_10_pct },
                  { label: 'Top 20 holdings', value: fund.top_20_pct },
                ].map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5 last:border-none"
                  >
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {pct(row.value)}
                    </span>
                  </li>
                ))}
                {fund.holdings_count != null && (
                  <li className="text-[11px] text-slate-500 pt-1">
                    Total holdings: {fund.holdings_count}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
