'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { StarRating } from '@/components/funds/StarRatingShared';
import type { LiveFundDetail } from '@/types/live-fund';

interface LiveFundCompareTableProps {
  funds: LiveFundDetail[];
  onRemove: (schemeCode: number) => void;
}

/** Format AUM in crores with Indian numbering */
function formatAUM(aumCr: number | null): string {
  if (aumCr === null || aumCr === undefined) return '--';
  if (aumCr >= 1000) return `${(aumCr / 1000).toFixed(1)}K Cr`;
  return `${new Intl.NumberFormat('en-IN').format(Math.round(aumCr))} Cr`;
}

/** Format currency with rupee sign */
function formatRupee(val: number | null | undefined): string {
  if (val === null || val === undefined) return '--';
  return `\u20B9${new Intl.NumberFormat('en-IN').format(val)}`;
}

/** Format return with color info */
function formatReturn(val: number | null): { text: string; isPositive: boolean; isNull: boolean } {
  if (val === null || val === undefined) return { text: '--', isPositive: false, isNull: true };
  return {
    text: `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`,
    isPositive: val >= 0,
    isNull: false,
  };
}

/** Get best index for numeric comparison */
function getBestIdx(
  values: (number | null | undefined)[],
  mode: 'highest' | 'lowest'
): number {
  let bestIdx = -1;
  let bestVal = mode === 'highest' ? -Infinity : Infinity;
  values.forEach((v, i) => {
    if (v === null || v === undefined) return;
    if (mode === 'highest' && v > bestVal) {
      bestVal = v;
      bestIdx = i;
    }
    if (mode === 'lowest' && v < bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}

interface RowDef {
  label: string;
  getValue: (f: LiveFundDetail) => string | number | null;
  renderCell?: (f: LiveFundDetail, isBest: boolean) => React.ReactNode;
  bestMode?: 'highest' | 'lowest' | 'none';
  getNumeric?: (f: LiveFundDetail) => number | null | undefined;
}

export function LiveFundCompareTable({ funds, onRemove }: LiveFundCompareTableProps) {
  const rows: RowDef[] = useMemo(
    () => [
      {
        label: 'Fund Name',
        getValue: (f) => f.schemeName,
        bestMode: 'none' as const,
      },
      {
        label: 'AMC',
        getValue: (f) => f.fundHouse,
        bestMode: 'none' as const,
      },
      {
        label: 'Category',
        getValue: (f) => f.enriched?.category || f.schemeCategory || '--',
        bestMode: 'none' as const,
      },
      {
        label: 'Risk Level',
        getValue: (f) => {
          const tags = f.enriched?.tags || [];
          const riskTag = tags.find(
            (t) =>
              t.toLowerCase().includes('risk') ||
              t.toLowerCase().includes('high') ||
              t.toLowerCase().includes('low') ||
              t.toLowerCase().includes('moderate')
          );
          return riskTag || '--';
        },
        bestMode: 'none' as const,
      },
      {
        label: 'NAV',
        getValue: (f) => `\u20B9${f.currentNav.toFixed(2)}`,
        bestMode: 'none' as const,
      },
      {
        label: 'NAV Date',
        getValue: (f) => f.navDate || '--',
        bestMode: 'none' as const,
      },
      {
        label: '1Y Return',
        getValue: () => null,
        getNumeric: (f) => f.calculatedReturns.oneYear ?? f.enriched?.returns?.oneYear ?? null,
        renderCell: (f, isBest) => {
          const val = f.calculatedReturns.oneYear ?? f.enriched?.returns?.oneYear ?? null;
          const ret = formatReturn(val);
          return (
            <span
              className={cn(
                'font-semibold',
                ret.isNull ? 'text-gray-400' : ret.isPositive ? 'text-green-600' : 'text-red-600',
                isBest && !ret.isNull && 'font-bold'
              )}
            >
              {ret.text}
            </span>
          );
        },
        bestMode: 'highest' as const,
      },
      {
        label: '3Y Return',
        getValue: () => null,
        getNumeric: (f) => f.calculatedReturns.threeYear ?? f.enriched?.returns?.threeYear ?? null,
        renderCell: (f, isBest) => {
          const val = f.calculatedReturns.threeYear ?? f.enriched?.returns?.threeYear ?? null;
          const ret = formatReturn(val);
          return (
            <span
              className={cn(
                'font-semibold',
                ret.isNull ? 'text-gray-400' : ret.isPositive ? 'text-green-600' : 'text-red-600',
                isBest && !ret.isNull && 'font-bold'
              )}
            >
              {ret.text}
            </span>
          );
        },
        bestMode: 'highest' as const,
      },
      {
        label: '5Y Return',
        getValue: () => null,
        getNumeric: (f) => f.calculatedReturns.fiveYear ?? f.enriched?.returns?.fiveYear ?? null,
        renderCell: (f, isBest) => {
          const val = f.calculatedReturns.fiveYear ?? f.enriched?.returns?.fiveYear ?? null;
          const ret = formatReturn(val);
          return (
            <span
              className={cn(
                'font-semibold',
                ret.isNull ? 'text-gray-400' : ret.isPositive ? 'text-green-600' : 'text-red-600',
                isBest && !ret.isNull && 'font-bold'
              )}
            >
              {ret.text}
            </span>
          );
        },
        bestMode: 'highest' as const,
      },
      {
        label: 'AUM',
        getValue: (f) => formatAUM(f.enriched?.aum ?? null),
        getNumeric: (f) => f.enriched?.aum ?? null,
        bestMode: 'none' as const, // AUM shown but not highlighted
      },
      {
        label: 'Expense Ratio',
        getValue: (f) =>
          f.enriched?.expenseRatio !== null && f.enriched?.expenseRatio !== undefined
            ? `${f.enriched.expenseRatio.toFixed(2)}%`
            : '--',
        getNumeric: (f) => f.enriched?.expenseRatio ?? null,
        bestMode: 'lowest' as const,
      },
      {
        label: 'Fund Rating',
        getValue: () => null,
        getNumeric: (f) => f.enriched?.fundRating ?? null,
        renderCell: (f) => {
          const rating = f.enriched?.fundRating;
          if (!rating) return <span className="text-gray-400">--</span>;
          return <StarRating rating={rating} size="sm" />;
        },
        bestMode: 'none' as const,
      },
      {
        label: 'Fund Manager',
        getValue: (f) => f.enriched?.fundManager || '--',
        bestMode: 'none' as const,
      },
      {
        label: 'SIP Min',
        getValue: (f) => formatRupee(f.enriched?.sipMin),
        bestMode: 'none' as const,
      },
      {
        label: 'Lumpsum Min',
        getValue: (f) => formatRupee(f.enriched?.lumpMin),
        bestMode: 'none' as const,
      },
      {
        label: 'Inception Date',
        getValue: (f) => f.enriched?.startDate || '--',
        bestMode: 'none' as const,
      },
    ],
    []
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {/* Sticky label column */}
              <th className="text-left p-3 font-semibold text-gray-500 text-xs uppercase tracking-wider min-w-[140px] sticky left-0 bg-gray-50 z-10">
                Parameter
              </th>
              {funds.map((fund) => (
                <th key={fund.schemeCode} className="p-3 text-center min-w-[180px]">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-bold text-gray-900 text-xs leading-tight">
                        {fund.schemeName.length > 35
                          ? fund.schemeName.substring(0, 35) + '...'
                          : fund.schemeName}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{fund.fundHouse}</div>
                    </div>
                    <button
                      onClick={() => onRemove(fund.schemeCode)}
                      className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove fund"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              // Compute best index for this row
              const bestIdx =
                row.bestMode && row.bestMode !== 'none' && row.getNumeric
                  ? getBestIdx(
                      funds.map((f) => row.getNumeric!(f)),
                      row.bestMode
                    )
                  : -1;

              return (
                <tr
                  key={row.label}
                  className={cn(
                    'border-b border-gray-100',
                    rowIdx % 2 === 1 && 'bg-gray-50/50'
                  )}
                >
                  {/* Sticky first column */}
                  <td className={cn(
                    'p-3 font-medium text-gray-600 text-xs uppercase tracking-wider sticky left-0 z-10',
                    rowIdx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                  )}>
                    {row.label}
                  </td>
                  {funds.map((fund, fundIdx) => {
                    const isBest = fundIdx === bestIdx;
                    return (
                      <td
                        key={fund.schemeCode}
                        className={cn(
                          'p-3 text-center text-sm',
                          isBest && 'bg-green-50 font-semibold'
                        )}
                      >
                        {row.renderCell ? (
                          row.renderCell(fund, isBest)
                        ) : (
                          <span className={cn(isBest ? 'text-green-700' : 'text-gray-900')}>
                            {row.getValue(fund) ?? '--'}
                          </span>
                        )}
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
