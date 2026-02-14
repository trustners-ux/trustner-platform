'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { GitCompare, Search, X, TrendingUp, TrendingDown, Plus, ChevronRight } from 'lucide-react';
import { MOCK_TOP_FUNDS } from '@/data/mock-funds';
import { formatPercent } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import SEBIDisclaimer from '@/components/compliance/SEBIDisclaimer';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container-custom py-8">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/mutual-funds" className="hover:text-blue-600">Mutual Funds</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-700">Compare</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <GitCompare className="w-7 h-7 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Compare Mutual Funds</h1>
          </div>
          <p className="text-gray-500">Select up to {MAX_COMPARE} funds for side-by-side comparison.</p>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Fund Selector Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {selectedFunds.map((fund) => (
            <div key={fund.schemeCode} className="bg-white rounded-xl border-2 border-blue-100 p-4 relative group">
              <button
                onClick={() => removeFund(fund.schemeCode)}
                className="absolute top-2 right-2 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-red-600" />
              </button>
              <p className="text-xs font-semibold text-blue-600 mb-1">{fund.amcName}</p>
              <p className="text-sm font-bold text-gray-900 line-clamp-2 pr-4">
                {fund.schemeName.replace(/ - Direct Growth| - Direct Plan.*$/i, '')}
              </p>
              <p className="text-xs text-gray-500 mt-2">NAV: ₹{fund.nav.toFixed(2)}</p>
            </div>
          ))}
          {selectedFunds.length < MAX_COMPARE && (
            <button
              onClick={() => setShowSearch(true)}
              className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/50 transition-colors min-h-[100px]"
            >
              <Plus className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-500">Add Fund</span>
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {showSearch && (
          <div className="mb-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg max-w-lg">
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search funds by name or AMC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm focus:outline-none"
                  autoFocus
                />
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableFunds.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500 text-center">No funds found</p>
                ) : (
                  availableFunds.map((fund) => (
                    <button
                      key={fund.schemeCode}
                      onClick={() => addFund(fund)}
                      className="w-full text-left p-4 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <p className="text-sm font-semibold text-gray-900">{fund.schemeName}</p>
                      <p className="text-xs text-gray-500 mt-1">{fund.amcName} • ₹{fund.nav.toFixed(2)}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {selectedFunds.length >= 2 ? (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-40 py-4 pl-6 text-left text-xs font-bold uppercase text-gray-400 tracking-wider">
                    Metric
                  </th>
                  {selectedFunds.map((fund) => (
                    <th key={fund.schemeCode} className="px-6 py-4 text-center min-w-[200px]">
                      <Link
                        href={`/mutual-funds/${fund.schemeCode}`}
                        className="text-xs font-bold text-blue-600 hover:underline line-clamp-2"
                      >
                        {fund.schemeName.replace(/ - Direct Growth| - Direct Plan.*$/i, '')}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareMetrics.map((metric) => {
                  let bestIdx = -1;
                  if (metric.type === 'return') {
                    const numVals = metric.values as number[];
                    bestIdx = numVals.indexOf(Math.max(...numVals));
                  } else if (metric.type === 'expense') {
                    const numVals = metric.values as number[];
                    bestIdx = numVals.indexOf(Math.min(...numVals));
                  }

                  return (
                    <tr key={metric.label} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="py-4 pl-6 text-sm font-semibold text-gray-700">{metric.label}</td>
                      {(metric.values as (string | number)[]).map((val, i) => (
                        <td key={i} className="px-6 py-4 text-center">
                          {metric.type === 'return' ? (
                            <span className={cn(
                              'inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-bold',
                              (val as number) >= 0 ? 'text-green-600' : 'text-red-600',
                              i === bestIdx && 'bg-green-50 ring-1 ring-green-200'
                            )}>
                              {(val as number) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {formatPercent(val as number)}
                            </span>
                          ) : metric.type === 'expense' ? (
                            <span className={cn(
                              'text-sm font-medium',
                              i === bestIdx ? 'text-green-600 font-bold' : 'text-gray-900'
                            )}>
                              {val}%
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{val}</span>
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
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <GitCompare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Select at least 2 funds to compare</h3>
            <p className="text-gray-500 text-sm">Click &quot;Add Fund&quot; above to start comparing mutual funds side by side.</p>
          </div>
        )}

        <div className="mt-6">
          <SEBIDisclaimer variant="inline" />
        </div>
      </div>
    </div>
  );
}
