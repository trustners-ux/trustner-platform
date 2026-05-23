'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, ArrowLeft, Zap, Globe, Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useScreener } from '@/lib/hooks/useScreener';
import { ScreenerFilters } from '@/components/funds/ScreenerFilters';
import { ScreenerResults } from '@/components/funds/ScreenerResults';
import { AllFundsSearch } from '@/components/funds/AllFundsSearch';
import type { ScreenerFilterState, RiskLevel } from '@/lib/hooks/useScreener';

// ─── Quick Filter Presets ───

interface Preset {
  label: string;
  description: string;
  filters: Partial<ScreenerFilterState>;
}

const PRESETS: Preset[] = [
  {
    label: 'Top Large Cap',
    description: 'Stable large-cap funds with strong 3Y returns',
    filters: {
      category: 'Large Cap',
      minThreeYearReturn: 0.15,
    },
  },
  {
    label: 'High Return Small Cap',
    description: 'Small-cap funds with 20%+ one-year returns',
    filters: {
      category: 'Small Cap',
      riskLevels: ['Very High'] as RiskLevel[],
    },
  },
  {
    label: 'Low Expense Ratio',
    description: 'Funds with expense ratio below 1.5%',
    filters: {
      expenseRatioMax: 0.015,
    },
  },
  {
    label: 'Hybrid Funds',
    description: 'Balanced and hybrid category funds',
    filters: {
      category: 'Balanced Advantage',
    },
  },
];

type TabKey = 'featured' | 'all';

export default function FundScreenerPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('featured');

  const {
    filters,
    setFilter,
    results,
    totalFunds,
    sortBy,
    setSortBy,
    sortDirection,
    resetFilters,
    activeFilterCount,
  } = useScreener();

  const applyPreset = useCallback(
    (preset: Preset) => {
      resetFilters();
      setTimeout(() => {
        Object.entries(preset.filters).forEach(([key, value]) => {
          setFilter(key as keyof ScreenerFilterState, value as ScreenerFilterState[keyof ScreenerFilterState]);
        });
      }, 0);
    },
    [resetFilters, setFilter]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/funds/selection"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Fund Selection</span>
            </Link>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-teal-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Fund Screener
                </h1>
              </div>
              <p className="text-sm text-gray-500 max-w-xl">
                {activeTab === 'featured'
                  ? `Filter and sort ${totalFunds} Trustner curated funds across 15 categories using returns, AUM, expense ratio, and risk levels.`
                  : 'Search across 37,000+ mutual fund schemes from 40+ AMCs. Find any fund by name, category, or AMC.'}
              </p>
            </div>
          </div>

          {/* Tab Toggle */}
          <div className="mt-5 flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab('featured')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                activeTab === 'featured'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Star className="w-4 h-4" />
              Featured Funds
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                activeTab === 'featured' ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'
              )}>
                {totalFunds}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                activeTab === 'all'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Globe className="w-4 h-4" />
              Search All Funds
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                activeTab === 'all' ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'
              )}>
                37K+
              </span>
            </button>
          </div>

          {/* Quick Presets (only for Featured tab) */}
          {activeTab === 'featured' && (
            <div className="mt-5">
              <div className="flex items-center gap-2 mb-2.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Filters
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap',
                      'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50'
                    )}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'featured' ? (
          /* ─── Featured Funds Tab: Filters + Results ─── */
          <div className="flex gap-6 items-start">
            <ScreenerFilters
              filters={filters}
              onFilterChange={setFilter}
              onReset={resetFilters}
              activeFilterCount={activeFilterCount}
            />
            <ScreenerResults
              results={results}
              totalFunds={totalFunds}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={setSortBy}
            />
          </div>
        ) : (
          /* ─── Search All Funds Tab ─── */
          <AllFundsSearch />
        )}
      </div>

      {/* Footer note */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            {activeTab === 'featured'
              ? 'Data sourced from Trustner curated fund list. Returns are annualized CAGR. Past performance does not guarantee future results. Mutual fund investments are subject to market risks.'
              : 'Data sourced from MFapi.in (AMFI). Returns are computed as CAGR. Results are limited to 20 matches — refine your search for better results. Past performance does not guarantee future results.'}
          </p>
        </div>
      </div>
    </div>
  );
}
