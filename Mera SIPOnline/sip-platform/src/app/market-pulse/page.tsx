'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Gem,
  DollarSign,
  Landmark,
  Clock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Calendar,
  Shield,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Zap,
  PieChart,
  Users,
  Calculator,
  Receipt,
  Scale,
  RefreshCw,
  Wifi,
  WifiOff,
  Flame,
  PlusCircle,
  CalendarCheck,
  ArrowDownUp,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  marketIndicators as staticIndicators,
  getLatestCommentary,
  getPreviousCommentaries,
  getAllInsights,
  sipTimingInsights,
} from '@/data/market';
import type { MarketIndicator } from '@/types/market';

/* ------------------------------------------------------------------ */
/*  Icon resolver                                                      */
/* ------------------------------------------------------------------ */
const iconMap: Record<string, React.ElementType> = {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Gem,
  DollarSign,
  Landmark,
  Clock,
  Lightbulb,
  Shield,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Zap,
  PieChart,
  Users,
  Calculator,
  Receipt,
  Scale,
  Calendar,
  Flame,
  PlusCircle,
  CalendarCheck,
  ArrowDownUp,
  CalendarDays,
};

function resolveIcon(name: string) {
  return iconMap[name] ?? BarChart3;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatValue(value: number): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function outlookColor(outlook: string) {
  switch (outlook) {
    case 'Bullish':
      return 'bg-positive-50 text-positive border-positive/20';
    case 'Bearish':
      return 'bg-red-50 text-red-600 border-red-200';
    case 'Neutral':
      return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'Cautiously Optimistic':
      return 'bg-brand-50 text-brand border-brand/20';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function categoryBadge(category: string) {
  switch (category) {
    case 'SIP Timing':
      return 'bg-brand-50 text-brand';
    case 'Market Education':
      return 'bg-teal-50 text-teal-600';
    case 'Industry News':
      return 'bg-violet-50 text-violet-600';
    case 'Strategy':
      return 'bg-amber-50 text-amber-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function MarketPulsePage() {
  const latestCommentary = getLatestCommentary();
  const previousCommentaries = getPreviousCommentaries();
  const allInsights = getAllInsights();

  const [expandedCommentary, setExpandedCommentary] = useState<string | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  // Live market data state
  const [marketIndicators, setMarketIndicators] = useState<MarketIndicator[]>(staticIndicators);
  const [isLive, setIsLive] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const res = await fetch('/api/market-data');
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      if (json.indicators && json.indicators.length > 0) {
        setMarketIndicators(json.indicators);
        setIsLive(true);
        setLastFetched(new Date());
      }
    } catch {
      // Silently fall back to static data
      setIsLive(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on mount + auto-refresh every 60s
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(() => fetchLiveData(), 60_000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  function toggleInsight(id: string) {
    setExpandedInsights((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* ============================================================ */}
      {/*  1. Hero Section                                              */}
      {/* ============================================================ */}
      <section className="bg-gradient-to-br from-primary-700 to-brand-800 text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl animate-in">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-6 backdrop-blur-sm">
              <Activity className="w-3.5 h-3.5 text-accent" />
              Live Market Overview
            </div>
            <h1 className="text-4xl lg:text-display font-extrabold mb-4">
              Market Pulse
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Stay informed with weekly market updates, curated insights, and expert commentary
              — all viewed through the lens of a disciplined SIP investor.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  2. Market Indicators Bar                                     */}
      {/* ============================================================ */}
      <section className="py-8 bg-surface-100">
        <div className="container-custom">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-positive bg-positive-50 px-2.5 py-1 rounded-full">
                  <Wifi className="w-3 h-3" />
                  Live Data
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  <WifiOff className="w-3 h-3" />
                  Sample Data
                </span>
              )}
              {lastFetched && (
                <span className="text-[10px] text-slate-400">
                  Updated {lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <button
              onClick={() => fetchLiveData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand hover:text-brand-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {marketIndicators.map((indicator) => {
              const isPositive = indicator.change >= 0;
              const Icon = resolveIcon(indicator.icon);

              return (
                <div
                  key={indicator.symbol}
                  className="rounded-xl bg-white shadow-card overflow-hidden"
                >
                  {/* Gradient top bar */}
                  <div className={cn('h-1 bg-gradient-to-r', indicator.color)} />

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center',
                          indicator.color
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 truncate">
                        {indicator.name}
                      </span>
                    </div>

                    <div className="text-lg font-bold text-primary-700 leading-tight mb-1">
                      {formatValue(indicator.value)}
                    </div>

                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5 text-positive" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          isPositive ? 'text-positive' : 'text-red-500'
                        )}
                      >
                        {isPositive ? '+' : ''}
                        {indicator.change.toFixed(2)}{' '}
                        ({isPositive ? '+' : ''}
                        {indicator.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  3. Latest Weekly Commentary                                  */}
      {/* ============================================================ */}
      <section className="section-padding">
        <div className="container-custom">
          <h2 className="text-display-sm text-primary-700 mb-2">Weekly Market Commentary</h2>
          <p className="text-sm text-slate-400 mb-8">
            Expert analysis of market movements with SIP-specific takeaways.
          </p>

          {/* Featured (latest) */}
          <div className="rounded-xl bg-white shadow-card border border-surface-200 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-700 to-brand-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-slate-300">Latest</span>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {latestCommentary.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {latestCommentary.weekRange}
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold px-3 py-1 rounded-full border',
                    outlookColor(latestCommentary.outlook)
                  )}
                >
                  {latestCommentary.outlook}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                {latestCommentary.summary}
              </p>

              {/* Key Points */}
              <div>
                <h4 className="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand" />
                  Key Points This Week
                </h4>
                <ul className="space-y-2">
                  {latestCommentary.keyPoints.map((point, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed"
                    >
                      <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-brand">
                          {i + 1}
                        </span>
                      </div>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* SIP Advice */}
              <div className="rounded-xl bg-gradient-to-br from-accent-50 to-amber-50 border border-accent-200/50 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-accent-700 mb-1">
                      SIP Investor Advice
                    </h4>
                    <p className="text-sm text-accent-800/80 leading-relaxed">
                      {latestCommentary.sipAdvice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  4. Previous Commentaries                                     */}
      {/* ============================================================ */}
      {previousCommentaries.length > 0 && (
        <section className="pb-12">
          <div className="container-custom">
            <h3 className="text-sm font-bold text-primary-700 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Previous Commentaries
            </h3>

            <div className="space-y-3">
              {previousCommentaries.map((commentary) => {
                const isOpen = expandedCommentary === commentary.id;
                return (
                  <div
                    key={commentary.id}
                    className="rounded-xl bg-white shadow-card border border-surface-200 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedCommentary(isOpen ? null : commentary.id)
                      }
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-primary-700 truncate">
                            {commentary.title}
                          </h4>
                          <span className="text-xs text-slate-400">
                            {commentary.weekRange}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span
                          className={cn(
                            'text-[10px] font-semibold px-2.5 py-0.5 rounded-full border hidden sm:inline-block',
                            outlookColor(commentary.outlook)
                          )}
                        >
                          {commentary.outlook}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 space-y-4 border-t border-surface-200 pt-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {commentary.summary}
                        </p>

                        <ul className="space-y-2">
                          {commentary.keyPoints.map((point, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed"
                            >
                              <div className="w-1 h-1 rounded-full bg-brand mt-1.5 shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>

                        <div className="rounded-lg bg-accent-50/60 border border-accent-200/40 p-4">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-accent-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-accent-800/80 leading-relaxed">
                              {commentary.sipAdvice}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  5. Market Insights Grid                                      */}
      {/* ============================================================ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-display-sm text-primary-700 mb-2">Market Insights</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Curated insights on market trends, SIP strategy, and investor education to
              help you make informed decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allInsights.map((insight) => {
              const Icon = resolveIcon(insight.icon);
              const isExpanded = expandedInsights.has(insight.id);
              const needsTruncation = insight.content.length > 200;
              const displayContent =
                isExpanded || !needsTruncation
                  ? insight.content
                  : insight.content.slice(0, 200) + '...';

              return (
                <div
                  key={insight.id}
                  className="rounded-xl bg-surface-100 shadow-card border border-surface-200 overflow-hidden flex flex-col"
                >
                  {/* Gradient top border */}
                  <div className={cn('h-1 bg-gradient-to-r', insight.color)} />

                  <div className="p-5 flex flex-col flex-1">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0',
                          insight.color
                        )}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-primary-700 leading-snug mb-1">
                          {insight.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              categoryBadge(insight.category)
                            )}
                          >
                            {insight.category}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(insight.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-xs text-slate-600 leading-relaxed flex-1">
                      {displayContent}
                    </p>

                    {/* Expand toggle */}
                    {needsTruncation && (
                      <button
                        onClick={() => toggleInsight(insight.id)}
                        className="mt-3 text-xs font-medium text-brand flex items-center gap-1 hover:gap-2 transition-all self-start"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ArrowRight className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  6. SIP Timing Insights                                       */}
      {/* ============================================================ */}
      <section className="section-padding bg-gradient-to-br from-surface-100 to-brand-50/40">
        <div className="container-custom">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-brand/10 rounded-full px-4 py-1.5 text-xs font-medium mb-4 text-brand">
              <Clock className="w-3.5 h-3.5" />
              SIP Timing Insights
            </div>
            <h2 className="text-display-sm text-primary-700 mb-2">
              When Should You Start or Stop Your SIP?
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Evidence-based answers to the most common SIP timing questions. Spoiler: time
              in the market beats timing the market.
            </p>
          </div>

          <div className="space-y-6 max-w-3xl mx-auto">
            {sipTimingInsights.map((insight, idx) => {
              const Icon = resolveIcon(insight.icon);
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-white shadow-card border border-surface-200 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-primary-700 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-primary-700 mb-2">
                        {insight.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">
                        {insight.description}
                      </p>

                      {/* Recommendation box */}
                      <div className="rounded-lg bg-positive-50/60 border border-positive/20 px-4 py-3 flex items-start gap-3">
                        <Lightbulb className="w-4 h-4 text-positive shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-positive-700 leading-relaxed">
                          {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  7. Disclaimer Banner                                         */}
      {/* ============================================================ */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <div className="flex items-center justify-center gap-3 text-center">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Market data shown is illustrative/sample only. Not real-time. All information
              is for educational purposes and should not be construed as investment advice.
              Past performance does not guarantee future returns.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
