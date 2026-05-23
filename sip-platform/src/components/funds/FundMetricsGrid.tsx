'use client';

import { IndianRupee, Calendar, User, Percent, BarChart3, Lock } from 'lucide-react';
import type { LiveFundDetail } from '@/types/live-fund';

interface FundMetricsGridProps {
  fund: LiveFundDetail;
}

function formatAUM(aum: number | null): string {
  if (aum === null || aum === undefined) return '--';
  if (aum >= 10000) return `${(aum / 10000).toFixed(1)}L Cr`;
  if (aum >= 1000) return `${(aum / 1000).toFixed(1)}K Cr`;
  return `${aum.toLocaleString('en-IN')} Cr`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function FundMetricsGrid({ fund }: FundMetricsGridProps) {
  const enriched = fund.enriched;

  const metrics = [
    {
      label: 'Current NAV',
      value: `\u20B9${fund.currentNav.toFixed(2)}`,
      sub: fund.navDate,
      icon: IndianRupee,
    },
    {
      label: 'AUM',
      value: enriched?.aum ? `\u20B9${formatAUM(enriched.aum)}` : '--',
      sub: 'Assets Under Management',
      icon: BarChart3,
    },
    {
      label: 'Expense Ratio',
      value: enriched?.expenseRatio !== null && enriched?.expenseRatio !== undefined
        ? `${enriched.expenseRatio.toFixed(2)}%`
        : '--',
      sub: enriched?.expenseRatioDate ? `as on ${formatDate(enriched.expenseRatioDate)}` : '',
      icon: Percent,
    },
    {
      label: 'Fund Manager',
      value: enriched?.fundManager || '--',
      sub: '',
      icon: User,
    },
    {
      label: 'Inception Date',
      value: formatDate(enriched?.startDate || null),
      sub: '',
      icon: Calendar,
    },
    {
      label: 'Lock-in Period',
      value: enriched?.lockInPeriod
        ? `${enriched.lockInPeriod} ${enriched.lockInPeriod === 1 ? 'Year' : 'Years'}`
        : 'None',
      sub: '',
      icon: Lock,
    },
  ];

  return (
    <section className="section-padding bg-surface-100">
      <div className="container-custom">
        <h2 className="text-display-sm text-primary-700 mb-6">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="bg-white rounded-xl border border-surface-300/70 p-4 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-brand" />
                  <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                    {m.label}
                  </span>
                </div>
                <div className="text-base font-bold text-primary-700 truncate">{m.value}</div>
                {m.sub && (
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{m.sub}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
