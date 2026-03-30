'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, TrendingUp, BarChart3, Layers, ArrowRight,
  ChevronRight, Building2, Filter, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { generateFundSlug } from '@/lib/utils/fund-slug';
import { FundSearchInput } from '@/components/funds/FundSearchInput';
import { FUND_CATEGORIES } from '@/data/funds/categories';
import { DISCLAIMER } from '@/lib/constants/company';

/* ─── Types for the top-performers API response ─── */

interface TopPerformerFund {
  id: string;
  name: string;
  category: string;
  returns: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
  };
  aumCr: number;
  ter: number;
  sharpeRatio: number;
  rank: number;
  schemeCode?: number;
}

interface CategoryTopPerformers {
  category: string;
  funds: TopPerformerFund[];
}

/* ─── Top 10 categories for the filter tabs ─── */

const TOP_CATEGORIES = FUND_CATEGORIES.slice(0, 10).map((c) => c.name);

/* ─── Helpers ─── */

function formatReturn(value: number): { text: string; color: string } {
  if (!value) return { text: 'N/A', color: 'text-gray-400' };
  const pct = value * 100;
  const text = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  const color = pct >= 0 ? 'text-green-600' : 'text-red-500';
  return { text, color };
}

function formatAUM(aumCr: number): string {
  if (!aumCr) return 'N/A';
  if (aumCr >= 1000) return `\u20B9${(aumCr / 1000).toFixed(1)}K Cr`;
  return `\u20B9${new Intl.NumberFormat('en-IN').format(Math.round(aumCr))} Cr`;
}

function formatTER(ter: number): string {
  if (!ter) return 'N/A';
  return `${(ter * 100).toFixed(2)}%`;
}

/* ─── Explorer Fund Card (adapted for top-performers API data) ─── */

function ExplorerFundCard({
  fund,
  selected,
  onToggleCompare,
  showCompare,
}: {
  fund: TopPerformerFund;
  selected: boolean;
  onToggleCompare: (id: string) => void;
  showCompare: boolean;
}) {
  const oneY = formatReturn(fund.returns.oneYear);
  const threeY = formatReturn(fund.returns.threeYear);
  const fiveY = formatReturn(fund.returns.fiveYear);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-5 hover:shadow-md transition-all duration-200',
        selected ? 'border-teal-600 ring-2 ring-teal-100' : 'border-gray-200'
      )}
    >
      {/* Top: Name + Category + Compare */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0 flex-1">
          <Link
            href={fund.schemeCode ? `/funds/${generateFundSlug(fund.schemeCode, fund.name)}` : `/funds/${fund.id}`}
            className="font-semibold text-sm text-gray-900 hover:text-teal-700 transition-colors line-clamp-2 leading-tight"
          >
            {fund.name}
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-medium bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full whitespace-nowrap">
            {fund.category}
          </span>
          {showCompare && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleCompare(fund.id)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
              title="Add to compare"
            />
          )}
        </div>
      </div>

      {/* Rank badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full',
          fund.rank === 1 ? 'bg-amber-100 text-amber-700' :
          fund.rank === 2 ? 'bg-slate-100 text-slate-600' :
          fund.rank === 3 ? 'bg-orange-100 text-orange-700' :
          'bg-gray-100 text-gray-500'
        )}>
          #{fund.rank} Ranked
        </span>
        {fund.sharpeRatio > 0 && (
          <span className="text-[10px] text-gray-400">
            Sharpe {fund.sharpeRatio.toFixed(2)}
          </span>
        )}
      </div>

      {/* Returns grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="text-[11px] text-gray-500 mb-0.5">1Y Return</div>
          <div className={`text-sm font-semibold ${oneY.color}`}>{oneY.text}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500 mb-0.5">3Y Return</div>
          <div className={`text-sm font-semibold ${threeY.color}`}>{threeY.text}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500 mb-0.5">5Y Return</div>
          <div className={`text-sm font-semibold ${fiveY.color}`}>{fiveY.text}</div>
        </div>
      </div>

      {/* Bottom: AUM + TER */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div>
          <span className="text-gray-400">AUM </span>
          <span className="font-medium text-gray-700">{formatAUM(fund.aumCr)}</span>
        </div>
        <div>
          <span className="text-gray-400">TER </span>
          <span className="font-medium text-gray-700">{formatTER(fund.ter)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Card Skeleton ─── */

function ExplorerCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-32" />
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-3 bg-gray-100 rounded w-12 mb-1" />
            <div className="h-5 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="h-3 bg-gray-100 rounded w-20" />
        <div className="h-3 bg-gray-100 rounded w-16" />
      </div>
    </div>
  );
}

/* ─── Main Page Component ─── */

export default function FundExplorePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryTopPerformers[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Fetch top performers for a category (or all if null)
  const fetchTopPerformers = useCallback(async (category: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const url = category
        ? `/api/funds/top-performers?category=${encodeURIComponent(category)}`
        : '/api/funds/top-performers';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch top performers');
      const data: CategoryTopPerformers[] = await res.json();
      setCategoryData(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to load fund data. Please try again.');
      setCategoryData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on category change
  useEffect(() => {
    fetchTopPerformers(activeCategory);
  }, [activeCategory, fetchTopPerformers]);

  // Toggle compare
  const toggleCompare = (fundId: string) => {
    setCompareList((prev) => {
      if (prev.includes(fundId)) return prev.filter((id) => id !== fundId);
      if (prev.length >= 4) return prev; // max 4
      return [...prev, fundId];
    });
  };

  // Navigate to compare
  const handleCompare = () => {
    if (compareList.length >= 2) {
      router.push(`/funds/compare?funds=${compareList.join(',')}`);
    }
  };

  // Flatten all funds for display
  const allFunds = categoryData.flatMap((cat) => cat.funds);

  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-hero-pattern text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="container-custom relative z-10 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center animate-in">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Live Data from 40+ AMCs
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
              Explore{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-brand-200 to-accent">
                37,000+
              </span>{' '}
              Mutual Funds
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
              Search any scheme in India. Compare NAVs, returns, expense ratios, and
              find the right funds for your SIP portfolio with real-time data.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <FundSearchInput
                mode="navigate"
                placeholder="Search by fund name, AMC, or scheme code..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="bg-white border-b border-gray-200">
        <div className="container-custom py-4">
          <div className="flex items-center justify-center gap-6 sm:gap-10 text-center">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-gray-700">37,000+ Schemes</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-gray-700">40+ AMCs</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-semibold text-gray-700">Real-Time NAVs</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Category Filter Tabs ─── */}
      <section className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container-custom py-3">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div
              ref={tabsRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory -mx-1 px-1"
            >
              {/* All tab */}
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  'flex-shrink-0 snap-start px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border',
                  activeCategory === null
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-teal-300 hover:text-teal-700'
                )}
              >
                All Categories
              </button>

              {/* Category tabs */}
              {TOP_CATEGORIES.map((catName) => (
                <button
                  key={catName}
                  onClick={() => setActiveCategory(catName)}
                  className={cn(
                    'flex-shrink-0 snap-start px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border',
                    activeCategory === catName
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-teal-300 hover:text-teal-700'
                  )}
                >
                  {catName}
                </button>
              ))}

              {/* More categories indicator */}
              <Link
                href="/funds"
                className="flex-shrink-0 snap-start flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold text-gray-500 border border-dashed border-gray-300 hover:border-teal-300 hover:text-teal-700 transition-all whitespace-nowrap"
              >
                {FUND_CATEGORIES.length - TOP_CATEGORIES.length}+ More
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Results Section ─── */}
      <section className="section-padding bg-gray-50 min-h-[60vh]">
        <div className="container-custom">
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {activeCategory
                  ? `Top ${activeCategory} Funds`
                  : 'Top Performers Across Categories'}
              </h2>
              <p className="text-sm text-gray-500">
                {activeCategory
                  ? `Top-ranked funds in ${activeCategory} category by Trustner methodology`
                  : 'Research-backed top picks from every major fund category'}
              </p>
            </div>
            {compareList.length > 0 && (
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full">
                {compareList.length} selected
              </span>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-6">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={() => fetchTopPerformers(activeCategory)}
                className="text-sm font-semibold text-red-700 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ExplorerCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Loaded State — Group by category if showing all */}
          {!loading && !error && categoryData.length > 0 && (
            <>
              {activeCategory ? (
                /* Single category: flat grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allFunds.map((fund) => (
                    <ExplorerFundCard
                      key={fund.id}
                      fund={fund}
                      selected={compareList.includes(fund.id)}
                      onToggleCompare={toggleCompare}
                      showCompare
                    />
                  ))}
                </div>
              ) : (
                /* All categories: grouped sections */
                <div className="space-y-10">
                  {categoryData.map((catGroup) => (
                    <div key={catGroup.category}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-6 bg-teal-600 rounded-full" />
                          <h3 className="text-lg font-bold text-gray-900">
                            {catGroup.category}
                          </h3>
                          <span className="text-xs text-gray-400">
                            {catGroup.funds.length} funds
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveCategory(catGroup.category)}
                          className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors"
                        >
                          View all
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {catGroup.funds.slice(0, 3).map((fund) => (
                          <ExplorerFundCard
                            key={fund.id}
                            fund={fund}
                            selected={compareList.includes(fund.id)}
                            onToggleCompare={toggleCompare}
                            showCompare
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Empty State (no data, no error, not loading) */}
          {!loading && !error && categoryData.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Search for Any Mutual Fund Scheme in India
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Use the search bar above to find any of 37,000+ mutual fund schemes,
                or pick a category to see top performers.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Floating Compare Bar ─── */}
      {compareList.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="container-custom py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-semibold text-gray-900">
                {compareList.length} fund{compareList.length > 1 ? 's' : ''} selected
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                (max 4)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCompareList([])}
                className="text-xs font-medium text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleCompare}
                className="inline-flex items-center gap-2 bg-teal-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                Compare {compareList.length} Funds
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Links Section ─── */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            More Fund Research Tools
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link
              href="/funds/selection"
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-300 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-teal-700 transition-colors">
                Trustner Top Funds
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Monthly curated list of top-ranked funds across 15 categories
              </p>
            </Link>

            <Link
              href="/funds/screener"
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-300 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-teal-700 transition-colors">
                Fund Screener
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Filter funds by returns, AUM, expense ratio, and rating
              </p>
            </Link>

            <Link
              href="/funds/compare"
              className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-teal-300 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-teal-700 transition-colors">
                Compare Funds
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Side-by-side comparison of returns, risk, and portfolio overlap
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Disclaimer ─── */}
      <section className="py-8 bg-gray-100">
        <div className="container-custom">
          <div className="bg-white rounded-lg p-4 mb-3">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              <strong className="text-gray-600">Data Disclaimer:</strong> Fund data is sourced from
              MFapi.in and official AMC disclosures. Returns shown are historical and do not guarantee
              future performance. Always verify with official sources before investing.
            </p>
          </div>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            {DISCLAIMER.mutual_fund} {DISCLAIMER.amfi} | {DISCLAIMER.sebi_investor}
          </p>
        </div>
      </section>

      {/* Bottom padding for floating compare bar */}
      {compareList.length >= 2 && <div className="h-16" />}
    </>
  );
}
