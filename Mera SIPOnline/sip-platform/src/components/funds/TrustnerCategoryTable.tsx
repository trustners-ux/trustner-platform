'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { RankBadge } from './RankBadge';
import {
  formatTER,
  formatStdDev,
  formatSharpe,
  formatAUMShort,
  formatSkinPercent,
} from '@/lib/utils/formatters';
import {
  ChevronDown,
  ChevronUp,
  User,
  ArrowUpDown,
} from 'lucide-react';
import type { TrustnerFundCategory, TrustnerCuratedFund, FundNavData } from '@/types/funds';

type SortKey = 'rank' | 'ter' | 'sharpe' | 'sd' | '3m' | '6m' | '1y' | '3y' | '5y' | 'aum';

const SORT_OPTIONS: { key: SortKey; label: string; shortLabel: string }[] = [
  { key: 'rank', label: 'Rank', shortLabel: 'Rank' },
  { key: 'ter', label: 'Lowest TER', shortLabel: 'TER' },
  { key: 'sharpe', label: 'Best Sharpe', shortLabel: 'Sharpe' },
  { key: '3m', label: '3M Return', shortLabel: '3M' },
  { key: '6m', label: '6M Return', shortLabel: '6M' },
  { key: '1y', label: '1Y Return', shortLabel: '1Y' },
  { key: '3y', label: '3Y Return', shortLabel: '3Y' },
  { key: '5y', label: '5Y Return', shortLabel: '5Y' },
  { key: 'aum', label: 'Largest AUM', shortLabel: 'AUM' },
];

function getSortedFunds(funds: TrustnerCuratedFund[], key: SortKey): TrustnerCuratedFund[] {
  const sorted = [...funds];
  switch (key) {
    case 'rank': return sorted.sort((a, b) => a.rank - b.rank);
    case 'ter': return sorted.sort((a, b) => (a.ter || 999) - (b.ter || 999));
    case 'sharpe': return sorted.sort((a, b) => b.sharpeRatio - a.sharpeRatio);
    case 'sd': return sorted.sort((a, b) => (a.standardDeviation || 999) - (b.standardDeviation || 999));
    case '3m': return sorted.sort((a, b) => (b.returns.threeMonth || 0) - (a.returns.threeMonth || 0));
    case '6m': return sorted.sort((a, b) => (b.returns.sixMonth || 0) - (a.returns.sixMonth || 0));
    case '1y': return sorted.sort((a, b) => b.returns.oneYear - a.returns.oneYear);
    case '3y': return sorted.sort((a, b) => b.returns.threeYear - a.returns.threeYear);
    case '5y': return sorted.sort((a, b) => b.returns.fiveYear - a.returns.fiveYear);
    case 'aum': return sorted.sort((a, b) => b.aumCr - a.aumCr);
    default: return sorted;
  }
}

// ─── Return Cell — color-coded ───
function ReturnCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-slate-300">—</span>;
  const pct = value * 100;
  const isPositive = pct >= 0;
  return (
    <span className={cn('font-semibold tabular-nums', isPositive ? 'text-positive' : 'text-red-500')}>
      {isPositive ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

// ─── Helpers ───
function getBestInColumn(funds: TrustnerCuratedFund[], getter: (f: TrustnerCuratedFund) => number): number {
  const values = funds.map(getter).filter((v) => v !== 0);
  return values.length ? Math.max(...values) : 0;
}
function getLowestInColumn(funds: TrustnerCuratedFund[], getter: (f: TrustnerCuratedFund) => number): number {
  const values = funds.map(getter).filter((v) => v > 0);
  return values.length ? Math.min(...values) : 0;
}

// ─── Expandable Fund Row ───
function FundRow({
  fund,
  category,
  bestSharpe,
  lowestTER,
  lowestSD,
  best1Y,
  best3Y,
  best5Y,
  compareMode,
  isSelected,
  onToggleCompare,
  navData,
}: {
  fund: TrustnerCuratedFund;
  category: TrustnerFundCategory;
  bestSharpe: number;
  lowestTER: number;
  lowestSD: number;
  best1Y: number;
  best3Y: number;
  best5Y: number;
  compareMode: boolean;
  isSelected: boolean;
  onToggleCompare: (fund: TrustnerCuratedFund) => void;
  navData?: FundNavData;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* ── Main Row ── */}
      <tr
        className={cn(
          'border-b border-surface-200 hover:bg-surface-50/80 transition-colors cursor-pointer group',
          fund.rank === 1 && 'bg-amber-50/40',
          compareMode && isSelected && 'bg-brand-50/40'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Compare checkbox (only in compare mode) */}
        {compareMode && (
          <td className="pl-3 pr-1 py-3 w-8">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCompare(fund); }}
              className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                isSelected ? 'bg-brand border-brand text-white' : 'border-slate-300 hover:border-brand-300'
              )}
            >
              {isSelected && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </td>
        )}

        {/* Rank */}
        <td className={cn('py-3 w-14 text-center', !compareMode && 'pl-3')}>
          <RankBadge rank={fund.rank} />
        </td>

        {/* Fund Name + Manager */}
        <td className="py-3 pr-3">
          <div className="min-w-0">
            <div className="font-semibold text-primary-700 text-sm leading-tight truncate max-w-[280px]">
              {fund.name}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <User className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{fund.fundManager}</span>
            </div>
          </div>
        </td>

        {/* Returns — MTD through 5Y (with live NAV overlay) */}
        {(() => {
          // Use live NAV returns if available, otherwise fall back to static
          const r = {
            mtd: navData?.returns.oneMonth ?? fund.returns.mtd,
            ytd: navData?.returns.ytd ?? fund.returns.ytd,
            threeMonth: navData?.returns.threeMonth ?? fund.returns.threeMonth ?? 0,
            sixMonth: navData?.returns.sixMonth ?? fund.returns.sixMonth ?? 0,
            oneYear: navData?.returns.oneYear ?? fund.returns.oneYear,
            twoYear: fund.returns.twoYear,
            threeYear: navData?.returns.threeYear ?? fund.returns.threeYear,
            fiveYear: navData?.returns.fiveYear ?? fund.returns.fiveYear,
          };
          return (
            <>
              <td className="py-3 px-2 text-center text-xs hidden sm:table-cell">
                <ReturnCell value={r.mtd} />
              </td>
              <td className="py-3 px-2 text-center text-xs hidden sm:table-cell">
                <ReturnCell value={r.ytd} />
              </td>
              <td className="py-3 px-2 text-center text-xs hidden md:table-cell">
                <ReturnCell value={r.threeMonth} />
              </td>
              <td className="py-3 px-2 text-center text-xs hidden md:table-cell">
                <ReturnCell value={r.sixMonth} />
              </td>
              <td className="py-3 px-2 text-center text-xs">
                <span className={cn(r.oneYear === best1Y && best1Y > 0 && 'bg-positive-50 px-1.5 py-0.5 rounded')}>
                  <ReturnCell value={r.oneYear} />
                </span>
              </td>
              <td className="py-3 px-2 text-center text-xs hidden md:table-cell">
                <ReturnCell value={r.twoYear} />
              </td>
              <td className="py-3 px-2 text-center text-xs">
                <span className={cn(r.threeYear === best3Y && best3Y > 0 && 'bg-positive-50 px-1.5 py-0.5 rounded')}>
                  <ReturnCell value={r.threeYear} />
                </span>
              </td>
              <td className="py-3 px-2 text-center text-xs">
                <span className={cn(r.fiveYear === best5Y && best5Y > 0 && 'bg-positive-50 px-1.5 py-0.5 rounded')}>
                  <ReturnCell value={r.fiveYear} />
                </span>
              </td>
            </>
          );
        })()}

        {/* AUM */}
        <td className="py-3 px-2 text-right text-xs text-slate-600 hidden lg:table-cell whitespace-nowrap">
          {formatAUMShort(fund.aumCr)}
        </td>

        {/* TER */}
        <td className={cn(
          'py-3 px-2 text-right text-xs hidden lg:table-cell whitespace-nowrap',
          fund.ter === lowestTER && lowestTER > 0 ? 'text-positive font-semibold' : 'text-slate-600'
        )}>
          {formatTER(fund.ter)}
        </td>

        {/* Sharpe */}
        <td className={cn(
          'py-3 px-2 text-right text-xs hidden xl:table-cell',
          fund.sharpeRatio === bestSharpe && bestSharpe > 0 ? 'text-positive font-semibold' : 'text-slate-600'
        )}>
          {formatSharpe(fund.sharpeRatio)}
        </td>

        {/* Std Dev */}
        <td className={cn(
          'py-3 px-2 text-right text-xs hidden xl:table-cell',
          fund.standardDeviation === lowestSD && lowestSD > 0 ? 'text-positive font-semibold' : 'text-slate-600'
        )}>
          {formatStdDev(fund.standardDeviation)}
        </td>

        {/* Expand arrow */}
        <td className="py-3 pr-3 w-8 text-center">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-400 inline" />
            : <ChevronDown className="w-4 h-4 text-slate-400 inline opacity-0 group-hover:opacity-100 transition-opacity" />
          }
        </td>
      </tr>

      {/* ── Expanded Detail Row ── */}
      {expanded && (
        <tr className="border-b border-surface-200 bg-surface-50/50">
          <td colSpan={100} className="px-4 py-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px]">
              <div><span className="text-slate-400">AUM:</span> <span className="font-semibold text-primary-700">{formatAUMShort(fund.aumCr)}</span></div>
              <div><span className="text-slate-400">TER:</span> <span className={cn('font-semibold', fund.ter === lowestTER && lowestTER > 0 ? 'text-positive' : 'text-primary-700')}>{formatTER(fund.ter)}</span></div>
              <div><span className="text-slate-400">Sharpe:</span> <span className={cn('font-semibold', fund.sharpeRatio === bestSharpe && bestSharpe > 0 ? 'text-positive' : 'text-primary-700')}>{formatSharpe(fund.sharpeRatio)}</span></div>
              <div><span className="text-slate-400">Std Dev:</span> <span className={cn('font-semibold', fund.standardDeviation === lowestSD && lowestSD > 0 ? 'text-positive' : 'text-primary-700')}>{formatStdDev(fund.standardDeviation)}</span></div>
              <div><span className="text-slate-400">Fund Age:</span> <span className="font-semibold text-primary-700">{fund.ageOfFund.toFixed(1)} yrs</span></div>
              <div><span className="text-slate-400">Holdings:</span> <span className="font-semibold text-primary-700">{fund.numberOfHoldings}</span></div>
              {category.hasSkinInTheGame && fund.skinInTheGame && (
                <>
                  <div><span className="text-slate-400">Skin in Game:</span> <span className="font-semibold text-primary-700">₹{fund.skinInTheGame.amountCr.toFixed(2)} Cr</span></div>
                  <div><span className="text-slate-400">% of AUM:</span> <span className="font-semibold text-primary-700">{formatSkinPercent(fund.skinInTheGame.percentOfAum)}</span></div>
                </>
              )}
              {category.hasSkinInTheGame && !fund.skinInTheGame && (
                <div className="text-slate-400 italic">Skin in the Game: Not available</div>
              )}
              {/* Show all returns on mobile in expanded view */}
              <div className="w-full flex flex-wrap gap-x-5 gap-y-1 sm:hidden mt-1 pt-2 border-t border-surface-200">
                <div><span className="text-slate-400">MTD:</span> <ReturnCell value={navData?.returns.oneMonth ?? fund.returns.mtd} /></div>
                <div><span className="text-slate-400">YTD:</span> <ReturnCell value={navData?.returns.ytd ?? fund.returns.ytd} /></div>
                <div><span className="text-slate-400">3M:</span> <ReturnCell value={navData?.returns.threeMonth ?? fund.returns.threeMonth ?? 0} /></div>
                <div><span className="text-slate-400">6M:</span> <ReturnCell value={navData?.returns.sixMonth ?? fund.returns.sixMonth ?? 0} /></div>
                <div><span className="text-slate-400">2Y:</span> <ReturnCell value={fund.returns.twoYear} /></div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Category Table ───
export function TrustnerCategoryTable({
  category,
  compareMode = false,
  selectedFunds = [],
  onToggleCompare,
  navMap,
}: {
  category: TrustnerFundCategory;
  compareMode?: boolean;
  selectedFunds?: string[];
  onToggleCompare?: (fund: TrustnerCuratedFund) => void;
  navMap?: Map<number, FundNavData>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const sortedFunds = getSortedFunds(category.funds, sortKey);

  const bestSharpe = getBestInColumn(sortedFunds, (f) => f.sharpeRatio);
  const lowestTER = getLowestInColumn(sortedFunds, (f) => f.ter);
  const lowestSD = getLowestInColumn(sortedFunds, (f) => f.standardDeviation);
  const best1Y = getBestInColumn(sortedFunds, (f) => f.returns.oneYear);
  const best3Y = getBestInColumn(sortedFunds, (f) => f.returns.threeYear);
  const best5Y = getBestInColumn(sortedFunds, (f) => f.returns.fiveYear);

  return (
    <div className="p-4 sm:p-5">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide print:hidden">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={cn(
              'flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all',
              sortKey === opt.key
                ? 'bg-brand text-white'
                : 'bg-surface-100 text-slate-500 hover:bg-surface-200'
            )}
          >
            {opt.shortLabel}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:-mx-5">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="border-b-2 border-surface-300 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              {compareMode && <th className="pl-3 pr-1 py-2 w-8"></th>}
              <th className={cn('py-2 w-14 text-center', !compareMode && 'pl-3')}>#</th>
              <th className="py-2 pr-3">Fund Name</th>
              <th className="py-2 px-2 text-center hidden sm:table-cell">MTD</th>
              <th className="py-2 px-2 text-center hidden sm:table-cell">YTD</th>
              <th className="py-2 px-2 text-center hidden md:table-cell">3M</th>
              <th className="py-2 px-2 text-center hidden md:table-cell">6M</th>
              <th className="py-2 px-2 text-center">1Y</th>
              <th className="py-2 px-2 text-center hidden md:table-cell">2Y</th>
              <th className="py-2 px-2 text-center">3Y</th>
              <th className="py-2 px-2 text-center">5Y</th>
              <th className="py-2 px-2 text-right hidden lg:table-cell">AUM</th>
              <th className="py-2 px-2 text-right hidden lg:table-cell">TER</th>
              <th className="py-2 px-2 text-right hidden xl:table-cell">Sharpe</th>
              <th className="py-2 px-2 text-right hidden xl:table-cell">Std Dev</th>
              <th className="py-2 pr-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sortedFunds.map((fund) => (
              <FundRow
                key={fund.id}
                fund={fund}
                category={category}
                bestSharpe={bestSharpe}
                lowestTER={lowestTER}
                lowestSD={lowestSD}
                best1Y={best1Y}
                best3Y={best3Y}
                best5Y={best5Y}
                compareMode={compareMode}
                isSelected={selectedFunds.includes(fund.id)}
                onToggleCompare={onToggleCompare || (() => {})}
                navData={fund.schemeCode ? navMap?.get(fund.schemeCode) : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
