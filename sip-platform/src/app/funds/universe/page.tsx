'use client';

/**
 * /funds/universe — Public mutual fund universe explorer.
 *
 * ~2,000 Indian mutual fund schemes. Sortable on every numeric column
 * (asc/desc), filterable by broad bucket + category + AMC, searchable
 * by scheme name. NAV is updated daily via the AMFI cron; rich research
 * metrics (Sharpe, allocation %, P/E, etc.) are refreshed periodically.
 *
 * Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  TrendingUp,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────

interface UniverseFund {
  amfi_code: string;
  scheme_name: string;
  amc_name: string | null;
  amfi_category: string | null;
  external_category: string | null;
  snapshot_date: string | null;
  live_nav: number | null;
  live_nav_at: string | null;
  nav_date: string | null;
  aum_inr_cr: number | null;
  riskometer: string | null;
  ter: number | null;
  launch_date: string | null;
  returns_1m: number | null;
  returns_3m: number | null;
  returns_6m: number | null;
  returns_1y: number | null;
  returns_3y: number | null;
  returns_5y: number | null;
  returns_10y: number | null;
  returns_since_launch: number | null;
  volatility: number | null;
  sharpe: number | null;
  sortino: number | null;
  equity_pct: number | null;
  large_cap_pct: number | null;
  mid_cap_pct: number | null;
  small_cap_pct: number | null;
  holdings_count: number | null;
  pe: number | null;
  pb: number | null;
  ytm: number | null;
  duration: number | null;
  trustner_preferred: boolean | null;
}

interface ApiResponse {
  rows: UniverseFund[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type SortDir = 'asc' | 'desc';

// ─── Broad buckets ─────────────────────────────────────────

const BROAD_BUCKETS = [
  { key: 'Equity', label: 'Equity', icon: TrendingUp },
  { key: 'Debt', label: 'Debt', icon: ArrowDown },
  { key: 'Hybrid', label: 'Hybrid', icon: ArrowUpDown },
  { key: 'Other', label: 'ETFs & FoF', icon: Star },
  { key: 'Solution', label: 'Solution', icon: Filter },
];

// Columns with sort metadata
const COLUMNS: Array<{
  key: keyof UniverseFund;
  label: string;
  align?: 'left' | 'right';
  width?: string;
  format?: (v: unknown, row: UniverseFund) => string;
  sortable?: boolean;
}> = [
  { key: 'scheme_name', label: 'Scheme', align: 'left', width: 'min-w-[280px]', sortable: true },
  {
    key: 'external_category',
    label: 'Category',
    align: 'left',
    width: 'min-w-[160px]',
    format: (v) => (v ? String(v).split(':')[0].trim() : '—'),
  },
  {
    key: 'live_nav',
    label: 'NAV (₹)',
    align: 'right',
    format: (v) => (v ? Number(v).toFixed(2) : '—'),
    sortable: true,
  },
  {
    key: 'aum_inr_cr',
    label: 'AUM (₹ Cr)',
    align: 'right',
    format: (v) => (v ? Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'),
    sortable: true,
  },
  {
    key: 'returns_1y',
    label: '1Y',
    align: 'right',
    format: (v) => (v != null ? (Number(v) * 100).toFixed(2) + '%' : '—'),
    sortable: true,
  },
  {
    key: 'returns_3y',
    label: '3Y',
    align: 'right',
    format: (v) => (v != null ? (Number(v) * 100).toFixed(2) + '%' : '—'),
    sortable: true,
  },
  {
    key: 'returns_5y',
    label: '5Y',
    align: 'right',
    format: (v) => (v != null ? (Number(v) * 100).toFixed(2) + '%' : '—'),
    sortable: true,
  },
  {
    key: 'returns_10y',
    label: '10Y',
    align: 'right',
    format: (v) => (v != null ? (Number(v) * 100).toFixed(2) + '%' : '—'),
    sortable: true,
  },
  {
    key: 'sharpe',
    label: 'Sharpe',
    align: 'right',
    format: (v) => (v != null ? Number(v).toFixed(2) : '—'),
    sortable: true,
  },
  {
    key: 'volatility',
    label: 'Volatility',
    align: 'right',
    format: (v) => (v != null ? (Number(v) * 100).toFixed(2) + '%' : '—'),
    sortable: true,
  },
  {
    key: 'ter',
    label: 'TER',
    align: 'right',
    format: (v) => (v != null ? Number(v).toFixed(2) + '%' : '—'),
    sortable: true,
  },
  {
    key: 'riskometer',
    label: 'Risk',
    align: 'left',
    format: (v) => v ? String(v) : '—',
  },
];

// ─── Page ─────────────────────────────────────────────────

export default function FundUniversePage() {
  const [broad, setBroad] = useState<string>('Equity');
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortCol, setSortCol] = useState<string>('aum_inr_cr');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [broad, category, debouncedSearch, sortCol, sortDir]);

  // Fetch categories once
  useEffect(() => {
    fetch('/api/funds/universe/categories')
      .then((r) => r.json())
      .then((j) => setCategories(j.categories || []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch universe rows
  const fetchUniverse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort: `${sortCol}:${sortDir}`,
      });
      if (broad) params.set('broad', broad);
      if (category) params.set('category', category);
      if (debouncedSearch) params.set('q', debouncedSearch);

      const res = await fetch(`/api/funds/universe?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j: ApiResponse = await res.json();
      setData(j);
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [broad, category, debouncedSearch, sortCol, sortDir, page, pageSize]);

  useEffect(() => {
    void fetchUniverse();
  }, [fetchUniverse]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      // Numeric columns default to desc on first click (show biggest first); text asc
      setSortDir(col === 'scheme_name' || col === 'external_category' ? 'asc' : 'desc');
    }
  };

  const filteredCategories = useMemo(() => {
    if (!broad) return categories;
    const bucketPrefixes: Record<string, string[]> = {
      Equity: ['Equity', 'ETFs: Equity', 'Equity Index'],
      Debt: ['Debt', 'ETFs: Debt', 'Debt Index'],
      Hybrid: ['Hybrid'],
      Other: ['ETFs: Commodity', 'FoFs', 'Passive ELSS'],
      Solution: ['Children', 'Retirement'],
    };
    const prefixes = bucketPrefixes[broad] || [];
    return categories.filter((c) => prefixes.some((p) => c.name.startsWith(p)));
  }, [categories, broad]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white py-12 sm:py-16">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-brand-300" />
              Fund Research Universe
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-[1.05]">
              Explore <span className="text-brand-300">2,000+ Indian mutual funds</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Live NAVs (refreshed daily), 1-15 year returns, Sharpe ratios, allocation breakdowns,
              valuation multiples. Every column sortable, every category filterable. Click any
              column header to sort ascending or descending.
            </p>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container-custom py-3">
          {/* Broad buckets */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {BROAD_BUCKETS.map((b) => {
              const Icon = b.icon;
              const active = broad === b.key;
              return (
                <button
                  key={b.key}
                  onClick={() => {
                    setBroad(b.key);
                    setCategory('');
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition',
                    active
                      ? 'bg-brand text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {b.label}
                </button>
              );
            })}
          </div>

          {/* Search + Category */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search scheme name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand outline-none bg-white min-w-[220px]"
            >
              <option value="">All {broad.toLowerCase()} categories ({filteredCategories.reduce((a, c) => a + c.count, 0)})</option>
              {filteredCategories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="container-custom py-5">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 mb-4 flex items-start gap-2 text-sm text-rose-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Error:</strong> {error}
              <p className="text-xs mt-0.5">If this persists, the fund research feed may still be loading. Try again in a few minutes.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              {loading ? (
                'Loading…'
              ) : data ? (
                <>
                  Showing <strong>{data.rows.length}</strong> of{' '}
                  <strong>{data.total.toLocaleString('en-IN')}</strong> funds
                </>
              ) : (
                '—'
              )}
            </span>
            <span className="text-slate-400">
              Click column headers to sort. ↑ ascending · ↓ descending.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  {COLUMNS.map((col) => {
                    const isActive = sortCol === col.key;
                    const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th
                        key={String(col.key)}
                        className={cn(
                          'px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap',
                          col.align === 'right' ? 'text-right' : 'text-left',
                          col.width
                        )}
                      >
                        {col.sortable ? (
                          <button
                            onClick={() => handleSort(String(col.key))}
                            className={cn(
                              'inline-flex items-center gap-1 hover:text-brand transition',
                              isActive && 'text-brand'
                            )}
                          >
                            <span>{col.label}</span>
                            <Icon className="w-3 h-3" />
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data?.rows.map((fund) => (
                  <tr
                    key={fund.amfi_code}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition"
                  >
                    {COLUMNS.map((col) => {
                      const value = fund[col.key];
                      const formatted = col.format
                        ? col.format(value, fund)
                        : value == null
                        ? '—'
                        : String(value);
                      const isSchemeCell = col.key === 'scheme_name';
                      return (
                        <td
                          key={String(col.key)}
                          className={cn(
                            'px-3 py-2.5 text-sm whitespace-nowrap',
                            col.align === 'right'
                              ? 'text-right font-mono tabular-nums'
                              : 'text-left'
                          )}
                        >
                          {isSchemeCell ? (
                            <div className="flex items-center gap-1.5">
                              {fund.trustner_preferred && (
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900 truncate max-w-[260px]">
                                  {fund.scheme_name}
                                </div>
                                {fund.amc_name && (
                                  <div className="text-[11px] text-slate-500">{fund.amc_name}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            formatted
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!loading && data?.rows.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-slate-500">
                      No funds match these filters. Try clearing the search or category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
              <span className="text-slate-600">
                Page <strong>{data.page}</strong> of <strong>{data.totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-500 mt-4 text-center">
          NAV refreshed daily from AMFI. Risk metrics and allocation data refreshed periodically.{' '}
          <Link href="/funds/screener" className="text-brand hover:underline">
            Advanced screener →
          </Link>
        </p>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Mutual fund investments are subject to market risks. Read all scheme-related documents
          carefully. Past performance is not indicative of future returns. Trustner Asset Services
          Pvt. Ltd. — ARN-286886.
        </p>
      </section>
    </main>
  );
}
