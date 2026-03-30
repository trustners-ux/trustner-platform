'use client';

import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown, SearchX } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { generateFundSlug } from '@/lib/utils/fund-slug';
import type { SortField, SortDirection, ScreenerFund } from '@/lib/hooks/useScreener';

// Generate fund detail URL: use schemeCode slug if available, otherwise fall back to id (resolution handles it)
function fundHref(fund: ScreenerFund): string {
  if (fund.schemeCode) {
    return `/funds/${generateFundSlug(fund.schemeCode, fund.name)}`;
  }
  return `/funds/${fund.id}`;
}

interface ScreenerResultsProps {
  results: ScreenerFund[];
  totalFunds: number;
  sortBy: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  loading?: boolean;
}

// ─── Formatters (Trustner data uses decimals) ───

function fmtReturn(val: number): { text: string; color: string } {
  if (val === 0) return { text: '--', color: 'text-gray-400' };
  const pct = val * 100;
  return {
    text: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
    color: pct >= 0 ? 'text-green-600' : 'text-red-500',
  };
}

function fmtAUM(aumCr: number): string {
  return `\u20B9${new Intl.NumberFormat('en-IN').format(Math.round(aumCr))} Cr`;
}

function fmtTER(ter: number): string {
  return `${(ter * 100).toFixed(2)}%`;
}

function fmtSharpe(sr: number): string {
  return sr.toFixed(2);
}

// ─── Column Definitions ───

interface Column {
  key: SortField | 'name' | 'category';
  label: string;
  shortLabel: string;
  sortable: boolean;
  align: 'left' | 'right';
  minWidth?: string;
}

const COLUMNS: Column[] = [
  { key: 'name',       label: 'Fund Name',      shortLabel: 'Fund',      sortable: false, align: 'left',  minWidth: 'min-w-[220px]' },
  { key: 'category',   label: 'Category',        shortLabel: 'Category',  sortable: false, align: 'left' },
  { key: 'oneYear',    label: '1Y Return',       shortLabel: '1Y',        sortable: true,  align: 'right' },
  { key: 'threeYear',  label: '3Y Return',       shortLabel: '3Y',        sortable: true,  align: 'right' },
  { key: 'fiveYear',   label: '5Y Return',       shortLabel: '5Y',        sortable: true,  align: 'right' },
  { key: 'aumCr',      label: 'AUM',             shortLabel: 'AUM',       sortable: true,  align: 'right' },
  { key: 'ter',        label: 'TER',             shortLabel: 'TER',       sortable: true,  align: 'right' },
  { key: 'sharpeRatio',label: 'Sharpe',          shortLabel: 'Sharpe',    sortable: true,  align: 'right' },
  { key: 'rank',       label: 'Rank',            shortLabel: '#',         sortable: true,  align: 'right' },
];

// ─── Sort Header ───

function SortHeader({
  column,
  sortBy,
  sortDirection,
  onSort,
}: {
  column: Column;
  sortBy: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  if (!column.sortable) {
    return (
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {column.label}
      </span>
    );
  }

  const isActive = sortBy === column.key;
  const Icon = isActive
    ? sortDirection === 'asc' ? ArrowUp : ArrowDown
    : ArrowUpDown;

  return (
    <button
      onClick={() => onSort(column.key as SortField)}
      className={cn(
        'flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors',
        isActive ? 'text-teal-700' : 'text-gray-500 hover:text-gray-700'
      )}
    >
      {column.label}
      <Icon className={cn('w-3 h-3', isActive ? 'text-teal-600' : 'text-gray-400')} />
    </button>
  );
}

// ─── Skeleton ───

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {COLUMNS.map((col) => (
        <td key={col.key} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ─── Mobile Card ───

function MobileCard({ fund }: { fund: ScreenerFund }) {
  const oneY = fmtReturn(fund.returns.oneYear);
  const threeY = fmtReturn(fund.returns.threeYear);
  const fiveY = fmtReturn(fund.returns.fiveYear);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={fundHref(fund)}
          className="font-semibold text-sm text-gray-900 hover:text-teal-700 transition-colors line-clamp-2 flex-1"
        >
          {fund.name}
        </Link>
        <span className="flex-shrink-0 bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
          #{fund.rank}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {fund.category}
        </span>
        <span className="text-[11px] text-gray-400">{fund.riskLevel}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="text-[10px] text-gray-500">1Y</div>
          <div className={cn('text-sm font-bold', oneY.color)}>{oneY.text}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">3Y</div>
          <div className={cn('text-sm font-bold', threeY.color)}>{threeY.text}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500">5Y</div>
          <div className={cn('text-sm font-bold', fiveY.color)}>{fiveY.text}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <span>AUM <span className="font-medium text-gray-700">{fmtAUM(fund.aumCr)}</span></span>
        <span>TER <span className="font-medium text-gray-700">{fmtTER(fund.ter)}</span></span>
        <span>Sharpe <span className="font-medium text-gray-700">{fmtSharpe(fund.sharpeRatio)}</span></span>
      </div>
    </div>
  );
}

// ─── Main Component ───

export function ScreenerResults({
  results,
  totalFunds,
  sortBy,
  sortDirection,
  onSort,
  loading = false,
}: ScreenerResultsProps) {
  // Empty state
  if (!loading && results.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
        <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No funds match your filters</h3>
        <p className="text-sm text-gray-500">Try adjusting the criteria or reset the filters to see all funds.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Result count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{results.length}</span> of{' '}
          <span className="font-semibold text-gray-700">{totalFunds}</span> funds
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 whitespace-nowrap',
                      col.align === 'right' ? 'text-right' : 'text-left',
                      col.minWidth
                    )}
                  >
                    <SortHeader
                      column={col}
                      sortBy={sortBy}
                      sortDirection={sortDirection}
                      onSort={onSort}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : (
                results.map((fund) => {
                  const oneY = fmtReturn(fund.returns.oneYear);
                  const threeY = fmtReturn(fund.returns.threeYear);
                  const fiveY = fmtReturn(fund.returns.fiveYear);

                  return (
                    <tr
                      key={fund.id}
                      className="hover:bg-teal-50/40 transition-colors group"
                    >
                      {/* Fund Name */}
                      <td className="px-4 py-3 min-w-[220px]">
                        <Link
                          href={fundHref(fund)}
                          className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors line-clamp-1 group-hover:text-teal-700"
                        >
                          {fund.name}
                        </Link>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {fund.category}
                        </span>
                      </td>
                      {/* 1Y */}
                      <td className={cn('px-4 py-3 text-right text-sm font-semibold', oneY.color)}>
                        {oneY.text}
                      </td>
                      {/* 3Y */}
                      <td className={cn('px-4 py-3 text-right text-sm font-semibold', threeY.color)}>
                        {threeY.text}
                      </td>
                      {/* 5Y */}
                      <td className={cn('px-4 py-3 text-right text-sm font-semibold', fiveY.color)}>
                        {fiveY.text}
                      </td>
                      {/* AUM */}
                      <td className="px-4 py-3 text-right text-sm text-gray-700 whitespace-nowrap">
                        {fmtAUM(fund.aumCr)}
                      </td>
                      {/* TER */}
                      <td className="px-4 py-3 text-right text-sm text-gray-700">
                        {fmtTER(fund.ter)}
                      </td>
                      {/* Sharpe */}
                      <td className="px-4 py-3 text-right text-sm text-gray-700">
                        {fmtSharpe(fund.sharpeRatio)}
                      </td>
                      {/* Rank */}
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-50 text-teal-700 text-xs font-bold">
                          {fund.rank}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        ) : (
          results.map((fund) => <MobileCard key={fund.id} fund={fund} />)
        )}
      </div>
    </div>
  );
}
