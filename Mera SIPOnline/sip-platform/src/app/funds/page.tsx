'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3, Star, TrendingUp, Filter, ArrowRight, Award,
  Shield, Layers, Search, ChevronRight, IndianRupee, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  FUND_CATEGORIES, getAllFunds, getTopPerformers,
  getFundsByCategory, getUniqueCategories,
} from '@/data/funds';
import { DISCLAIMER } from '@/lib/constants/company';
import type { FundCategory, MutualFund } from '@/types/funds';

const PERIOD_LABELS: Record<string, string> = {
  oneYear: '1 Year',
  threeYear: '3 Year',
  fiveYear: '5 Year',
};

const RISK_COLORS: Record<string, string> = {
  'Low': 'bg-green-50 text-green-700 border-green-200',
  'Moderate': 'bg-brand-50 text-brand-700 border-brand-200',
  'Moderately High': 'bg-amber-50 text-amber-700 border-amber-200',
  'High': 'bg-orange-50 text-orange-700 border-orange-200',
  'Very High': 'bg-red-50 text-red-700 border-red-200',
};

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  'Large Cap': Shield,
  'Mid Cap': TrendingUp,
  'Small Cap': BarChart3,
  'Flexi Cap': Layers,
  'Multi Cap': Layers,
  'ELSS': Award,
  'Large & Mid Cap': Shield,
  'Focused': Star,
  'Value': Search,
  'Index': BarChart3,
  'Sectoral': TrendingUp,
  'International': Layers,
};

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

export default function FundsPage() {
  const [selectedCategory, setSelectedCategory] = useState<FundCategory | 'All'>('All');
  const [sortPeriod, setSortPeriod] = useState<'oneYear' | 'threeYear' | 'fiveYear'>('threeYear');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);

  const allFunds = useMemo(() => getAllFunds(), []);
  const categories = useMemo(() => getUniqueCategories(), []);

  const topPerformers = useMemo(() => {
    let funds = selectedCategory === 'All'
      ? allFunds
      : getFundsByCategory(selectedCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      funds = funds.filter(
        f => f.name.toLowerCase().includes(q)
          || f.shortName.toLowerCase().includes(q)
          || f.amcName.toLowerCase().includes(q)
          || f.category.toLowerCase().includes(q)
      );
    }

    return [...funds].sort((a, b) => b.returns[sortPeriod] - a.returns[sortPeriod]);
  }, [allFunds, selectedCategory, sortPeriod, searchQuery]);

  const toggleFundSelection = (id: string) => {
    setSelectedFunds(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  };

  const compareUrl = selectedFunds.length >= 2
    ? `/funds/compare?funds=${selectedFunds.join(',')}`
    : null;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-pattern text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="container-custom relative z-10 py-16 lg:py-20">
          <div className="max-w-3xl animate-in">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-6 backdrop-blur-sm">
              <BarChart3 className="w-3.5 h-3.5 text-accent" />
              {allFunds.length} Funds Across {categories.length} Categories
            </div>
            <h1 className="text-4xl lg:text-display font-extrabold mb-4">
              Mutual Fund{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-brand-200 to-accent">
                Explorer
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              Browse, compare, and analyze mutual funds across categories. Research fund performance,
              expense ratios, holdings, and find the right funds for your SIP portfolio.
            </p>
          </div>
        </div>
      </section>

      {/* Live Fund Explorer Banner */}
      <section className="py-6 bg-surface-100">
        <div className="container-custom">
          <Link
            href="/funds/explore"
            className="block group"
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 via-teal-700 to-brand-700 p-6 sm:p-8 text-white shadow-md hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                        New
                      </span>
                      <h3 className="text-lg font-extrabold">Live Fund Explorer</h3>
                    </div>
                    <p className="text-sm text-teal-100 leading-relaxed max-w-lg">
                      Search, compare, and analyze 37,000+ mutual fund schemes with real-time NAV data
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 bg-white text-teal-700 text-sm font-bold px-5 py-2.5 rounded-lg group-hover:bg-teal-50 transition-colors flex-shrink-0">
                  Explore Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Category Cards */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-display-sm text-primary-700 mb-1">Fund Categories</h2>
              <p className="text-sm text-slate-500">Explore mutual funds by category to find the right fit for your goals</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FUND_CATEGORIES.map((cat) => {
              const IconComponent = CATEGORY_ICONS[cat.name] || Layers;
              const riskStyle = RISK_COLORS[cat.riskLevel] || 'bg-slate-50 text-slate-600 border-slate-200';
              const isActive = selectedCategory === cat.name;

              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(isActive ? 'All' : cat.name)}
                  className={cn(
                    'card-base p-5 text-left transition-all duration-200 group',
                    isActive
                      ? 'ring-2 ring-brand shadow-elevated'
                      : 'hover:shadow-elevated hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', cat.color)}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                      riskStyle
                    )}>
                      {cat.riskLevel}
                    </span>
                  </div>

                  <h3 className="font-bold text-primary-700 mb-1 group-hover:text-brand transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">
                    {cat.description}
                  </p>

                  <div className={cn('h-1 rounded-full bg-gradient-to-r w-full', cat.color)} />

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {cat.typicalReturns}
                    </span>
                    <ChevronRight className={cn(
                      'w-4 h-4 transition-all',
                      isActive ? 'text-brand' : 'text-slate-300 group-hover:text-brand'
                    )} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Performers Table */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-display-sm text-primary-700 mb-1">
                {selectedCategory === 'All' ? 'Top Performing Funds' : `${selectedCategory} Funds`}
              </h2>
              <p className="text-sm text-slate-500">
                {topPerformers.length} fund{topPerformers.length !== 1 ? 's' : ''} sorted by {PERIOD_LABELS[sortPeriod]} returns
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex bg-surface-100 rounded-lg p-0.5">
                {(['oneYear', 'threeYear', 'fiveYear'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSortPeriod(period)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-md transition-all',
                      sortPeriod === period
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-slate-500 hover:text-primary-700'
                    )}
                  >
                    {PERIOD_LABELS[period]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by fund name, AMC, or category..."
              className="w-full bg-surface-100 border border-surface-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-primary-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Fund Selection Bar */}
          {selectedFunds.length > 0 && (
            <div className="mb-6 flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-brand" />
                <span className="font-medium text-brand-700">
                  {selectedFunds.length} fund{selectedFunds.length > 1 ? 's' : ''} selected
                </span>
                <span className="text-brand-500">(select 2-3 to compare)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedFunds([])}
                  className="text-xs text-brand-500 hover:text-brand-700 font-medium"
                >
                  Clear
                </button>
                {compareUrl && (
                  <Link
                    href={compareUrl}
                    className="inline-flex items-center gap-1.5 bg-brand text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Compare <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-surface-300/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-100 border-b border-surface-300/70">
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider w-8" />
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Fund Name</th>
                  <th className="text-left p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-center p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Rating</th>
                  <th className="text-right p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">1Y</th>
                  <th className="text-right p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">3Y</th>
                  <th className="text-right p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">5Y</th>
                  <th className="text-right p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">AUM</th>
                  <th className="text-right p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Expense</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      No funds match your search criteria.
                    </td>
                  </tr>
                ) : (
                  topPerformers.map((fund, index) => {
                    const isSelected = selectedFunds.includes(fund.id);
                    return (
                      <tr
                        key={fund.id}
                        className={cn(
                          'border-b border-surface-200 hover:bg-surface-50 transition-colors cursor-pointer',
                          isSelected && 'bg-brand-50/50'
                        )}
                        onClick={() => toggleFundSelection(fund.id)}
                      >
                        <td className="p-3">
                          <div className={cn(
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                            isSelected
                              ? 'bg-brand border-brand'
                              : 'border-slate-300 hover:border-brand-300'
                          )}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-semibold text-primary-700 whitespace-nowrap">{fund.shortName}</div>
                            <div className="text-[11px] text-slate-400">{fund.amcName}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap',
                            RISK_COLORS[fund.riskLevel] || 'bg-slate-50 text-slate-600 border-slate-200'
                          )}>
                            {fund.category}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <StarRating rating={fund.rating} />
                        </td>
                        <td className={cn(
                          'p-3 text-right font-semibold whitespace-nowrap',
                          fund.returns.oneYear >= 0 ? 'text-positive' : 'text-red-500'
                        )}>
                          {fund.returns.oneYear.toFixed(1)}%
                        </td>
                        <td className={cn(
                          'p-3 text-right font-semibold whitespace-nowrap',
                          fund.returns.threeYear >= 0 ? 'text-positive' : 'text-red-500'
                        )}>
                          {fund.returns.threeYear.toFixed(1)}%
                        </td>
                        <td className={cn(
                          'p-3 text-right font-semibold whitespace-nowrap',
                          fund.returns.fiveYear >= 0 ? 'text-positive' : 'text-red-500'
                        )}>
                          {fund.returns.fiveYear.toFixed(1)}%
                        </td>
                        <td className="p-3 text-right text-slate-600 whitespace-nowrap">
                          <IndianRupee className="w-3 h-3 inline -mt-0.5" />
                          {formatAUM(fund.aum)}
                        </td>
                        <td className="p-3 text-right text-slate-600 whitespace-nowrap">
                          {fund.expenseRatio.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 text-center">
            Click on any fund row to select it for comparison. Select 2-3 funds to compare side-by-side.
          </p>
        </div>
      </section>

      {/* Compare CTA */}
      <section className="section-padding bg-gradient-to-r from-brand-50/50 to-brand-50/50">
        <div className="container-custom">
          <div className="card-base p-8 sm:p-10 text-center">
            <Layers className="w-12 h-12 mx-auto mb-4 text-brand" />
            <h2 className="text-2xl font-extrabold text-primary-700 mb-3">
              Compare Funds Side-by-Side
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-xl mx-auto">
              Select 2-3 funds from the table above to compare returns, expense ratios, holdings overlap,
              risk levels, and more. Make informed decisions for your SIP portfolio.
            </p>
            {compareUrl ? (
              <Link
                href={compareUrl}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Compare {selectedFunds.length} Funds
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <p className="text-xs text-slate-400">
                Select at least 2 funds from the table above to enable comparison
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <div className="bg-white rounded-lg p-4 mb-3">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              <strong className="text-slate-600">Data Disclaimer:</strong> Fund data shown is illustrative and for educational purposes only. Actual fund performance, NAV, and portfolio details may vary. Always verify with official AMC sources before investing.
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
