'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Award, BarChart3, TrendingUp, Shield, ChevronDown, ChevronUp,
  ListChecks, ArrowRight, UserPlus, Calendar, Layers, Star,
  Eye, EyeOff, Trophy, Search, X, Printer, GitCompareArrows,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CURRENT_TRUSTNER_LIST, getTotalFundCount, getCategoryCount } from '@/data/funds/trustner';
import { TrustnerCategoryTable } from '@/components/funds/TrustnerCategoryTable';
import { FundComparePanel } from '@/components/funds/FundComparePanel';
import { RankBadge } from '@/components/funds/RankBadge';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';
import { formatAUMShort } from '@/lib/utils/formatters';
import type { FundCategory, TrustnerCuratedFund } from '@/types/funds';
import { useLiveNavData } from '@/hooks/useLiveNavData';

const CATEGORY_ORDER = CURRENT_TRUSTNER_LIST.categories.map((c) => c.name);

const SELECTION_CRITERIA = [
  { icon: Shield, title: 'AUM Comfort Zone', desc: 'Category-specific AUM thresholds ensuring adequate fund size and liquidity' },
  { icon: BarChart3, title: 'Expense Ratio (TER)', desc: 'Lower costs mean more of your money is working for you' },
  { icon: TrendingUp, title: 'Risk-Adjusted Returns', desc: 'Sharpe ratio and standard deviation analysis for risk-reward balance' },
  { icon: Star, title: 'Consistent Performance', desc: 'Multi-period return analysis across MTD, YTD, 1Y, 2Y, 3Y, 5Y horizons' },
  { icon: ListChecks, title: 'Portfolio Quality', desc: '35-65 holdings sweet spot — not too concentrated, not over-diversified' },
  { icon: Award, title: 'Skin in the Game', desc: 'Fund managers investing their own money alongside yours' },
];

// Get all funds flat for search
const ALL_FUNDS = CURRENT_TRUSTNER_LIST.categories.flatMap((cat) =>
  cat.funds.map((f) => ({ ...f, categoryName: cat.name, categoryDisplayName: cat.displayName }))
);

// ─── Category Quick Stats ───
function CategoryQuickStat({ fund }: { fund: TrustnerCuratedFund }) {
  const best = (v: number) => {
    if (v === 0) return '—';
    const pct = v * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };
  const longTermReturn = fund.returns.fiveYear || fund.returns.threeYear || fund.returns.oneYear;
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'text-xs font-bold',
          longTermReturn > 0 ? 'text-positive' : 'text-red-500'
        )}
      >
        {best(longTermReturn)}
      </span>
      <span className="text-[10px] text-slate-400">
        {fund.returns.fiveYear ? '5Y' : fund.returns.threeYear ? '3Y' : '1Y'}
      </span>
    </div>
  );
}

// ─── Search Result Card ───
function SearchResultCard({
  fund,
  categoryDisplayName,
  onClick,
}: {
  fund: TrustnerCuratedFund;
  categoryDisplayName: string;
  onClick: () => void;
}) {
  const pct = (v: number) => {
    if (!v) return '—';
    const p = v * 100;
    return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
  };

  return (
    <button onClick={onClick} className="w-full text-left card-base p-4 hover:shadow-elevated transition-all">
      <div className="flex items-start gap-3">
        <RankBadge rank={fund.rank} />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-primary-700 text-sm leading-tight">{fund.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-semibold text-brand bg-brand-50 px-2 py-0.5 rounded-full">
              {categoryDisplayName}
            </span>
            <span className="text-[10px] text-slate-400">{fund.fundManager}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px]">
            <span className="text-slate-500">AUM {formatAUMShort(fund.aumCr)}</span>
            <span className={cn('font-bold', fund.returns.threeYear > 0 ? 'text-positive' : 'text-red-500')}>
              {pct(fund.returns.threeYear)} <span className="text-slate-400 font-normal">3Y</span>
            </span>
            <span className={cn('font-bold', fund.returns.fiveYear > 0 ? 'text-positive' : 'text-red-500')}>
              {pct(fund.returns.fiveYear)} <span className="text-slate-400 font-normal">5Y</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function FundSelectionPage() {
  const [activeCategory, setActiveCategory] = useState<FundCategory>(CATEGORY_ORDER[0]);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedFundIds, setSelectedFundIds] = useState<string[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Live NAV data — auto-fetched, merged with static data
  const { navMap, updatedAt: navUpdatedAt, hasData: hasLiveNav, isLoading: navLoading } = useLiveNavData();

  const totalFunds = getTotalFundCount();
  const totalCategories = getCategoryCount();
  const activeCategoryData = CURRENT_TRUSTNER_LIST.categories.find((c) => c.name === activeCategory);

  // Get #1 ranked fund per category for the overview
  const topPicks = CURRENT_TRUSTNER_LIST.categories.map((cat) => ({
    category: cat,
    topFund: [...cat.funds].sort((a, b) => a.rank - b.rank)[0],
  }));

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_FUNDS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.fundManager.toLowerCase().includes(q) ||
        f.categoryDisplayName.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  // Compare mode
  const selectedFunds = useMemo(
    () => ALL_FUNDS.filter((f) => selectedFundIds.includes(f.id)),
    [selectedFundIds]
  );

  const handleToggleCompare = (fund: TrustnerCuratedFund) => {
    setSelectedFundIds((prev) =>
      prev.includes(fund.id)
        ? prev.filter((id) => id !== fund.id)
        : prev.length < 5
        ? [...prev, fund.id]
        : prev
    );
  };

  const handleSearchResultClick = (categoryName: string) => {
    setActiveCategory(categoryName as FundCategory);
    setSearchQuery('');
    setShowAllCategories(false);
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-pattern text-white print:bg-white print:text-primary-700">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 print:hidden" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 print:hidden" />
        <div className="container-custom relative z-10 py-16 lg:py-20 print:py-8">
          <div className="max-w-3xl animate-in">
            <div className="inline-flex items-center gap-2 bg-white/10 print:bg-brand-50 rounded-full px-4 py-1.5 text-xs font-medium mb-6 backdrop-blur-sm">
              <Calendar className="w-3.5 h-3.5 text-accent print:text-brand" />
              {CURRENT_TRUSTNER_LIST.month} {CURRENT_TRUSTNER_LIST.year} Edition
            </div>
            <h1 className="text-4xl lg:text-display font-extrabold mb-4 print:text-3xl">
              Trustner{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-brand-200 to-accent print:text-brand">
                Top Funds List
              </span>
            </h1>
            <p className="text-lg text-slate-300 print:text-slate-600 leading-relaxed max-w-2xl mb-8 print:mb-4">
              Research-backed monthly curated selection of top-performing mutual funds across {totalCategories} categories.
              Every fund evaluated on 12+ parameters including Sharpe ratio, skin in the game, and portfolio quality.
            </p>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-4 sm:gap-8">
              {[
                { value: totalFunds, label: 'Curated Funds' },
                { value: totalCategories, label: 'Categories' },
                { value: '12+', label: 'Parameters' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 print:bg-surface-100 backdrop-blur-sm rounded-xl px-5 py-3">
                  <div className="text-2xl font-extrabold text-accent print:text-brand">{stat.value}</div>
                  <div className="text-xs text-slate-400 print:text-slate-600">{stat.label}</div>
                </div>
              ))}
              <div className="bg-white/10 print:bg-surface-100 backdrop-blur-sm rounded-xl px-5 py-3">
                <div className="text-lg font-extrabold text-white print:text-primary-700">{COMPANY.mfEntity.amfiArn}</div>
                <div className="text-xs text-slate-400 print:text-slate-600">AMFI Registered</div>
              </div>
            </div>

            {/* Data as on date */}
            <div className="mt-5 flex flex-wrap gap-3">
              {hasLiveNav && navUpdatedAt && (
                <div className="inline-flex items-center gap-2 bg-emerald-500/15 print:bg-emerald-50 rounded-lg px-4 py-2 border border-emerald-400/20 print:border-emerald-200 animate-in">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 print:hidden" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="text-xs text-emerald-200 print:text-emerald-700">
                    Live NAV: <strong className="text-white print:text-emerald-800">
                      {new Date(navUpdatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                  </span>
                </div>
              )}
              {navLoading && (
                <div className="inline-flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xs text-slate-400">Loading live data...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search + Tools Bar */}
      <section className="sticky top-0 z-30 bg-white border-b border-surface-200 shadow-sm print:hidden">
        <div className="container-custom py-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search funds, managers, categories..."
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    searchRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Tool Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (compareMode) setSelectedFundIds([]);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
                  compareMode
                    ? 'bg-brand text-white border-brand'
                    : 'text-slate-600 border-surface-300 hover:border-brand-300 hover:text-brand'
                )}
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compare</span>
                {selectedFundIds.length > 0 && (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                    {selectedFundIds.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-surface-300 text-slate-600 hover:border-brand-300 hover:text-brand transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Compare mode banner */}
          {compareMode && (
            <div className="mt-2 flex items-center gap-2 bg-brand-50 rounded-lg px-4 py-2 text-xs text-brand-700">
              <GitCompareArrows className="w-3.5 h-3.5" />
              <span className="font-medium">
                {selectedFundIds.length === 0
                  ? 'Select 2-5 funds from any category to compare'
                  : `${selectedFundIds.length} fund${selectedFundIds.length > 1 ? 's' : ''} selected`}
              </span>
              {selectedFundIds.length >= 2 && (
                <button
                  onClick={() => {
                    document.getElementById('compare-panel')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="ml-auto font-bold text-brand hover:underline"
                >
                  View comparison
                </button>
              )}
              {selectedFundIds.length > 0 && (
                <button
                  onClick={() => setSelectedFundIds([])}
                  className="font-medium text-slate-500 hover:text-red-500"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Search Results Dropdown */}
          {isSearching && (
            <div className="absolute left-0 right-0 top-full bg-white border-b border-surface-200 shadow-lg z-40">
              <div className="container-custom py-4">
                {searchResults.length > 0 ? (
                  <>
                    <div className="text-xs text-slate-400 mb-3">
                      {searchResults.length} fund{searchResults.length > 1 ? 's' : ''} found for &quot;{searchQuery}&quot;
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
                      {searchResults.map((fund) => (
                        <SearchResultCard
                          key={fund.id}
                          fund={fund}
                          categoryDisplayName={fund.categoryDisplayName}
                          onClick={() => handleSearchResultClick(fund.categoryName)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No funds found for &quot;{searchQuery}&quot;</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching by fund name, manager, or category</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Compare Panel */}
      {compareMode && selectedFunds.length >= 2 && (
        <section id="compare-panel" className="section-padding-sm bg-surface-50">
          <div className="container-custom">
            <FundComparePanel
              funds={selectedFunds}
              onRemove={(id) => setSelectedFundIds((prev) => prev.filter((fid) => fid !== id))}
              onClose={() => {
                setCompareMode(false);
                setSelectedFundIds([]);
              }}
              navMap={navMap}
            />
          </div>
        </section>
      )}

      {/* Top Pick per Category — Quick Overview */}
      <section className="section-padding bg-surface-100 print:py-6">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-display-sm text-primary-700">#1 Ranked Fund in Each Category</h2>
              </div>
              <p className="text-sm text-slate-500">Quick overview of the top pick from each of {totalCategories} categories</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topPicks.map(({ category: cat, topFund }) => (
              <button
                key={cat.name}
                onClick={() => {
                  setActiveCategory(cat.name);
                  setShowAllCategories(false);
                  scrollToTable();
                }}
                className={cn(
                  'card-base p-4 text-left transition-all hover:shadow-elevated group print:shadow-none print:border',
                  activeCategory === cat.name && !showAllCategories && 'ring-2 ring-brand'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-brand uppercase tracking-wider">
                    {cat.displayName}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-surface-100 px-2 py-0.5 rounded-full">
                    {cat.funds.length} funds
                  </span>
                </div>
                {topFund && (
                  <>
                    <div className="font-semibold text-primary-700 text-sm leading-tight mb-1.5 group-hover:text-brand transition-colors">
                      {topFund.name.length > 45 ? topFund.name.substring(0, 45) + '...' : topFund.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        AUM {formatAUMShort(topFund.aumCr)}
                      </span>
                      <CategoryQuickStat fund={topFund} />
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How We Select Funds — Collapsible */}
      <section className="py-6 bg-white print:hidden">
        <div className="container-custom">
          <button
            onClick={() => setMethodologyOpen(!methodologyOpen)}
            className="w-full flex items-center justify-between card-base p-5 sm:p-6 hover:shadow-elevated transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <ListChecks className="w-5 h-5 text-brand" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-primary-700">How We Select Funds</h2>
                <p className="text-xs text-slate-500">12-parameter research methodology by Trustner</p>
              </div>
            </div>
            {methodologyOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {methodologyOpen && (
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in">
              {SELECTION_CRITERIA.map((item) => (
                <div key={item.title} className="card-base p-5">
                  <item.icon className="w-8 h-8 text-brand mb-3" />
                  <h3 className="font-bold text-primary-700 mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Category Selector + Fund Cards */}
      <section ref={tableRef} className="section-padding bg-surface-50 print:py-6">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-display-sm text-primary-700 mb-1">Detailed Fund View</h2>
              <p className="text-sm text-slate-500">
                {hasLiveNav ? 'Returns updated daily via live NAV' : `Data as on ${CURRENT_TRUSTNER_LIST.dataAsOn}`} | Tap any row for full details
              </p>
            </div>
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-surface-300 text-slate-600 hover:border-brand-300 hover:text-brand transition-all print:hidden"
            >
              {showAllCategories ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showAllCategories ? 'Show one category' : 'Show all categories'}
            </button>
          </div>

          {/* Category Pills — Horizontal Scroll (only when not showing all) */}
          {!showAllCategories && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide print:hidden">
              {CATEGORY_ORDER.map((catName) => {
                const catData = CURRENT_TRUSTNER_LIST.categories.find((c) => c.name === catName);
                if (!catData) return null;
                const isActive = activeCategory === catName;
                return (
                  <button
                    key={catName}
                    onClick={() => setActiveCategory(catName)}
                    className={cn(
                      'flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border',
                      isActive
                        ? 'bg-brand text-white border-brand shadow-sm'
                        : 'bg-white text-slate-600 border-surface-300 hover:border-brand-300 hover:text-brand'
                    )}
                  >
                    {catData.displayName}
                    <span className={cn('ml-1.5', isActive ? 'text-white/70' : 'text-slate-400')}>
                      ({catData.funds.length})
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Fund Cards */}
          {showAllCategories ? (
            // Show ALL categories stacked
            <div className="space-y-8">
              {CURRENT_TRUSTNER_LIST.categories.map((cat) => (
                <div key={cat.name} id={`cat-${cat.name.replace(/\s+/g, '-').toLowerCase()}`}>
                  <div className="card-base overflow-hidden print:break-inside-avoid">
                    <div className="bg-gradient-to-r from-primary-700 to-primary-800 print:from-surface-100 print:to-surface-200 px-4 sm:px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white print:text-primary-700">
                          {cat.displayName}
                        </h3>
                        <p className="text-xs text-slate-300 print:text-slate-500">
                          {cat.funds.length} funds | Ranked by Trustner methodology
                        </p>
                      </div>
                      <Award className="w-8 h-8 text-accent/60 print:text-slate-300" />
                    </div>
                    <TrustnerCategoryTable
                      category={cat}
                      compareMode={compareMode}
                      selectedFunds={selectedFundIds}
                      onToggleCompare={handleToggleCompare}
                      navMap={navMap}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show single active category
            activeCategoryData && (
              <div className="card-base overflow-hidden print:break-inside-avoid">
                <div className="bg-gradient-to-r from-primary-700 to-primary-800 print:from-surface-100 print:to-surface-200 px-4 sm:px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white print:text-primary-700">
                      {activeCategoryData.displayName}
                    </h3>
                    <p className="text-xs text-slate-300 print:text-slate-500">
                      {activeCategoryData.funds.length} funds | Ranked by Trustner methodology
                      {activeCategoryData.hasSkinInTheGame && ' | Skin in the Game data available'}
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-accent/60 print:text-slate-300" />
                </div>
                <TrustnerCategoryTable
                  category={activeCategoryData}
                  compareMode={compareMode}
                  selectedFunds={selectedFundIds}
                  onToggleCompare={handleToggleCompare}
                  navMap={navMap}
                />
              </div>
            )
          )}

          {/* Mobile: show all toggle */}
          <div className="sm:hidden mt-4 text-center print:hidden">
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold border border-surface-300 text-slate-600 hover:border-brand-300 hover:text-brand transition-all"
            >
              {showAllCategories ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showAllCategories ? 'Show one category' : 'View all 15 categories at once'}
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-br from-brand-50/50 to-surface-100 print:hidden">
        <div className="container-custom">
          <div className="card-base p-8 sm:p-10 text-center">
            <Layers className="w-12 h-12 mx-auto mb-4 text-brand" />
            <h2 className="text-2xl font-extrabold text-primary-700 mb-3">
              Start Investing in Top-Ranked Funds
            </h2>
            <p className="text-sm text-slate-500 mb-6 max-w-xl mx-auto">
              Open your investment account with Trustner and start SIP in any of these curated funds.
              Free account setup, paperless KYC, and expert guidance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #E8553A, #C4381A)' }}
              >
                <UserPlus className="w-4 h-4" />
                Sign Up Now
              </a>
              <Link
                href="/funds"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border-2 border-brand text-brand hover:bg-brand-50 transition-colors"
              >
                Explore All Funds
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200 print:py-4">
        <div className="container-custom">
          <div className="bg-white rounded-lg p-4 mb-3">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              <strong className="text-slate-600">Important:</strong> This is Trustner&apos;s research-backed fund selection for {CURRENT_TRUSTNER_LIST.month} {CURRENT_TRUSTNER_LIST.year}. The list is updated on the 1st of every month. Past performance does not guarantee future returns. All data is sourced from official AMC disclosures and AMFI records.
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
