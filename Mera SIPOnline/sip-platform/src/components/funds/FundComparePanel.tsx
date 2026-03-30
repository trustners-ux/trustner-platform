'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { RankBadge } from './RankBadge';
import {
  formatTER,
  formatStdDev,
  formatSharpe,
  formatAUMShort,
} from '@/lib/utils/formatters';
import type { TrustnerCuratedFund } from '@/types/funds';

const COMPARE_METRICS: {
  label: string;
  getValue: (f: TrustnerCuratedFund) => string;
  getBest: (funds: TrustnerCuratedFund[]) => string;
}[] = [
  {
    label: 'AUM',
    getValue: (f) => formatAUMShort(f.aumCr),
    getBest: (funds) => formatAUMShort(Math.max(...funds.map((f) => f.aumCr))),
  },
  {
    label: 'TER',
    getValue: (f) => formatTER(f.ter),
    getBest: (funds) => formatTER(Math.min(...funds.filter((f) => f.ter > 0).map((f) => f.ter))),
  },
  {
    label: 'Sharpe Ratio',
    getValue: (f) => formatSharpe(f.sharpeRatio),
    getBest: (funds) => formatSharpe(Math.max(...funds.map((f) => f.sharpeRatio))),
  },
  {
    label: 'Std Deviation',
    getValue: (f) => formatStdDev(f.standardDeviation),
    getBest: (funds) =>
      formatStdDev(Math.min(...funds.filter((f) => f.standardDeviation > 0).map((f) => f.standardDeviation))),
  },
  {
    label: '1Y Return',
    getValue: (f) => f.returns.oneYear ? `${(f.returns.oneYear * 100).toFixed(1)}%` : '—',
    getBest: (funds) => `${(Math.max(...funds.map((f) => f.returns.oneYear)) * 100).toFixed(1)}%`,
  },
  {
    label: '3Y Return',
    getValue: (f) => f.returns.threeYear ? `${(f.returns.threeYear * 100).toFixed(1)}%` : '—',
    getBest: (funds) => `${(Math.max(...funds.map((f) => f.returns.threeYear)) * 100).toFixed(1)}%`,
  },
  {
    label: '5Y Return',
    getValue: (f) => f.returns.fiveYear ? `${(f.returns.fiveYear * 100).toFixed(1)}%` : '—',
    getBest: (funds) => `${(Math.max(...funds.map((f) => f.returns.fiveYear)) * 100).toFixed(1)}%`,
  },
  {
    label: 'Fund Age',
    getValue: (f) => `${f.ageOfFund.toFixed(1)} yrs`,
    getBest: () => '',
  },
  {
    label: 'Holdings',
    getValue: (f) => `${f.numberOfHoldings}`,
    getBest: () => '',
  },
];

export function FundComparePanel({
  funds,
  onRemove,
  onClose,
}: {
  funds: TrustnerCuratedFund[];
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  if (funds.length < 2) return null;

  return (
    <div className="card-base overflow-hidden print:break-inside-avoid">
      <div className="bg-gradient-to-r from-brand to-brand-700 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Fund Comparison</h3>
          <p className="text-xs text-white/70">Comparing {funds.length} funds side by side</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors print:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-50">
              <th className="text-left p-3 font-semibold text-slate-500 min-w-[120px] sticky left-0 bg-surface-50 z-10">
                Metric
              </th>
              {funds.map((fund) => (
                <th key={fund.id} className="p-3 text-left min-w-[160px]">
                  <div className="flex items-start gap-2">
                    <RankBadge rank={fund.rank} />
                    <div className="min-w-0">
                      <div className="font-bold text-primary-700 text-[11px] leading-tight">
                        {fund.name.length > 30 ? fund.name.substring(0, 30) + '...' : fund.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{fund.category}</div>
                    </div>
                    <button
                      onClick={() => onRemove(fund.id)}
                      className="flex-shrink-0 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors print:hidden"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_METRICS.map((metric) => {
              const bestValue = metric.getBest(funds);
              return (
                <tr key={metric.label} className="border-t border-surface-200 hover:bg-surface-50/50">
                  <td className="p-3 font-medium text-slate-600 sticky left-0 bg-white z-10">
                    {metric.label}
                  </td>
                  {funds.map((fund) => {
                    const value = metric.getValue(fund);
                    const isBest = bestValue && value === bestValue;
                    return (
                      <td
                        key={fund.id}
                        className={cn(
                          'p-3 font-semibold',
                          isBest ? 'text-positive' : 'text-primary-700'
                        )}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
