/**
 * FundRiskBlock — Sharpe / Sortino / Volatility / Max Drawdown tiles
 * with hover-tooltip explanations.
 *
 * Max-drawdown isn't yet stored in pd_fund_research_stats — rendered as
 * "Coming soon" when null.
 */

import { Activity, TrendingDown, TrendingUp, ShieldAlert } from 'lucide-react';
import type { FundDetail } from '@/lib/services/pd-fund-detail';

interface Props {
  fund: FundDetail;
  // optional maxDrawdown if/when stored — gracefully degrades if undefined
  maxDrawdown?: number | null;
}

interface Tile {
  label: string;
  value: string;
  tooltip: string;
  icon: typeof Activity;
  tone: string;
}

export function FundRiskBlock({ fund, maxDrawdown }: Props) {
  const tiles: Tile[] = [
    {
      label: 'Sharpe Ratio',
      value: fund.sharpe != null ? fund.sharpe.toFixed(2) : '—',
      tooltip:
        'Risk-adjusted return — excess return per unit of total volatility. Higher is better.',
      icon: TrendingUp,
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Sortino Ratio',
      value: fund.sortino != null ? fund.sortino.toFixed(2) : '—',
      tooltip:
        'Like Sharpe, but penalises only downside volatility. Higher is better.',
      icon: TrendingUp,
      tone: 'text-teal-700 bg-teal-50',
    },
    {
      label: 'Volatility (1Y)',
      value: fund.volatility != null ? `${fund.volatility.toFixed(2)}%` : '—',
      tooltip:
        'Annualised standard deviation of daily returns. Lower means a smoother ride.',
      icon: Activity,
      tone: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Max Drawdown',
      value:
        maxDrawdown != null && !isNaN(maxDrawdown)
          ? `${maxDrawdown.toFixed(2)}%`
          : 'Coming soon',
      tooltip:
        'Largest peak-to-trough loss over the period. A measure of worst-case downside.',
      icon: TrendingDown,
      tone: 'text-rose-700 bg-rose-50',
    },
  ];

  return (
    <section className="py-8 bg-white border-y border-slate-200">
      <div className="container-custom">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-rose-700" />
          <h2 className="text-lg lg:text-xl font-bold text-slate-900">Risk Profile</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.label}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative group"
                title={t.tooltip}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {t.label}
                  </span>
                  <span className={`w-7 h-7 rounded-md ${t.tone} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 tabular-nums">
                  {t.value}
                </div>
                <p className="mt-1 text-[10.5px] text-slate-500 leading-snug">{t.tooltip}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
