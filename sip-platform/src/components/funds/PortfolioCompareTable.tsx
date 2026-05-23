'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, X, Star, Award, Shield, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatINR } from '@/lib/utils/formatters';
import type { TrustnerCuratedFund } from '@/types/funds';

interface PortfolioCompareTableProps {
  funds: TrustnerCuratedFund[];        // funds in current portfolio
  onClose?: () => void;
}

type SortKey =
  | 'name' | 'mtd' | 'ytd' | '3m' | '6m' | '1y' | '2y' | '3y' | '5y'
  | 'aum' | 'ter' | 'sharpe' | 'sd' | 'age' | 'holdings';
type SortDir = 'asc' | 'desc';

// Returns are already decimals — multiply by 100 only at display time
function ReturnCell({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined || value === 0) {
    return <span className="text-slate-300 text-xs">—</span>;
  }
  const pct = value * 100;
  const isPos = pct >= 0;
  return (
    <span className={cn('font-semibold tabular-nums text-xs', isPos ? 'text-emerald-700' : 'text-red-600')}>
      {isPos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

function valOrZero(v: number | null | undefined): number {
  return v ?? 0;
}

function bestOf(funds: TrustnerCuratedFund[], pick: (f: TrustnerCuratedFund) => number, mode: 'high' | 'low' = 'high'): number {
  const vals = funds.map(pick).filter((v) => v !== 0);
  if (vals.length === 0) return 0;
  return mode === 'high' ? Math.max(...vals) : Math.min(...vals);
}

export function PortfolioCompareTable({ funds, onClose }: PortfolioCompareTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('3y');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sortedFunds = useMemo(() => {
    const m = sortDir === 'asc' ? 1 : -1;
    const sorted = [...funds];
    const key = sortKey;
    sorted.sort((a, b) => {
      switch (key) {
        case 'name':     return a.name.localeCompare(b.name) * m;
        case 'mtd':      return (valOrZero(b.returns.mtd) - valOrZero(a.returns.mtd)) * m;
        case 'ytd':      return (valOrZero(b.returns.ytd) - valOrZero(a.returns.ytd)) * m;
        case '3m':       return (valOrZero(b.returns.threeMonth) - valOrZero(a.returns.threeMonth)) * m;
        case '6m':       return (valOrZero(b.returns.sixMonth) - valOrZero(a.returns.sixMonth)) * m;
        case '1y':       return (b.returns.oneYear - a.returns.oneYear) * m;
        case '2y':       return (valOrZero(b.returns.twoYear) - valOrZero(a.returns.twoYear)) * m;
        case '3y':       return (b.returns.threeYear - a.returns.threeYear) * m;
        case '5y':       return (b.returns.fiveYear - a.returns.fiveYear) * m;
        case 'aum':      return (b.aumCr - a.aumCr) * m;
        case 'ter':      return (a.ter - b.ter) * m;            // lower is better → asc default
        case 'sharpe':   return (b.sharpeRatio - a.sharpeRatio) * m;
        case 'sd':       return (a.standardDeviation - b.standardDeviation) * m;
        case 'age':      return (b.ageOfFund - a.ageOfFund) * m;
        case 'holdings': return (b.numberOfHoldings - a.numberOfHoldings) * m;
        default:         return 0;
      }
    });
    return sorted;
  }, [funds, sortKey, sortDir]);

  const handleSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(k);
      setSortDir(k === 'name' || k === 'ter' || k === 'sd' ? 'asc' : 'desc');
    }
  };

  // Best-in-column markers for highlighting
  const best = useMemo(() => ({
    oneY: bestOf(funds, (f) => f.returns.oneYear),
    threeY: bestOf(funds, (f) => f.returns.threeYear),
    fiveY: bestOf(funds, (f) => f.returns.fiveYear),
    sharpe: bestOf(funds, (f) => f.sharpeRatio),
    lowTER: bestOf(funds, (f) => f.ter, 'low'),
    lowSD: bestOf(funds, (f) => f.standardDeviation, 'low'),
    aum: bestOf(funds, (f) => f.aumCr),
  }), [funds]);

  // Aggregate "leadership badges" — which fund leads each metric?
  const leaders = useMemo(() => {
    const map: Record<string, string[]> = {}; // fundId -> badge strings
    for (const f of funds) {
      const badges: string[] = [];
      if (f.returns.oneYear === best.oneY && best.oneY > 0) badges.push('Top 1Y');
      if (f.returns.threeYear === best.threeY && best.threeY > 0) badges.push('Top 3Y');
      if (f.returns.fiveYear === best.fiveY && best.fiveY > 0) badges.push('Top 5Y');
      if (f.sharpeRatio === best.sharpe && best.sharpe > 0) badges.push('Best Sharpe');
      if (f.ter === best.lowTER && best.lowTER > 0) badges.push('Lowest TER');
      if (f.standardDeviation === best.lowSD && best.lowSD > 0) badges.push('Lowest Vol');
      if (f.aumCr === best.aum) badges.push('Largest AUM');
      if (badges.length > 0) map[f.id] = badges;
    }
    return map;
  }, [funds, best]);

  if (funds.length === 0) return null;

  return (
    <div className="card-base overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-bold text-primary-700">
            Side-by-Side Comparison ({funds.length} fund{funds.length === 1 ? '' : 's'})
          </h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Leadership chips */}
      {Object.keys(leaders).length > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-b border-surface-200">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Category Leaders
          </div>
          <div className="space-y-1.5">
            {Object.entries(leaders).map(([fundId, badges]) => {
              const f = funds.find((x) => x.id === fundId);
              if (!f) return null;
              return (
                <div key={fundId} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-primary-700 truncate max-w-[40%]">{f.name}:</span>
                  <div className="flex flex-wrap gap-1">
                    {badges.map((b) => (
                      <span key={b} className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                        <Star className="w-2.5 h-2.5 fill-current" /> {b}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1100px]">
          <thead>
            <tr className="border-b-2 border-surface-300 text-[10px] uppercase tracking-wider text-slate-400 font-semibold bg-slate-50">
              <th className="py-2.5 pl-4 pr-3 cursor-pointer hover:text-slate-600" onClick={() => handleSort('name')}>
                Fund Name {sortKey === 'name' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('mtd')}>
                MTD {sortKey === 'mtd' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('ytd')}>
                YTD {sortKey === 'ytd' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600 hidden md:table-cell" onClick={() => handleSort('3m')}>
                3M {sortKey === '3m' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600 hidden md:table-cell" onClick={() => handleSort('6m')}>
                6M {sortKey === '6m' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('1y')}>
                1Y {sortKey === '1y' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600 hidden md:table-cell" onClick={() => handleSort('2y')}>
                2Y {sortKey === '2y' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('3y')}>
                3Y {sortKey === '3y' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('5y')}>
                5Y {sortKey === '5y' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600 hidden lg:table-cell" onClick={() => handleSort('aum')}>
                AUM (Cr) {sortKey === 'aum' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600 hidden lg:table-cell" onClick={() => handleSort('ter')}>
                TER {sortKey === 'ter' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600 hidden xl:table-cell" onClick={() => handleSort('sharpe')}>
                Sharpe {sortKey === 'sharpe' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="py-2.5 px-2 text-right cursor-pointer hover:text-slate-600 hidden xl:table-cell" onClick={() => handleSort('sd')}>
                Std Dev {sortKey === 'sd' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFunds.map((fund) => (
              <tr key={fund.id} className="border-b border-surface-200 hover:bg-brand-50/30 transition-colors">
                <td className="py-2.5 pl-4 pr-3">
                  <div className="font-semibold text-sm text-primary-700 truncate max-w-[260px]" title={fund.name}>
                    {fund.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                      {fund.category}
                    </span>
                    <span className="text-[10px] text-slate-500">{fund.fundManager}</span>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right"><ReturnCell value={fund.returns.mtd} /></td>
                <td className="py-2.5 px-2 text-right"><ReturnCell value={fund.returns.ytd} /></td>
                <td className="py-2.5 px-2 text-right hidden md:table-cell"><ReturnCell value={fund.returns.threeMonth ?? null} /></td>
                <td className="py-2.5 px-2 text-right hidden md:table-cell"><ReturnCell value={fund.returns.sixMonth ?? null} /></td>
                <td className={cn(
                  'py-2.5 px-2 text-right',
                  fund.returns.oneYear === best.oneY && best.oneY > 0 && 'bg-emerald-50/60'
                )}>
                  <ReturnCell value={fund.returns.oneYear} />
                </td>
                <td className="py-2.5 px-2 text-right hidden md:table-cell"><ReturnCell value={fund.returns.twoYear} /></td>
                <td className={cn(
                  'py-2.5 px-2 text-right',
                  fund.returns.threeYear === best.threeY && best.threeY > 0 && 'bg-emerald-50/60'
                )}>
                  <ReturnCell value={fund.returns.threeYear} />
                </td>
                <td className={cn(
                  'py-2.5 px-2 text-right',
                  fund.returns.fiveYear === best.fiveY && best.fiveY > 0 && 'bg-emerald-50/60'
                )}>
                  <ReturnCell value={fund.returns.fiveYear} />
                </td>
                <td className={cn(
                  'py-2.5 px-2 text-right hidden lg:table-cell text-xs tabular-nums text-slate-600',
                  fund.aumCr === best.aum && 'bg-blue-50/60 font-semibold'
                )}>
                  ₹{fund.aumCr.toLocaleString('en-IN')}
                </td>
                <td className={cn(
                  'py-2.5 px-2 text-right hidden lg:table-cell text-xs tabular-nums text-slate-600',
                  fund.ter === best.lowTER && best.lowTER > 0 && 'bg-emerald-50/60 font-semibold'
                )}>
                  {(fund.ter * 100).toFixed(2)}%
                </td>
                <td className={cn(
                  'py-2.5 px-2 text-right hidden xl:table-cell text-xs tabular-nums text-slate-600',
                  fund.sharpeRatio === best.sharpe && best.sharpe > 0 && 'bg-emerald-50/60 font-semibold'
                )}>
                  {fund.sharpeRatio.toFixed(2)}
                </td>
                <td className={cn(
                  'py-2.5 px-2 text-right hidden xl:table-cell text-xs tabular-nums text-slate-600',
                  fund.standardDeviation === best.lowSD && best.lowSD > 0 && 'bg-emerald-50/60 font-semibold'
                )}>
                  {(fund.standardDeviation * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Extras row — Fund Manager / Age / Holdings / Skin in Game */}
      <div className="border-t border-surface-200 px-5 py-4 bg-slate-50/50">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Additional Decision Metrics
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[800px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-b border-surface-200">
                <th className="py-2 text-left pl-1">Fund</th>
                <th className="py-2 text-right">Age (yrs)</th>
                <th className="py-2 text-right">Holdings</th>
                <th className="py-2 text-right">Skin in Game</th>
                <th className="py-2 text-right">Manager</th>
              </tr>
            </thead>
            <tbody>
              {sortedFunds.map((fund) => (
                <tr key={fund.id} className="border-b border-surface-200/60">
                  <td className="py-2 pl-1 truncate max-w-[260px] text-primary-700 font-semibold">{fund.name}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">{fund.ageOfFund.toFixed(1)}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">{fund.numberOfHoldings}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600">
                    {fund.skinInTheGame
                      ? `${formatINR(fund.skinInTheGame.amountCr * 10000000)} (${(fund.skinInTheGame.percentOfAum * 100).toFixed(2)}%)`
                      : '—'}
                  </td>
                  <td className="py-2 text-right text-slate-500 truncate max-w-[180px]">{fund.fundManager}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-surface-200">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong>Reading the comparison:</strong> Returns up to 1 year are absolute; 2Y onwards are CAGR.
          Best-in-portfolio cells are highlighted in green. Skin in the Game shows the AMC&rsquo;s own
          investment in the fund — higher % indicates stronger alignment with investors.
          TER (Total Expense Ratio) lower is better; Sharpe Ratio higher is better; Std Dev lower means
          less volatile. Past performance does not guarantee future returns.
        </p>
      </div>
    </div>
  );
}
