'use client';

import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { LiveFundDetail } from '@/types/live-fund';

interface FundReturnsTableProps {
  fund: LiveFundDetail;
}

function formatReturn(val: number | null): string {
  if (val === null || val === undefined) return '--';
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

function returnColor(val: number | null): string {
  if (val === null || val === undefined) return 'text-slate-400';
  return val >= 0 ? 'text-positive' : 'text-red-500';
}

export function FundReturnsTable({ fund }: FundReturnsTableProps) {
  const enriched = fund.enriched;
  const calc = fund.calculatedReturns;

  // Use enriched returns preferentially, fall back to calculated
  const rows = [
    {
      period: '1 Week',
      enrichedReturn: enriched?.returns?.oneWeek ?? null,
      calculatedReturn: null as number | null,
    },
    {
      period: '1 Year',
      enrichedReturn: enriched?.returns?.oneYear ?? null,
      calculatedReturn: calc?.oneYear ?? null,
    },
    {
      period: '3 Year',
      enrichedReturn: enriched?.returns?.threeYear ?? null,
      calculatedReturn: calc?.threeYear ?? null,
    },
    {
      period: '5 Year',
      enrichedReturn: enriched?.returns?.fiveYear ?? null,
      calculatedReturn: calc?.fiveYear ?? null,
    },
    {
      period: 'Since Inception',
      enrichedReturn: enriched?.returns?.sinceInception ?? null,
      calculatedReturn: null as number | null,
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-brand" />
          <h2 className="text-display-sm text-primary-700">Returns (CAGR)</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-surface-300/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-100 border-b border-surface-300/70">
                <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Period
                </th>
                <th className="text-right p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Return
                </th>
                <th className="text-right p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                // Prefer enriched; fall back to calculated
                const displayReturn = row.enrichedReturn ?? row.calculatedReturn;
                const source = row.enrichedReturn !== null
                  ? 'Kuvera'
                  : row.calculatedReturn !== null
                    ? 'CAGR (NAV)'
                    : '--';

                return (
                  <tr
                    key={row.period}
                    className={cn(
                      'border-b border-surface-200',
                      i % 2 === 1 && 'bg-surface-50/50'
                    )}
                  >
                    <td className="p-3 font-medium text-primary-700">{row.period}</td>
                    <td className={cn('p-3 text-right font-bold text-base', returnColor(displayReturn))}>
                      {formatReturn(displayReturn)}
                    </td>
                    <td className="p-3 text-right text-xs text-slate-400">{source}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
