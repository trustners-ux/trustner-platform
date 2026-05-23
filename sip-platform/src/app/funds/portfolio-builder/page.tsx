'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, PlusCircle, Trash2, Wand2, RefreshCw, Share2, Download,
  AlertTriangle, CheckCircle2, MessageCircle, Sparkles, Search,
  TrendingUp, Target, Layers, Shield, IndianRupee, X, Copy, Check,
  FileDown, Loader2,
} from 'lucide-react';
import { generatePortfolioPDF } from '@/lib/utils/portfolio-pdf';
import { PortfolioCompareTable } from '@/components/funds/PortfolioCompareTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils/cn';
import { formatINR } from '@/lib/utils/formatters';
import { CURRENT_TRUSTNER_LIST } from '@/data/funds/trustner';
import {
  buildFundLookup,
  computePortfolioMetrics,
  computeCategoryAllocation,
  computeCapBuckets,
  validatePortfolio,
  ALLOCATION_TEMPLATES,
  buildPortfolioFromTemplate,
  requiredSIP,
  futureValueOfSIP,
  encodePortfolioToURL,
  decodePortfolioFromURL,
  type PortfolioHolding,
  type AllocationTemplate,
} from '@/lib/utils/portfolio-builder';
import type { TrustnerCuratedFund } from '@/types/funds';

const PIE_COLORS = ['#0F766E', '#0EA5E9', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#EF4444', '#6366F1', '#14B8A6'];

function PortfolioBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lookup = useMemo(() => buildFundLookup(CURRENT_TRUSTNER_LIST), []);

  // ─── State ───
  const [portfolioName, setPortfolioName] = useState('My Portfolio');
  const [goalAmount, setGoalAmount] = useState(10000000); // ₹1 Cr
  const [horizonYears, setHorizonYears] = useState(10);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  // ─── Decode portfolio from URL on mount ───
  useEffect(() => {
    const encoded = searchParams.get('p');
    if (encoded) {
      const decoded = decodePortfolioFromURL(encoded);
      if (decoded) {
        setHoldings(decoded.holdings);
        if (decoded.meta?.name) setPortfolioName(decoded.meta.name);
        if (decoded.meta?.goalAmount) setGoalAmount(decoded.meta.goalAmount);
        if (decoded.meta?.horizonYears) setHorizonYears(decoded.meta.horizonYears);
      }
    } else {
      // Default starter: load Balanced template
      const startTemplate = ALLOCATION_TEMPLATES.find((t) => t.id === 'balanced');
      if (startTemplate) setHoldings(buildPortfolioFromTemplate(startTemplate, CURRENT_TRUSTNER_LIST));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Derived metrics ───
  const metrics = useMemo(() => computePortfolioMetrics(holdings, lookup), [holdings, lookup]);
  const categoryAlloc = useMemo(() => computeCategoryAllocation(holdings, lookup), [holdings, lookup]);
  const capBuckets = useMemo(() => computeCapBuckets(holdings, lookup), [holdings, lookup]);
  const issues = useMemo(() => validatePortfolio(holdings, lookup), [holdings, lookup]);

  const requiredMonthlySIP = useMemo(
    () => requiredSIP(goalAmount, horizonYears, metrics.weightedReturn5Y || metrics.weightedReturn3Y || 0.10),
    [goalAmount, horizonYears, metrics.weightedReturn5Y, metrics.weightedReturn3Y],
  );

  const futureValueAtSIP = useMemo(
    () => futureValueOfSIP(requiredMonthlySIP, horizonYears, metrics.weightedReturn5Y || metrics.weightedReturn3Y || 0.10),
    [requiredMonthlySIP, horizonYears, metrics.weightedReturn5Y, metrics.weightedReturn3Y],
  );

  // ─── Helpers ───
  const addFund = useCallback((fundId: string) => {
    setHoldings((prev) => {
      if (prev.some((h) => h.fundId === fundId)) return prev;
      // Default new fund weight: 10% (deducted proportionally from others)
      const newWeight = 10;
      const remaining = 100 - newWeight;
      const currentTotal = prev.reduce((s, h) => s + h.weight, 0);
      const scaled = currentTotal > 0
        ? prev.map((h) => ({ ...h, weight: (h.weight / currentTotal) * remaining }))
        : prev;
      return [...scaled, { fundId, weight: newWeight }];
    });
    setShowSearch(false);
    setSearchQuery('');
  }, []);

  const removeFund = useCallback((fundId: string) => {
    setHoldings((prev) => {
      const filtered = prev.filter((h) => h.fundId !== fundId);
      if (filtered.length === 0) return [];
      const total = filtered.reduce((s, h) => s + h.weight, 0);
      // Renormalise to 100
      return filtered.map((h) => ({ ...h, weight: (h.weight / total) * 100 }));
    });
  }, []);

  const updateWeight = useCallback((fundId: string, weight: number) => {
    setHoldings((prev) => prev.map((h) => h.fundId === fundId ? { ...h, weight } : h));
  }, []);

  const rebalanceTo100 = useCallback(() => {
    setHoldings((prev) => {
      const total = prev.reduce((s, h) => s + h.weight, 0);
      if (total === 0) return prev;
      return prev.map((h) => ({ ...h, weight: Math.round((h.weight / total) * 1000) / 10 }));
    });
  }, []);

  const applyTemplate = useCallback((template: AllocationTemplate) => {
    if (!confirm(`Replace your current portfolio with the "${template.name}" template?`)) return;
    setHoldings(buildPortfolioFromTemplate(template, CURRENT_TRUSTNER_LIST));
  }, []);

  const sharePortfolio = useCallback(() => {
    const encoded = encodePortfolioToURL(holdings, {
      name: portfolioName,
      goalAmount,
      horizonYears,
      sip: requiredMonthlySIP,
    });
    const url = `${window.location.origin}/funds/portfolio-builder?p=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    });
  }, [holdings, portfolioName, goalAmount, horizonYears, requiredMonthlySIP]);

  const downloadPDF = useCallback(async () => {
    if (downloading || holdings.length === 0) return;
    setDownloading(true);
    try {
      await generatePortfolioPDF({
        portfolioName,
        goalAmount,
        horizonYears,
        requiredMonthlySIP,
        futureValueAtSIP,
        holdings,
        fundLookup: lookup,
        metrics,
        categoryAlloc,
        capBuckets,
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [downloading, holdings, portfolioName, goalAmount, horizonYears, requiredMonthlySIP, futureValueAtSIP, lookup, metrics, categoryAlloc, capBuckets]);

  const whatsAppLink = useMemo(() => {
    const fundLines = holdings
      .map((h) => {
        const f = lookup.get(h.fundId);
        return f ? `• ${f.name} — ${h.weight.toFixed(1)}%` : '';
      })
      .filter(Boolean)
      .join('\n');
    const msg = `Hi Trustner team,\n\nI built this model portfolio on merasip.com and would like help executing it:\n\n*${portfolioName}*\nGoal: ${formatINR(goalAmount)} in ${horizonYears} years\nMonthly SIP: ${formatINR(requiredMonthlySIP)}\n\n${fundLines}\n\nPlease guide me on the next steps.`;
    return `https://wa.me/916003903737?text=${encodeURIComponent(msg)}`;
  }, [holdings, lookup, portfolioName, goalAmount, horizonYears, requiredMonthlySIP]);

  // ─── Search results ───
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const all: TrustnerCuratedFund[] = [];
    for (const cat of CURRENT_TRUSTNER_LIST.categories) {
      for (const f of cat.funds) {
        if (f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)) {
          all.push(f);
        }
      }
    }
    return all.slice(0, 12);
  }, [searchQuery]);

  const totalWeight = metrics.totalWeight;
  const isValid = !issues.some((i) => i.level === 'error');

  // ─── Render ───
  return (
    <>
      {/* Header */}
      <section className="bg-hero-pattern text-white">
        <div className="container-custom py-10 lg:py-14">
          <Link href="/funds" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Funds
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Layers className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-accent mb-1">New &middot; Innovative</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Model Portfolio Builder</h1>
              <p className="text-slate-300 mt-1 text-sm sm:text-base">
                Build a multi-fund portfolio, see weighted returns, risk &amp; allocation in real-time, then hand it to your Trustner Relationship Manager.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom">

          {/* ─── Goal Setup Bar ─── */}
          <div className="card-base p-5 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Portfolio Name</label>
              <input
                type="text"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm font-semibold text-primary-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Goal (₹)</label>
              <input
                type="number"
                value={goalAmount}
                onChange={(e) => setGoalAmount(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm font-semibold text-primary-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
                step={100000}
                min={100000}
              />
              <p className="text-[10px] text-slate-400 mt-1">{formatINR(goalAmount)}</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Horizon (Years)</label>
              <input
                type="number"
                value={horizonYears}
                onChange={(e) => setHorizonYears(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm font-semibold text-primary-700 focus:outline-none focus:ring-2 focus:ring-brand/30"
                min={1}
                max={40}
              />
            </div>
            <div className="bg-gradient-to-br from-brand-50 to-emerald-50 rounded-lg p-3 flex flex-col justify-center">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Required Monthly SIP</p>
              <p className="text-2xl font-extrabold gradient-text">{formatINR(requiredMonthlySIP)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">at this portfolio&rsquo;s expected return</p>
            </div>
          </div>

          {/* ─── Templates Bar ─── */}
          <div className="card-base p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-bold text-primary-700">Quick-Start Templates</h2>
              <span className="text-[10px] text-slate-400">Apply a template, then customise.</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ALLOCATION_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="text-left rounded-xl border border-surface-300 p-3 hover:border-brand hover:bg-brand-50/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-primary-700">{t.name}</span>
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded',
                      t.riskLevel === 'Conservative' && 'bg-green-100 text-green-700',
                      t.riskLevel === 'Moderate' && 'bg-blue-100 text-blue-700',
                      t.riskLevel === 'Aggressive' && 'bg-amber-100 text-amber-700',
                      t.riskLevel === 'Very Aggressive' && 'bg-red-100 text-red-700',
                    )}>
                      {t.riskLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Two-column main layout */}
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">

            {/* LEFT — Portfolio composition */}
            <div className="space-y-6">

              {/* Holdings list */}
              <div className="card-base p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand" />
                    <h2 className="text-sm font-bold text-primary-700">Portfolio Holdings</h2>
                    <span className="text-[10px] text-slate-400">{holdings.length} fund{holdings.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={rebalanceTo100}
                      disabled={Math.abs(totalWeight - 100) < 0.5}
                      className="text-[11px] font-semibold text-brand-700 px-2.5 py-1 rounded-md border border-brand-200 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Rebalance to 100%
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSearch(true)}
                      className="text-[11px] font-semibold text-white bg-brand px-2.5 py-1 rounded-md hover:bg-brand-700 flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" /> Add Fund
                    </button>
                  </div>
                </div>

                {/* Allocation bar */}
                {holdings.length > 0 && (
                  <div className="mb-4">
                    <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 mb-2">
                      {holdings.map((h, i) => (
                        <div
                          key={h.fundId}
                          className="h-full transition-all"
                          style={{
                            width: `${h.weight}%`,
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Total Allocation</span>
                      <span className={cn(
                        'font-bold',
                        Math.abs(totalWeight - 100) < 0.5 ? 'text-emerald-700' : 'text-amber-700',
                      )}>
                        {totalWeight.toFixed(1)}% / 100%
                      </span>
                    </div>
                  </div>
                )}

                {/* Holdings rows */}
                <div className="space-y-2">
                  {holdings.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-500">
                      No funds yet. Pick a template above or click <span className="font-semibold">Add Fund</span> to begin.
                    </div>
                  ) : (
                    holdings.map((h, i) => {
                      const fund = lookup.get(h.fundId);
                      if (!fund) return null;
                      return (
                        <div key={h.fundId} className="group rounded-lg border border-surface-300 hover:border-brand-300 transition-colors p-3">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <Link href={`/funds/${fund.id}`} className="text-sm font-semibold text-primary-700 hover:text-brand-700 truncate" target="_blank" rel="noopener">
                                  {fund.name}
                                </Link>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 ml-4">
                                <span className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-medium">{fund.category}</span>
                                <span>3Y: <span className={cn('font-semibold', fund.returns.threeYear >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                                  {(fund.returns.threeYear * 100).toFixed(1)}%
                                </span></span>
                                <span>5Y: <span className={cn('font-semibold', fund.returns.fiveYear >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                                  {(fund.returns.fiveYear * 100).toFixed(1)}%
                                </span></span>
                                <span>TER: <span className="font-medium">{(fund.ter * 100).toFixed(2)}%</span></span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFund(h.fundId)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Remove fund"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={h.weight}
                              onChange={(e) => updateWeight(h.fundId, Number(e.target.value))}
                              className="flex-1 accent-brand"
                            />
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={Math.round(h.weight * 10) / 10}
                              onChange={(e) => updateWeight(h.fundId, Number(e.target.value) || 0)}
                              className="w-20 px-2 py-1 rounded border border-surface-300 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-brand/30"
                            />
                            <span className="text-xs text-slate-400">%</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Issues */}
              {issues.length > 0 && (
                <div className="card-base p-4 space-y-2">
                  {issues.map((issue, idx) => (
                    <div key={idx} className={cn(
                      'flex items-start gap-2 text-sm',
                      issue.level === 'error' && 'text-red-700',
                      issue.level === 'warning' && 'text-amber-700',
                      issue.level === 'info' && 'text-blue-700',
                    )}>
                      {issue.level === 'error'
                        ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        : issue.level === 'warning'
                          ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Allocation Visuals */}
              {holdings.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Category pie */}
                  <div className="card-base p-5">
                    <h3 className="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand" /> Category Mix
                    </h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryAlloc}
                            dataKey="weight"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={75}
                            labelLine={false}
                          >
                            {categoryAlloc.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => `${value.toFixed(1)}%`}
                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {categoryAlloc.map((c, i) => (
                        <div key={c.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-slate-600">{c.category}</span>
                          </div>
                          <span className="font-semibold text-primary-700">{c.weight.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cap-bucket bars */}
                  <div className="card-base p-5">
                    <h3 className="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-brand" /> Cap Allocation
                    </h3>
                    <p className="text-[10px] text-slate-400 mb-3">Estimated split based on category mandates (SEBI norms).</p>
                    <div className="space-y-2">
                      {capBuckets.map((b) => (
                        <div key={b.bucket}>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-600 font-medium">{b.bucket}</span>
                            <span className="font-bold text-primary-700">{b.weight.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, b.weight)}%`,
                                backgroundColor: PIE_COLORS[capBuckets.indexOf(b) % PIE_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — Metrics + Actions */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">

              {/* Weighted Metrics */}
              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand" /> Portfolio Metrics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="1Y Return" value={`${metrics.return1YPct.toFixed(2)}%`} good={metrics.return1YPct > 0} />
                  <Stat label="3Y CAGR" value={`${metrics.return3YPct.toFixed(2)}%`} good={metrics.return3YPct > 0} />
                  <Stat label="5Y CAGR" value={`${metrics.return5YPct.toFixed(2)}%`} good={metrics.return5YPct > 0} />
                  <Stat label="Avg TER" value={`${metrics.terPct.toFixed(2)}%`} />
                  <Stat label="Std Deviation" value={`${metrics.stdDevPct.toFixed(2)}%`} />
                  <Stat label="Sharpe Ratio" value={metrics.weightedSharpe.toFixed(2)} good={metrics.weightedSharpe > 0.5} />
                </div>
              </div>

              {/* SIP Projection */}
              <div className="card-base p-5 bg-gradient-to-br from-brand-50/30 to-emerald-50/30">
                <h3 className="text-sm font-bold text-primary-700 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand" /> Goal Projection
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target</span>
                    <span className="font-bold text-primary-700">{formatINR(goalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Horizon</span>
                    <span className="font-bold text-primary-700">{horizonYears} years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Expected return (5Y)</span>
                    <span className="font-bold text-primary-700">{(metrics.weightedReturn5Y * 100).toFixed(2)}% p.a.</span>
                  </div>
                  <div className="border-t border-surface-300 pt-3 flex items-center justify-between">
                    <span className="text-slate-700 font-semibold">Required SIP</span>
                    <span className="text-xl font-extrabold gradient-text">{formatINR(requiredMonthlySIP)}/month</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">FV at this SIP</span>
                    <span className="font-semibold text-emerald-700">{formatINR(futureValueAtSIP)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="card-base p-5 space-y-2">
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-colors',
                    isValid && holdings.length > 0
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed',
                  )}
                  onClick={(e) => { if (!isValid || holdings.length === 0) e.preventDefault(); }}
                >
                  <MessageCircle className="w-4 h-4" /> Get this Built by Trustner RM
                </a>
                <button
                  type="button"
                  onClick={downloadPDF}
                  disabled={!isValid || holdings.length === 0 || downloading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  {downloading ? 'Generating PDF…' : 'Download as PDF'}
                </button>
                <button
                  type="button"
                  onClick={sharePortfolio}
                  disabled={holdings.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold border border-brand-300 text-brand-700 hover:bg-brand-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {shareCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  {shareCopied ? 'Link copied!' : 'Share Portfolio Link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompare((v) => !v);
                    if (!showCompare) {
                      // Smooth-scroll to the comparison panel after it renders
                      setTimeout(() => {
                        document.getElementById('portfolio-compare-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }
                  }}
                  disabled={holdings.length === 0}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors',
                    holdings.length > 0 ? 'border border-slate-300 text-slate-700 hover:bg-slate-50' : 'border border-slate-200 text-slate-400 cursor-not-allowed',
                  )}
                >
                  <Layers className="w-4 h-4" />
                  {showCompare ? 'Hide' : 'Compare'} these {holdings.length} fund{holdings.length === 1 ? '' : 's'}
                </button>
              </div>

              {/* Disclosure */}
              <div className="text-[10px] text-slate-400 leading-relaxed px-1">
                Weighted metrics use simple weight-sum aggregation. Standard deviation
                ignores cross-fund covariance and is an approximation. Past performance
                is not indicative of future returns. This tool is for educational
                planning — execution requires your Trustner Relationship Manager.
              </div>
            </div>

          </div>

          {/* Inline rich comparison panel — toggled by "Compare these N funds" button */}
          {showCompare && holdings.length > 0 && (
            <div id="portfolio-compare-panel" className="mt-6">
              <PortfolioCompareTable
                funds={holdings.map((h) => lookup.get(h.fundId)).filter((f): f is NonNullable<typeof f> => Boolean(f))}
                onClose={() => setShowCompare(false)}
              />
            </div>
          )}

          {/* Search modal */}
          {showSearch && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4" onClick={() => setShowSearch(false)}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-surface-200 flex items-center gap-3">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search by fund name or category…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-sm focus:outline-none"
                  />
                  <button onClick={() => setShowSearch(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-400">
                      {searchQuery.trim() ? 'No funds match.' : 'Start typing to search Trustner\'s 130 curated funds.'}
                    </div>
                  ) : (
                    <ul className="divide-y divide-surface-200">
                      {searchResults.map((f) => {
                        const already = holdings.some((h) => h.fundId === f.id);
                        return (
                          <li key={f.id}>
                            <button
                              type="button"
                              onClick={() => {
                                if (already) {
                                  removeFund(f.id);
                                } else {
                                  addFund(f.id);
                                }
                              }}
                              className={cn(
                                'w-full text-left p-3 transition-colors flex items-center justify-between group',
                                already
                                  ? 'bg-emerald-50/50 hover:bg-rose-50/60'
                                  : 'hover:bg-brand-50/50',
                              )}
                              title={already ? 'Already in portfolio — click to remove' : 'Add to portfolio'}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-primary-700 truncate">{f.name}</span>
                                  {already && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 shrink-0">
                                      In Portfolio
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                                  <span className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-medium">{f.category}</span>
                                  <span>3Y: <span className="font-semibold text-emerald-700">{(f.returns.threeYear * 100).toFixed(1)}%</span></span>
                                  <span>5Y: <span className="font-semibold text-emerald-700">{(f.returns.fiveYear * 100).toFixed(1)}%</span></span>
                                  {already && (
                                    <span className="text-rose-600 group-hover:font-semibold transition-all">
                                      Click to remove
                                    </span>
                                  )}
                                </div>
                              </div>
                              {already ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 group-hover:hidden" />
                              ) : (
                                <PlusCircle className="w-5 h-5 text-brand shrink-0" />
                              )}
                              {already && (
                                <X className="w-5 h-5 text-rose-500 shrink-0 hidden group-hover:block" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-lg border border-surface-300 p-2.5 bg-white">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={cn(
        'text-lg font-extrabold mt-0.5',
        good === true && 'text-emerald-700',
        good === false && 'text-red-600',
        good === undefined && 'text-primary-700',
      )}>{value}</p>
    </div>
  );
}

export default function PortfolioBuilderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading portfolio builder…</div>}>
      <PortfolioBuilderInner />
    </Suspense>
  );
}
