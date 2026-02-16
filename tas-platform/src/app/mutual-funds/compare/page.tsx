'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { GitCompare, Search, X, TrendingUp, TrendingDown, Plus, ChevronRight, ArrowRight } from 'lucide-react';
import { MOCK_TOP_FUNDS } from '@/data/mock-funds';
import { formatPercent } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import SEBIDisclaimer from '@/components/compliance/SEBIDisclaimer';
import { REGULATORY } from '@/lib/constants/regulatory';
import type { MutualFund } from '@/types/fund';

const MAX_COMPARE = 4;

export default function CompareFundsPage() {
  const [selectedFunds, setSelectedFunds] = useState<MutualFund[]>([MOCK_TOP_FUNDS[0], MOCK_TOP_FUNDS[2]]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const availableFunds = useMemo(() => {
    const selectedCodes = new Set(selectedFunds.map(f => f.schemeCode));
    return MOCK_TOP_FUNDS.filter(f => {
      if (selectedCodes.has(f.schemeCode)) return false;
      if (!searchQuery) return true;
      return f.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.amcName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [selectedFunds, searchQuery]);

  const addFund = (fund: MutualFund) => {
    if (selectedFunds.length < MAX_COMPARE) {
      setSelectedFunds(prev => [...prev, fund]);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const removeFund = (code: number) => {
    setSelectedFunds(prev => prev.filter(f => f.schemeCode !== code));
  };

  const compareMetrics = useMemo(() => {
    if (selectedFunds.length === 0) return [];
    return [
      { label: 'AMC', values: selectedFunds.map(f => f.amcName), type: 'text' as const },
      { label: 'Category', values: selectedFunds.map(f => f.subCategory), type: 'text' as const },
      { label: 'NAV', values: selectedFunds.map(f => `₹${f.nav.toFixed(2)}`), type: 'text' as const },
      { label: '1Y Returns', values: selectedFunds.map(f => f.returns?.oneYear || 0), type: 'return' as const },
      { label: '3Y Returns', values: selectedFunds.map(f => f.returns?.threeYear || 0), type: 'return' as const },
      { label: '5Y Returns', values: selectedFunds.map(f => f.returns?.fiveYear || 0), type: 'return' as const },
      { label: 'Expense Ratio', values: selectedFunds.map(f => f.expenseRatio), type: 'expense' as const },
      { label: 'AUM', values: selectedFunds.map(f => `₹${((f.aum || 0) / 100).toFixed(0)} Cr`), type: 'text' as const },
      { label: 'Risk Level', values: selectedFunds.map(f => f.riskLevel || 'N/A'), type: 'text' as const },
      { label: 'Fund Manager', values: selectedFunds.map(f => f.fundManager || 'N/A'), type: 'text' as const },
      { label: 'Plan Type', values: selectedFunds.map(f => f.planType || 'N/A'), type: 'text' as const },
    ];
  }, [selectedFunds]);

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-10">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <ChevronRight size={14} />
            <Link href="/mutual-funds" className="transition hover:text-white">Mutual Funds</Link>
            <ChevronRight size={14} />
            <span className="text-white">Compare</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <GitCompare size={20} />
            </div>
            <h1 className="text-3xl font-extrabold lg:text-4xl">Compare Mutual Funds</h1>
          </div>
          <p className="text-gray-400">Select up to {MAX_COMPARE} funds for side-by-side comparison of returns, risk, and other key metrics.</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Fund Selector Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {selectedFunds.map((fund) => (
            <div key={fund.schemeCode} className="group relative rounded-xl border-2 border-primary-100 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-card-hover">
              <button
                onClick={() => removeFund(fund.schemeCode)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-negative-light opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} className="text-negative" />
              </button>
              <p className="mb-1 text-xs font-semibold text-primary-500">{fund.amcName}</p>
              <p className="pr-4 text-sm font-bold text-gray-900 line-clamp-2">
                {fund.schemeName.replace(/ - Direct Growth| - Direct Plan.*$/i, '')}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">NAV: ₹{fund.nav.toFixed(2)}</span>
                {fund.returns?.oneYear !== undefined && (
                  <span className={cn(
                    'text-xs font-bold',
                    fund.returns.oneYear >= 0 ? 'text-positive' : 'text-negative'
                  )}>
                    {fund.returns.oneYear >= 0 ? '+' : ''}{formatPercent(fund.returns.oneYear)} (1Y)
                  </span>
                )}
              </div>
            </div>
          ))}
          {selectedFunds.length < MAX_COMPARE && (
            <button
              onClick={() => setShowSearch(true)}
              className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 transition-all hover:border-primary-400 hover:bg-primary-50/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Plus size={20} className="text-gray-400" />
              </div>
              <span className="text-sm font-semibold text-gray-500">Add Fund</span>
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {showSearch && (
          <div className="mb-8">
            <div className="max-w-lg overflow-hidden rounded-xl border border-gray-200 bg-white shadow-dropdown">
              <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search funds by name or AMC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm focus:outline-none"
                  autoFocus
                />
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                  <X size={18} className="text-gray-400 transition hover:text-gray-600" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableFunds.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-500">No funds found matching your search.</p>
                ) : (
                  availableFunds.slice(0, 20).map((fund) => (
                    <button
                      key={fund.schemeCode}
                      onClick={() => addFund(fund)}
                      className="w-full border-b border-gray-50 p-4 text-left transition-colors last:border-0 hover:bg-primary-50"
                    >
                      <p className="text-sm font-semibold text-gray-900">{fund.schemeName}</p>
                      <p className="mt-1 text-xs text-gray-500">{fund.amcName} &bull; ₹{fund.nav.toFixed(2)}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {selectedFunds.length >= 2 ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="w-40 py-4 pl-6 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    Metric
                  </th>
                  {selectedFunds.map((fund) => (
                    <th key={fund.schemeCode} className="min-w-[200px] px-6 py-4 text-center">
                      <Link
                        href={`/mutual-funds/${fund.schemeCode}`}
                        className="text-xs font-bold text-primary-500 transition hover:text-primary-600 hover:underline line-clamp-2"
                      >
                        {fund.schemeName.replace(/ - Direct Growth| - Direct Plan.*$/i, '')}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareMetrics.map((metric, mIdx) => {
                  let bestIdx = -1;
                  if (metric.type === 'return') {
                    const numVals = metric.values as number[];
                    bestIdx = numVals.indexOf(Math.max(...numVals));
                  } else if (metric.type === 'expense') {
                    const numVals = (metric.values as (number | undefined)[]).filter(v => v !== undefined) as number[];
                    if (numVals.length > 0) {
                      const minVal = Math.min(...numVals);
                      bestIdx = (metric.values as (number | undefined)[]).indexOf(minVal);
                    }
                  }

                  return (
                    <tr key={metric.label} className={cn(
                      'border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50/50',
                      mIdx % 2 === 0 && 'bg-gray-50/30'
                    )}>
                      <td className="py-4 pl-6 text-sm font-semibold text-gray-700">{metric.label}</td>
                      {(metric.values as (string | number | undefined)[]).map((val, i) => (
                        <td key={i} className="px-6 py-4 text-center">
                          {metric.type === 'return' ? (
                            <span className={cn(
                              'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-bold',
                              (val as number) >= 0 ? 'text-positive' : 'text-negative',
                              i === bestIdx && 'bg-positive-light ring-1 ring-positive/20'
                            )}>
                              {(val as number) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                              {formatPercent(val as number)}
                            </span>
                          ) : metric.type === 'expense' ? (
                            <span className={cn(
                              'text-sm font-medium',
                              i === bestIdx ? 'font-bold text-positive' : 'text-gray-900'
                            )}>
                              {val !== undefined ? `${val}%` : 'N/A'}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{val ?? 'N/A'}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <GitCompare size={28} className="text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-700">Select at least 2 funds to compare</h3>
            <p className="mb-6 text-sm text-gray-500">Click &quot;Add Fund&quot; above to start comparing mutual funds side by side.</p>
            <Link href="/mutual-funds" className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-600">
              Browse Funds <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* CTA Section */}
        {selectedFunds.length >= 2 && (
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary-500 to-secondary-600 p-6 text-center text-white">
            <h3 className="mb-2 text-lg font-bold">Need help choosing the right fund?</h3>
            <p className="mb-4 text-sm text-white/80">Our experts can help you select the best fund based on your goals and risk profile.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-500 transition hover:bg-gray-100">
              Talk to an Advisor <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Compliance */}
        <div className="mt-8 space-y-3">
          <SEBIDisclaimer variant="inline" />
          <p className="text-center text-[11px] text-gray-400">
            {REGULATORY.PAST_PERFORMANCE.split('.')[0]}. {REGULATORY.DISTRIBUTOR_DISCLAIMER.split('.')[0]}.
          </p>
        </div>
      </div>
    </div>
  );
}
