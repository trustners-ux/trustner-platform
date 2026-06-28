/**
 * FundKpiGrid — 4-tile KPI strip (AUM, TER, Sharpe, Volatility).
 */

import { Banknote, Percent, TrendingUp, Activity } from 'lucide-react';
import type { FundDetail } from '@/lib/services/pd-fund-detail';

interface Props {
  fund: FundDetail;
}

const fmtCr = (v: number | null) => {
  if (v == null) return '—';
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L Cr`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(2)}K Cr`;
  return `₹${v.toFixed(0)} Cr`;
};

export function FundKpiGrid({ fund }: Props) {
  const tiles = [
    {
      label: 'AUM',
      value: fmtCr(fund.aum_inr_cr),
      sub: 'Assets under management',
      icon: Banknote,
      tone: 'text-brand-700',
      bg: 'bg-brand-50',
    },
    {
      label: 'Expense Ratio',
      value: fund.ter != null ? `${fund.ter.toFixed(2)}%` : '—',
      sub: 'Total Expense Ratio (TER)',
      icon: Percent,
      tone: 'text-rose-700',
      bg: 'bg-rose-50',
    },
    {
      label: 'Sharpe Ratio',
      value: fund.sharpe != null ? fund.sharpe.toFixed(2) : '—',
      sub: 'Risk-adjusted return',
      icon: TrendingUp,
      tone: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Volatility',
      value: fund.volatility != null ? `${fund.volatility.toFixed(2)}%` : '—',
      sub: 'Standard deviation (annualised)',
      icon: Activity,
      tone: 'text-amber-700',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <section className="py-8 bg-surface-100">
      <div className="container-custom">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <div
                key={tile.label}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {tile.label}
                  </span>
                  <span className={`w-8 h-8 rounded-lg ${tile.bg} ${tile.tone} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {tile.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{tile.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
