'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  TrendingUp, Download, Plus, ChevronDown, ChevronRight, Edit3,
  Trash2, Upload, FileText, Database, BarChart3, Award, Users,
  ClipboardList, Eye, Hash, RefreshCw, Clock, CheckCircle2, AlertTriangle,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CURRENT_TRUSTNER_LIST } from '@/data/funds/trustner';
import { generateCategoryFile, generateIndexFile } from '@/lib/admin/fund-export';
import { FundBulkImport } from '@/components/admin/FundBulkImport';
import { FundEditor } from '@/components/admin/FundEditor';
import type { TrustnerCuratedFund, TrustnerFundCategory, FundCategory, TrustnerFundList, NavUpdateResult, FundNavData } from '@/types/funds';

// ─── Tab type ───

type ActiveTab = 'bulk' | 'manual';

// ─── Component ───

export default function FundDataManagerPage() {
  // Core state: working copy of the full fund list
  const [workingList, setWorkingList] = useState<TrustnerFundList>(() => ({
    ...CURRENT_TRUSTNER_LIST,
    categories: CURRENT_TRUSTNER_LIST.categories.map((cat) => ({
      ...cat,
      funds: [...cat.funds],
    })),
  }));

  const [activeTab, setActiveTab] = useState<ActiveTab>('bulk');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingFund, setEditingFund] = useState<{
    fund: TrustnerCuratedFund;
    categoryName: FundCategory;
  } | null>(null);
  const [addingToCategory, setAddingToCategory] = useState<FundCategory | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // NAV update state
  const [navData, setNavData] = useState<NavUpdateResult | null>(null);
  const [navLoading, setNavLoading] = useState(false);
  const [navError, setNavError] = useState<string | null>(null);
  const [navFetched, setNavFetched] = useState(false);

  // ── Derived data ──

  const totalFunds = useMemo(
    () => workingList.categories.reduce((sum, cat) => sum + cat.funds.length, 0),
    [workingList]
  );

  const monthYear = `${workingList.month} ${workingList.year}`;

  // ── Fetch existing NAV data on mount ──

  const fetchNavData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/funds/update-nav');
      if (res.ok) {
        const data = await res.json();
        if (data.updatedAt) {
          setNavData(data);
        }
      }
    } catch {
      // Silently fail — NAV data is optional
    } finally {
      setNavFetched(true);
    }
  }, []);

  // Fetch on mount
  useState(() => { fetchNavData(); });

  // ── Trigger NAV update ──

  const handleNavUpdate = useCallback(async () => {
    setNavLoading(true);
    setNavError(null);
    try {
      const res = await fetch('/api/admin/funds/update-nav', {
        method: 'POST',
        headers: { 'x-admin-email': 'admin@trustner.in' },
      });
      const data = await res.json();
      if (!res.ok) {
        setNavError(data.error || 'NAV update failed');
        return;
      }
      // Refetch stored data
      await fetchNavData();
      setImportSuccess(`NAV updated for ${data.successCount}/${data.totalFunds} funds${data.failedCount > 0 ? ` (${data.failedCount} failed)` : ''}`);
      setTimeout(() => setImportSuccess(null), 8000);
    } catch (err) {
      setNavError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setNavLoading(false);
    }
  }, [fetchNavData]);

  // ── Get NAV data for a specific fund ──

  const getNavForFund = useCallback((schemeCode?: number): FundNavData | undefined => {
    if (!navData?.funds || !schemeCode) return undefined;
    return navData.funds.find(f => f.schemeCode === schemeCode);
  }, [navData]);

  // ── Category expand/collapse ──

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  // ── Bulk import handler ──

  const handleBulkImport = useCallback(
    (funds: TrustnerCuratedFund[], category: FundCategory) => {
      setWorkingList((prev) => {
        const updated = { ...prev, categories: prev.categories.map((cat) => ({ ...cat, funds: [...cat.funds] })) };

        const catIdx = updated.categories.findIndex((c) => c.name === category);
        if (catIdx >= 0) {
          // Replace all funds in this category
          updated.categories[catIdx] = {
            ...updated.categories[catIdx],
            funds: funds,
            hasSkinInTheGame: funds.some((f) => f.skinInTheGame),
          };
        } else {
          // Add new category
          const displayName = category + ' Funds';
          updated.categories.push({
            name: category,
            displayName,
            hasSkinInTheGame: funds.some((f) => f.skinInTheGame),
            funds,
          });
        }

        return updated;
      });

      // Expand the category to show results
      setExpandedCategories((prev) => new Set([...prev, category]));
      setImportSuccess(`Successfully imported ${funds.length} funds into ${category}`);
      setTimeout(() => setImportSuccess(null), 5000);
    },
    []
  );

  // ── Add/Edit fund handlers ──

  const handleAddFund = useCallback(
    (fund: TrustnerCuratedFund) => {
      if (!addingToCategory) return;

      setWorkingList((prev) => {
        const updated = { ...prev, categories: prev.categories.map((cat) => ({ ...cat, funds: [...cat.funds] })) };
        const catIdx = updated.categories.findIndex((c) => c.name === addingToCategory);
        if (catIdx >= 0) {
          updated.categories[catIdx].funds.push(fund);
          updated.categories[catIdx].hasSkinInTheGame =
            updated.categories[catIdx].hasSkinInTheGame || !!fund.skinInTheGame;
        }
        return updated;
      });

      setAddingToCategory(null);
      setExpandedCategories((prev) => new Set([...prev, addingToCategory]));
    },
    [addingToCategory]
  );

  const handleEditFund = useCallback(
    (updatedFund: TrustnerCuratedFund) => {
      if (!editingFund) return;

      setWorkingList((prev) => {
        const updated = { ...prev, categories: prev.categories.map((cat) => ({ ...cat, funds: [...cat.funds] })) };
        const catIdx = updated.categories.findIndex((c) => c.name === editingFund.categoryName);
        if (catIdx >= 0) {
          const fundIdx = updated.categories[catIdx].funds.findIndex((f) => f.id === editingFund.fund.id);
          if (fundIdx >= 0) {
            updated.categories[catIdx].funds[fundIdx] = updatedFund;
          }
        }
        return updated;
      });

      setEditingFund(null);
    },
    [editingFund]
  );

  const handleDeleteFund = useCallback((categoryName: FundCategory, fundId: string) => {
    if (!confirm('Are you sure you want to remove this fund?')) return;

    setWorkingList((prev) => {
      const updated = { ...prev, categories: prev.categories.map((cat) => ({ ...cat, funds: [...cat.funds] })) };
      const catIdx = updated.categories.findIndex((c) => c.name === categoryName);
      if (catIdx >= 0) {
        updated.categories[catIdx].funds = updated.categories[catIdx].funds.filter((f) => f.id !== fundId);
      }
      return updated;
    });
  }, []);

  // ── Export handler ──

  const handleExport = useCallback(() => {
    const zip: Record<string, string> = {};

    workingList.categories.forEach((cat) => {
      const fileName = cat.name.toLowerCase().replace(/[&\s]+/g, '-').replace(/-+/g, '-') + '.ts';
      zip[fileName] = generateCategoryFile(cat);
    });

    zip['index.ts'] = generateIndexFile(
      workingList.categories,
      workingList.month,
      workingList.year
    );

    // Create a downloadable text file with all the generated code
    const output = Object.entries(zip)
      .map(([fileName, content]) => {
        return `// ═══════════════════════════════════════════\n// FILE: ${fileName}\n// ═══════════════════════════════════════════\n\n${content}`;
      })
      .join('\n\n');

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustner-funds-${workingList.month.toLowerCase()}-${workingList.year}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [workingList]);

  // ── If editing or adding a fund, show the editor ──

  if (editingFund) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Edit Fund</h1>
          <p className="text-sm text-slate-500">
            Editing: {editingFund.fund.name} in {editingFund.categoryName}
          </p>
        </div>
        <FundEditor
          fund={editingFund.fund}
          category={editingFund.categoryName}
          onSubmit={handleEditFund}
          onCancel={() => setEditingFund(null)}
        />
      </div>
    );
  }

  if (addingToCategory) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Add Fund</h1>
          <p className="text-sm text-slate-500">Adding new fund to {addingToCategory}</p>
        </div>
        <FundEditor
          category={addingToCategory}
          onSubmit={handleAddFund}
          onCancel={() => setAddingToCategory(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Fund Data Manager</h1>
          <p className="text-sm text-slate-500">
            Trustner Curated Fund Selection — {monthYear} | Data as on {workingList.dataAsOn}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-700 text-white hover:bg-primary-800 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Export TypeScript
        </button>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand" />
            </div>
            <span className="text-xs text-slate-500">Total Funds</span>
          </div>
          <div className="text-2xl font-extrabold text-primary-700">{totalFunds}</div>
        </div>
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-slate-500">Categories</span>
          </div>
          <div className="text-2xl font-extrabold text-primary-700">{workingList.categories.length}</div>
        </div>
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-slate-500">Rank #1 Funds</span>
          </div>
          <div className="text-2xl font-extrabold text-primary-700">
            {workingList.categories.filter((c) => c.funds.some((f) => f.rank === 1)).length}
          </div>
        </div>
        <div className="card-base p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-positive-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-positive" />
            </div>
            <span className="text-xs text-slate-500">With Skin in Game</span>
          </div>
          <div className="text-2xl font-extrabold text-primary-700">
            {workingList.categories.filter((c) => c.hasSkinInTheGame).length}
          </div>
        </div>
      </div>

      {/* ── NAV Auto-Update Section ── */}
      <div className="card-base p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-700">NAV Performance Data</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Auto-fetch latest NAV from MFAPI and calculate 1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, YTD returns for all {totalFunds} funds.
              </p>
              {navData?.updatedAt && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  Last updated: {new Date(navData.updatedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  {navData.successCount > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      {navData.successCount}/{navData.totalFunds}
                    </span>
                  )}
                  {navData.failedCount > 0 && (
                    <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">
                      <AlertTriangle className="w-3 h-3" />
                      {navData.failedCount} failed
                    </span>
                  )}
                </div>
              )}
              {navError && (
                <p className="text-xs text-negative mt-1.5">{navError}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleNavUpdate}
            disabled={navLoading}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0',
              navLoading
                ? 'bg-surface-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', navLoading && 'animate-spin')} />
            {navLoading ? 'Updating NAVs...' : 'Update NAV Data'}
          </button>
        </div>
      </div>

      {/* ── Import Success Banner ── */}
      {importSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-positive-50 border border-positive/20 text-positive text-sm font-medium animate-fade-in">
          <TrendingUp className="w-4 h-4" />
          {importSuccess}
        </div>
      )}

      {/* ── Tabs: Bulk Import / Manual Entry ── */}
      <div className="flex gap-1 p-1 bg-surface-200 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('bulk')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all',
            activeTab === 'bulk'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-primary-700'
          )}
        >
          <Upload className="w-4 h-4" />
          Bulk Import
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all',
            activeTab === 'manual'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-primary-700'
          )}
        >
          <FileText className="w-4 h-4" />
          Manual Entry
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'bulk' && (
        <FundBulkImport onImport={handleBulkImport} />
      )}

      {activeTab === 'manual' && (
        <div className="card-base p-5">
          <p className="text-sm text-slate-500 mb-4">
            Select a category below and click the <strong>+</strong> button to add a fund manually, or click the edit icon on any existing fund.
          </p>
        </div>
      )}

      {/* ── Category View ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
            All Categories ({workingList.categories.length})
          </h2>
          <button
            onClick={() => {
              if (expandedCategories.size === workingList.categories.length) {
                setExpandedCategories(new Set());
              } else {
                setExpandedCategories(new Set(workingList.categories.map((c) => c.name)));
              }
            }}
            className="text-xs font-semibold text-brand hover:underline"
          >
            {expandedCategories.size === workingList.categories.length ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        <div className="space-y-3">
          {workingList.categories.map((cat) => {
            const isExpanded = expandedCategories.has(cat.name);
            const sortedFunds = [...cat.funds].sort((a, b) => a.rank - b.rank);

            return (
              <div key={cat.name} className="card-base overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.name)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <div className="text-left">
                      <div className="text-sm font-bold text-primary-700">{cat.displayName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {cat.funds.length} funds
                        {cat.hasSkinInTheGame && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-brand-50 text-brand font-semibold">
                            SITG
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingToCategory(cat.name);
                      }}
                      className="p-1.5 rounded-lg text-brand bg-brand-50 hover:bg-brand-100 transition-all"
                      title={`Add fund to ${cat.displayName}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>

                {/* Expanded fund list */}
                {isExpanded && (
                  <div className="border-t border-surface-200">
                    {sortedFunds.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-slate-400">
                        No funds in this category yet. Click + to add one.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-surface-50 border-b border-surface-200">
                              <th className="text-left py-2.5 px-4 text-slate-500 font-medium">
                                <Hash className="w-3 h-3 inline mr-1" />Rank
                              </th>
                              <th className="text-left py-2.5 px-4 text-slate-500 font-medium min-w-[220px]">Fund Name</th>
                              <th className="text-left py-2.5 px-4 text-slate-500 font-medium">Manager</th>
                              <th className="text-right py-2.5 px-4 text-slate-500 font-medium">AUM (Cr)</th>
                              <th className="text-right py-2.5 px-4 text-slate-500 font-medium">TER</th>
                              <th className="text-right py-2.5 px-4 text-slate-500 font-medium">1Y</th>
                              <th className="text-right py-2.5 px-4 text-slate-500 font-medium">3Y</th>
                              <th className="text-right py-2.5 px-4 text-slate-500 font-medium">5Y</th>
                              <th className="text-right py-2.5 px-4 text-slate-500 font-medium">Sharpe</th>
                              {navData?.funds && navData.funds.length > 0 && (
                                <>
                                  <th className="text-right py-2.5 px-4 text-emerald-600 font-medium bg-emerald-50/50">NAV</th>
                                  <th className="text-right py-2.5 px-4 text-emerald-600 font-medium bg-emerald-50/50">1M</th>
                                  <th className="text-right py-2.5 px-4 text-emerald-600 font-medium bg-emerald-50/50">3M</th>
                                  <th className="text-right py-2.5 px-4 text-emerald-600 font-medium bg-emerald-50/50">6M</th>
                                  <th className="text-right py-2.5 px-4 text-emerald-600 font-medium bg-emerald-50/50">10Y</th>
                                </>
                              )}
                              <th className="text-center py-2.5 px-4 text-slate-500 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedFunds.map((fund) => (
                              <tr key={fund.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                                <td className="py-2.5 px-4">
                                  <span
                                    className={cn(
                                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold',
                                      fund.rank === 1
                                        ? 'bg-amber-100 text-amber-700'
                                        : fund.rank === 2
                                        ? 'bg-slate-100 text-slate-600'
                                        : fund.rank === 3
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-surface-200 text-slate-500'
                                    )}
                                  >
                                    {fund.rank}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4">
                                  <div className="font-medium text-primary-700 leading-tight">{fund.name}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{fund.id}</div>
                                </td>
                                <td className="py-2.5 px-4 text-slate-600">{fund.fundManager}</td>
                                <td className="py-2.5 px-4 text-right text-slate-600">
                                  {fund.aumCr.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-4 text-right text-slate-600">
                                  {(fund.ter * 100).toFixed(2)}%
                                </td>
                                <td
                                  className={cn(
                                    'py-2.5 px-4 text-right font-medium',
                                    fund.returns.oneYear >= 0 ? 'text-positive' : 'text-negative'
                                  )}
                                >
                                  {(fund.returns.oneYear * 100).toFixed(2)}%
                                </td>
                                <td
                                  className={cn(
                                    'py-2.5 px-4 text-right font-medium',
                                    fund.returns.threeYear >= 0 ? 'text-positive' : 'text-negative'
                                  )}
                                >
                                  {fund.returns.threeYear
                                    ? (fund.returns.threeYear * 100).toFixed(2) + '%'
                                    : '—'}
                                </td>
                                <td
                                  className={cn(
                                    'py-2.5 px-4 text-right font-medium',
                                    fund.returns.fiveYear >= 0 ? 'text-positive' : 'text-negative'
                                  )}
                                >
                                  {fund.returns.fiveYear
                                    ? (fund.returns.fiveYear * 100).toFixed(2) + '%'
                                    : '—'}
                                </td>
                                <td className="py-2.5 px-4 text-right text-slate-600">
                                  {fund.sharpeRatio.toFixed(2)}
                                </td>
                                {navData?.funds && navData.funds.length > 0 && (() => {
                                  const nav = getNavForFund(fund.schemeCode);
                                  const fmtRet = (v: number | null | undefined) => {
                                    if (v === null || v === undefined) return '—';
                                    const pct = v * 100;
                                    return (
                                      <span className={pct >= 0 ? 'text-positive' : 'text-negative'}>
                                        {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                                      </span>
                                    );
                                  };
                                  return (
                                    <>
                                      <td className="py-2.5 px-4 text-right text-slate-600 bg-emerald-50/30 font-mono text-[11px]">
                                        {nav ? `₹${nav.latestNav.toFixed(2)}` : '—'}
                                      </td>
                                      <td className="py-2.5 px-4 text-right bg-emerald-50/30 font-medium">
                                        {fmtRet(nav?.returns.oneMonth)}
                                      </td>
                                      <td className="py-2.5 px-4 text-right bg-emerald-50/30 font-medium">
                                        {fmtRet(nav?.returns.threeMonth)}
                                      </td>
                                      <td className="py-2.5 px-4 text-right bg-emerald-50/30 font-medium">
                                        {fmtRet(nav?.returns.sixMonth)}
                                      </td>
                                      <td className="py-2.5 px-4 text-right bg-emerald-50/30 font-medium">
                                        {fmtRet(nav?.returns.tenYear)}
                                      </td>
                                    </>
                                  );
                                })()}
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() =>
                                        setEditingFund({ fund, categoryName: cat.name })
                                      }
                                      className="p-1.5 rounded text-slate-400 hover:text-brand hover:bg-brand-50 transition-all"
                                      title="Edit fund"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFund(cat.name, fund.id)}
                                      className="p-1.5 rounded text-slate-400 hover:text-negative hover:bg-negative-50 transition-all"
                                      title="Remove fund"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
