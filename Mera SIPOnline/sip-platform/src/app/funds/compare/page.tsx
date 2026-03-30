'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Star, TrendingUp, Shield, Layers, CheckCircle2,
  XCircle, BarChart3, IndianRupee, Search, X, Plus, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getFundById, getAllFunds, calculateHoldingsOverlap } from '@/data/funds';
import { DISCLAIMER } from '@/lib/constants/company';
import { useFundDetail } from '@/lib/hooks/useFundDetail';
import { LiveFundCompareTable } from '@/components/funds/LiveFundCompareTable';
import { ReturnsBarChart } from '@/components/funds/ReturnsBarChart';
import { CompareSearchModal } from '@/components/funds/CompareSearchModal';
import type { MutualFund } from '@/types/funds';
import type { LiveFundDetail } from '@/types/live-fund';

// ─── Constants ───

const RISK_COLORS: Record<string, string> = {
  'Low': 'bg-green-50 text-green-700 border-green-200',
  'Moderate': 'bg-brand-50 text-brand-700 border-brand-200',
  'Moderately High': 'bg-amber-50 text-amber-700 border-amber-200',
  'High': 'bg-orange-50 text-orange-700 border-orange-200',
  'Very High': 'bg-red-50 text-red-700 border-red-200',
};

type CompareTab = 'curated' | 'live';

// ─── Shared Helpers ───

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
          )}
        />
      ))}
    </div>
  );
}

function formatAUM(aum: number): string {
  if (aum >= 1000) return `${(aum / 1000).toFixed(1)}K Cr`;
  return `${aum.toLocaleString('en-IN')} Cr`;
}

function getBestIndex(values: (number | undefined)[], mode: 'highest' | 'lowest'): number {
  let bestIdx = -1;
  let bestVal = mode === 'highest' ? -Infinity : Infinity;
  values.forEach((v, i) => {
    if (v === undefined) return;
    if (mode === 'highest' && v > bestVal) { bestVal = v; bestIdx = i; }
    if (mode === 'lowest' && v < bestVal) { bestVal = v; bestIdx = i; }
  });
  return bestIdx;
}

// ─── Curated Fund Selector ───

function FundSelector({ onSelect }: { onSelect: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const allFunds = useMemo(() => getAllFunds(), []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allFunds;
    const q = searchQuery.toLowerCase();
    return allFunds.filter(
      f => f.name.toLowerCase().includes(q)
        || f.shortName.toLowerCase().includes(q)
        || f.amcName.toLowerCase().includes(q)
        || f.category.toLowerCase().includes(q)
    );
  }, [allFunds, searchQuery]);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  };

  return (
    <section className="section-padding bg-surface-100">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-8">
          <Layers className="w-12 h-12 mx-auto mb-4 text-brand" />
          <h2 className="text-2xl font-extrabold text-primary-700 mb-2">Select Funds to Compare</h2>
          <p className="text-sm text-slate-500">Choose 2 or 3 funds to compare side-by-side</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by fund name, AMC, or category..."
            className="w-full bg-white border border-surface-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-primary-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
          />
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.map(id => {
              const fund = getFundById(id);
              return fund ? (
                <span key={id} className="inline-flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {fund.shortName}
                  <button onClick={() => toggle(id)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* Fund list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto rounded-xl border border-surface-300/70 bg-white">
          {filtered.map(fund => {
            const isSelected = selected.includes(fund.id);
            return (
              <button
                key={fund.id}
                onClick={() => toggle(fund.id)}
                disabled={!isSelected && selected.length >= 3}
                className={cn(
                  'w-full flex items-center gap-3 p-3 text-left transition-all hover:bg-surface-50 border-b border-surface-200 last:border-b-0',
                  isSelected && 'bg-brand-50/50',
                  !isSelected && selected.length >= 3 && 'opacity-40 cursor-not-allowed'
                )}
              >
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                  isSelected
                    ? 'bg-brand border-brand'
                    : 'border-slate-300'
                )}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-primary-700">{fund.shortName}</div>
                  <div className="text-[11px] text-slate-400">{fund.amcName} | {fund.category}</div>
                </div>
                <div className="text-xs font-semibold text-positive shrink-0">
                  {fund.returns.threeYear.toFixed(1)}% (3Y)
                </div>
              </button>
            );
          })}
        </div>

        {/* Compare button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => selected.length >= 2 && onSelect(selected)}
            disabled={selected.length < 2}
            className={cn(
              'btn-primary inline-flex items-center gap-2',
              selected.length < 2 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Layers className="w-4 h-4" />
            Compare {selected.length} Fund{selected.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Curated Comparison View (unchanged) ───

function ComparisonView({ funds }: { funds: MutualFund[] }) {
  const holdingsAnalysis = useMemo(() => {
    const allHoldings = funds.map(f => new Set(f.holdings));
    const allNames = new Set(funds.flatMap(f => f.holdings));

    const common: string[] = [];
    const unique: Map<number, string[]> = new Map();

    funds.forEach((_, i) => unique.set(i, []));

    allNames.forEach(h => {
      const inAll = allHoldings.every(set => set.has(h));
      if (inAll) {
        common.push(h);
      } else {
        allHoldings.forEach((set, i) => {
          if (set.has(h)) {
            const isUnique = allHoldings.every((other, j) => j === i || !other.has(h));
            if (isUnique) unique.get(i)!.push(h);
          }
        });
      }
    });

    return { common, unique };
  }, [funds]);

  const overlapPercentages = useMemo(() => {
    if (funds.length < 2) return [];
    const overlaps: { label: string; value: number }[] = [];
    for (let i = 0; i < funds.length; i++) {
      for (let j = i + 1; j < funds.length; j++) {
        overlaps.push({
          label: `${funds[i].shortName} vs ${funds[j].shortName}`,
          value: calculateHoldingsOverlap(funds[i], funds[j]),
        });
      }
    }
    return overlaps;
  }, [funds]);

  const returns1Y = funds.map(f => f.returns.oneYear);
  const returns3Y = funds.map(f => f.returns.threeYear);
  const returns5Y = funds.map(f => f.returns.fiveYear);
  const returns10Y = funds.map(f => f.returns.tenYear);
  const expenseRatios = funds.map(f => f.expenseRatio);
  const aums = funds.map(f => f.aum);

  const best1Y = getBestIndex(returns1Y, 'highest');
  const best3Y = getBestIndex(returns3Y, 'highest');
  const best5Y = getBestIndex(returns5Y, 'highest');
  const best10Y = getBestIndex(returns10Y, 'highest');
  const bestExpense = getBestIndex(expenseRatios, 'lowest');
  const bestAUM = getBestIndex(aums, 'highest');

  const colCount = funds.length;

  return (
    <>
      {/* Comparison Table */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="overflow-x-auto rounded-xl border border-surface-300/70">
            <table className="w-full text-sm">
              {/* Fund Headers */}
              <thead>
                <tr className="bg-surface-100 border-b border-surface-300/70">
                  <th className="text-left p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-40">
                    Parameter
                  </th>
                  {funds.map(fund => (
                    <th key={fund.id} className="text-center p-4 min-w-[180px]">
                      <div className="font-bold text-primary-700 text-base mb-0.5">{fund.shortName}</div>
                      <div className="text-[11px] text-slate-400">{fund.amcName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Category */}
                <tr className="border-b border-surface-200">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Category</td>
                  {funds.map(fund => (
                    <td key={fund.id} className="p-3 text-center">
                      <span className={cn(
                        'text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider',
                        RISK_COLORS[fund.riskLevel] || 'bg-slate-50 text-slate-600 border-slate-200'
                      )}>
                        {fund.category}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* AUM */}
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">AUM</td>
                  {funds.map((fund, i) => (
                    <td key={fund.id} className={cn(
                      'p-3 text-center font-semibold',
                      i === bestAUM ? 'text-positive' : 'text-primary-700'
                    )}>
                      <IndianRupee className="w-3 h-3 inline -mt-0.5" />{formatAUM(fund.aum)}
                    </td>
                  ))}
                </tr>

                {/* NAV */}
                <tr className="border-b border-surface-200">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">NAV</td>
                  {funds.map(fund => (
                    <td key={fund.id} className="p-3 text-center text-primary-700 font-semibold">
                      <IndianRupee className="w-3 h-3 inline -mt-0.5" />{fund.nav.toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* Expense Ratio */}
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Expense Ratio</td>
                  {funds.map((fund, i) => (
                    <td key={fund.id} className={cn(
                      'p-3 text-center font-semibold',
                      i === bestExpense ? 'text-positive' : 'text-primary-700'
                    )}>
                      {fund.expenseRatio.toFixed(2)}%
                      {i === bestExpense && (
                        <span className="ml-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                          Lowest
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Risk Level */}
                <tr className="border-b border-surface-200">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Risk Level</td>
                  {funds.map(fund => (
                    <td key={fund.id} className="p-3 text-center">
                      <span className={cn(
                        'text-[10px] font-semibold px-2.5 py-1 rounded-full border',
                        RISK_COLORS[fund.riskLevel] || 'bg-slate-50 text-slate-600 border-slate-200'
                      )}>
                        {fund.riskLevel}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Rating</td>
                  {funds.map(fund => (
                    <td key={fund.id} className="p-3">
                      <div className="flex justify-center">
                        <StarRating rating={fund.rating} />
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Returns Section Header */}
                <tr className="bg-brand-50/50">
                  <td colSpan={colCount + 1} className="p-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-brand" />
                      <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Returns (CAGR)</span>
                    </div>
                  </td>
                </tr>

                {/* 1Y Returns */}
                <tr className="border-b border-surface-200">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider pl-8">1 Year</td>
                  {funds.map((fund, i) => (
                    <td key={fund.id} className={cn(
                      'p-3 text-center font-bold text-base',
                      i === best1Y ? 'text-positive' : 'text-primary-700'
                    )}>
                      {fund.returns.oneYear.toFixed(1)}%
                      {i === best1Y && (
                        <span className="ml-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                          Best
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 3Y Returns */}
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider pl-8">3 Year</td>
                  {funds.map((fund, i) => (
                    <td key={fund.id} className={cn(
                      'p-3 text-center font-bold text-base',
                      i === best3Y ? 'text-positive' : 'text-primary-700'
                    )}>
                      {fund.returns.threeYear.toFixed(1)}%
                      {i === best3Y && (
                        <span className="ml-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                          Best
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 5Y Returns */}
                <tr className="border-b border-surface-200">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider pl-8">5 Year</td>
                  {funds.map((fund, i) => (
                    <td key={fund.id} className={cn(
                      'p-3 text-center font-bold text-base',
                      i === best5Y ? 'text-positive' : 'text-primary-700'
                    )}>
                      {fund.returns.fiveYear.toFixed(1)}%
                      {i === best5Y && (
                        <span className="ml-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                          Best
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 10Y Returns */}
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider pl-8">10 Year</td>
                  {funds.map((fund, i) => (
                    <td key={fund.id} className={cn(
                      'p-3 text-center font-bold text-base',
                      i === best10Y ? 'text-positive' : 'text-primary-700'
                    )}>
                      {fund.returns.tenYear !== undefined ? (
                        <>
                          {fund.returns.tenYear.toFixed(1)}%
                          {i === best10Y && (
                            <span className="ml-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                              Best
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-300">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Since Inception */}
                <tr className="border-b border-surface-200">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider pl-8">Since Inception</td>
                  {funds.map(fund => (
                    <td key={fund.id} className="p-3 text-center font-semibold text-primary-700">
                      {fund.returns.sinceInception.toFixed(1)}%
                    </td>
                  ))}
                </tr>

                {/* Investment Details Header */}
                <tr className="bg-brand-50/50">
                  <td colSpan={colCount + 1} className="p-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-brand" />
                      <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">Investment Details</span>
                    </div>
                  </td>
                </tr>

                {/* Exit Load */}
                <tr className="border-b border-surface-200">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Exit Load</td>
                  {funds.map(fund => (
                    <td key={fund.id} className="p-3 text-center text-slate-600 text-xs">
                      {fund.exitLoad}
                    </td>
                  ))}
                </tr>

                {/* Min SIP */}
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Min SIP</td>
                  {funds.map(fund => (
                    <td key={fund.id} className="p-3 text-center text-primary-700 font-semibold">
                      <IndianRupee className="w-3 h-3 inline -mt-0.5" />{fund.minSIP.toLocaleString('en-IN')}
                    </td>
                  ))}
                </tr>

                {/* Min Lumpsum */}
                <tr className="border-b border-surface-200">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Min Lumpsum</td>
                  {funds.map(fund => (
                    <td key={fund.id} className="p-3 text-center text-primary-700 font-semibold">
                      <IndianRupee className="w-3 h-3 inline -mt-0.5" />{fund.minLumpsum.toLocaleString('en-IN')}
                    </td>
                  ))}
                </tr>

                {/* Benchmark */}
                <tr className="border-b border-surface-200 bg-surface-50/50">
                  <td className="p-3 text-slate-500 font-medium text-xs uppercase tracking-wider">Benchmark</td>
                  {funds.map(fund => (
                    <td key={fund.id} className="p-3 text-center text-slate-600 text-xs">
                      {fund.benchmark}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Holdings Overlap */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-5 h-5 text-brand" />
            <h2 className="text-display-sm text-primary-700">Holdings Analysis</h2>
          </div>

          {/* Overlap percentages */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {overlapPercentages.map(({ label, value }) => (
              <div key={label} className="card-base p-5">
                <div className="text-xs text-slate-500 mb-2 font-medium">{label}</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-surface-200 rounded-full h-2.5">
                    <div
                      className={cn(
                        'h-2.5 rounded-full transition-all',
                        value > 50 ? 'bg-amber-500' : value > 25 ? 'bg-brand' : 'bg-positive'
                      )}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className={cn(
                    'text-lg font-bold',
                    value > 50 ? 'text-amber-600' : value > 25 ? 'text-brand' : 'text-positive'
                  )}>
                    {value}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {value > 50
                    ? 'High overlap - limited diversification benefit'
                    : value > 25
                      ? 'Moderate overlap - some diversification'
                      : 'Low overlap - good diversification'}
                </p>
              </div>
            ))}
          </div>

          {/* Common & Unique Holdings */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Common Holdings */}
            <div className="card-base p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-positive" />
                <h3 className="font-bold text-primary-700">Common Holdings</h3>
                <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                  {holdingsAnalysis.common.length} stocks
                </span>
              </div>
              {holdingsAnalysis.common.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {holdingsAnalysis.common.map(h => (
                    <span key={h} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                      {h}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No common holdings found across all selected funds.</p>
              )}
            </div>

            {/* Unique Holdings per fund */}
            <div className="space-y-4">
              {funds.map((fund, i) => {
                const uniqueHoldings = holdingsAnalysis.unique.get(i) || [];
                return (
                  <div key={fund.id} className="card-base p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="w-4 h-4 text-brand" />
                      <h3 className="font-bold text-primary-700 text-sm">
                        Unique to {fund.shortName}
                      </h3>
                      <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                        {uniqueHoldings.length} stocks
                      </span>
                    </div>
                    {uniqueHoldings.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {uniqueHoldings.map(h => (
                          <span key={h} className="text-xs bg-surface-100 text-slate-600 border border-surface-300 px-2 py-0.5 rounded-full">
                            {h}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">All holdings overlap with other selected funds.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Live Compare: Individual Fund Fetcher ───

function useLiveFunds(codes: number[]) {
  const f0 = useFundDetail(codes[0] ?? null);
  const f1 = useFundDetail(codes[1] ?? null);
  const f2 = useFundDetail(codes[2] ?? null);
  const f3 = useFundDetail(codes[3] ?? null);

  const results = [f0, f1, f2, f3].slice(0, codes.length);

  const funds: LiveFundDetail[] = results
    .map((r) => r.fund)
    .filter((f): f is LiveFundDetail => f !== null);

  const loading = results.some((r) => r.loading);
  const errors = results
    .map((r, i) => (r.error ? { code: codes[i], error: r.error } : null))
    .filter(Boolean);

  return { funds, loading, errors };
}

// ─── Live Compare Section ───

function LiveCompareSection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [codes, setCodes] = useState<number[]>(() => {
    const codesParam = searchParams.get('codes');
    if (!codesParam) return [];
    return codesParam
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)
      .slice(0, 4);
  });
  const [modalOpen, setModalOpen] = useState(false);

  const { funds, loading, errors } = useLiveFunds(codes);

  const handleAddFund = useCallback(
    (schemeCode: number) => {
      setCodes((prev) => {
        if (prev.includes(schemeCode) || prev.length >= 4) return prev;
        const next = [...prev, schemeCode];
        // Update URL params
        const params = new URLSearchParams(searchParams.toString());
        params.set('codes', next.join(','));
        router.replace(`/funds/compare?${params.toString()}`, { scroll: false });
        return next;
      });
    },
    [searchParams, router]
  );

  const handleRemoveFund = useCallback(
    (schemeCode: number) => {
      setCodes((prev) => {
        const next = prev.filter((c) => c !== schemeCode);
        const params = new URLSearchParams(searchParams.toString());
        if (next.length > 0) {
          params.set('codes', next.join(','));
        } else {
          params.delete('codes');
        }
        router.replace(`/funds/compare?${params.toString()}`, { scroll: false });
        return next;
      });
    },
    [searchParams, router]
  );

  return (
    <section className="section-padding bg-surface-100">
      <div className="container-custom">
        {/* Header & Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-extrabold text-gray-900">Live Fund Comparison</h2>
            </div>
            <p className="text-sm text-gray-500">
              Compare up to 4 mutual funds with real-time data from AMFI & Kuvera.
            </p>
          </div>
          {codes.length < 4 && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Fund ({codes.length}/4)
            </button>
          )}
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="mb-4 space-y-2">
            {errors.map((err) =>
              err ? (
                <div
                  key={err.code}
                  className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2"
                >
                  Failed to load fund {err.code}: {err.error}
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {codes.map((code) => (
              <div
                key={code}
                className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
              >
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-6 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {codes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">No funds selected yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Add at least 2 mutual funds to compare their returns, expense ratios, ratings, and
              more side-by-side.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Fund
            </button>
          </div>
        )}

        {/* Need more funds message */}
        {codes.length === 1 && !loading && funds.length === 1 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3 mb-6">
            Add at least one more fund to start comparing. You currently have 1 fund selected.
          </div>
        )}

        {/* Comparison Table - shown when 2+ funds loaded */}
        {funds.length >= 2 && (
          <div className="space-y-6">
            <LiveFundCompareTable funds={funds} onRemove={handleRemoveFund} />
            <ReturnsBarChart funds={funds} />
          </div>
        )}

        {/* Single fund preview (when only 1 loaded) */}
        {funds.length === 1 && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{funds[0].schemeName}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{funds[0].fundHouse}</p>
                <p className="text-xs text-gray-400 mt-1">
                  NAV: {'\u20B9'}{funds[0].currentNav.toFixed(2)} as on {funds[0].navDate}
                </p>
              </div>
              <button
                onClick={() => handleRemoveFund(funds[0].schemeCode)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Search Modal */}
        <CompareSearchModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSelect={(schemeCode) => handleAddFund(schemeCode)}
          currentCount={codes.length}
        />
      </div>
    </section>
  );
}

// ─── Main Inner Component with Tab Toggle ───

function ComparePageInner() {
  const searchParams = useSearchParams();
  const fundsParam = searchParams.get('funds');
  const codesParam = searchParams.get('codes');

  // Auto-select tab based on URL params
  const [activeTab, setActiveTab] = useState<CompareTab>(
    codesParam ? 'live' : 'curated'
  );

  const [manualFunds, setManualFunds] = useState<MutualFund[] | null>(null);

  const fundsFromUrl = useMemo(() => {
    if (!fundsParam) return null;
    const ids = fundsParam.split(',').filter(Boolean);
    const resolved = ids.map(id => getFundById(id)).filter(Boolean) as MutualFund[];
    return resolved.length >= 2 ? resolved : null;
  }, [fundsParam]);

  const curatedFunds = manualFunds || fundsFromUrl;

  const handleManualSelect = (ids: string[]) => {
    const resolved = ids.map(id => getFundById(id)).filter(Boolean) as MutualFund[];
    if (resolved.length >= 2) setManualFunds(resolved);
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-hero-pattern text-white py-12 lg:py-16">
        <div className="container-custom">
          <Link
            href="/funds"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fund Explorer
          </Link>
          <div className="max-w-3xl animate-in">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-4 backdrop-blur-sm">
              <Layers className="w-3.5 h-3.5 text-accent" />
              Fund Comparison Tool
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-3">
              Compare Mutual Funds{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-brand-200 to-accent">
                Side-by-Side
              </span>
            </h1>
            <p className="text-base text-slate-300 leading-relaxed">
              {activeTab === 'live'
                ? 'Search any Indian mutual fund and compare with real-time NAV, returns, and enriched data.'
                : curatedFunds
                  ? `Comparing ${curatedFunds.map(f => f.shortName).join(', ')} across returns, risk, fees, and portfolio overlap.`
                  : 'Select 2-3 mutual funds to compare their performance, holdings, and key metrics.'}
            </p>
          </div>
        </div>
      </section>

      {/* Tab Toggle */}
      <section className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container-custom">
          <div className="flex gap-1 py-2">
            <button
              onClick={() => setActiveTab('curated')}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                activeTab === 'curated'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Star className="w-4 h-4" />
              Curated Funds
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                activeTab === 'live'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Zap className="w-4 h-4" />
              Live Compare
            </button>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === 'curated' && (
        <>
          {curatedFunds ? (
            <ComparisonView funds={curatedFunds} />
          ) : (
            <FundSelector onSelect={handleManualSelect} />
          )}
        </>
      )}

      {activeTab === 'live' && <LiveCompareSection />}

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <div className="bg-white rounded-lg p-4 mb-3">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              <strong className="text-slate-600">Comparison Disclaimer:</strong> Fund data shown is illustrative and for educational purposes only. Actual fund performance, NAV, and portfolio holdings may vary. Always verify with official AMC sources before investing.
            </p>
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.mutual_fund} {DISCLAIMER.amfi} | {DISCLAIMER.sebi_investor}
          </p>
        </div>
      </section>
    </>
  );
}

/** Wrap in Suspense for useSearchParams */
export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-100">
        <div className="text-center">
          <BarChart3 className="w-10 h-10 text-brand mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-slate-500">Loading comparison...</p>
        </div>
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}
