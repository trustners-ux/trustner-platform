/**
 * Preferred Funds Manager
 *
 * Route: /admin/funds/preferred-list
 *
 * Lets the CFP committee toggle `trustner_preferred` on pd_fund_master
 * rows. Methodology v1.1.0 has a "Trustner-preferred floor" that lifts
 * any flagged fund's verdict to KEEP at minimum — so curating this list
 * is how the team locks in the institutional view that prevents the
 * PPFAS Flexi Cap → SWAP inconsistency Ram caught.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Filter, Loader2, Star, ChevronLeft, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';

interface FundRow {
  amfi_code: string;
  scheme_name: string;
  amc_name: string | null;
  category: string | null;
  sub_category: string | null;
  cagr_3y: number | null;
  cagr_5y: number | null;
  category_rank_3y: number | null;
  category_total: number | null;
  trustner_preferred: boolean;
}

interface ApiResponse {
  rows: FundRow[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
  preferredCount: number;
}

export default function PreferredFundsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [busyAmfi, setBusyAmfi] = useState<string | null>(null);

  // Debounce search input — re-fetch 300ms after typing stops
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (debouncedSearch) qs.set('q', debouncedSearch);
      if (category) qs.set('category', category);
      if (preferredOnly) qs.set('preferred', '1');
      qs.set('page', String(page));
      const r = await fetch(`/api/admin/funds/preferred-list?${qs}`, { credentials: 'include' });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setError(e.error ?? `Fetch failed (${r.status})`);
        return;
      }
      const body = (await r.json()) as ApiResponse;
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, preferredOnly, page]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, preferredOnly]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  async function togglePreferred(row: FundRow) {
    setBusyAmfi(row.amfi_code);
    try {
      const r = await fetch('/api/admin/funds/preferred-list', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amfi_code: row.amfi_code, trustner_preferred: !row.trustner_preferred }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        setError(e.error ?? 'Toggle failed');
        return;
      }
      // Optimistic local update — flip the row in current data
      setData((prev) => prev ? {
        ...prev,
        rows: prev.rows.map((rr) => rr.amfi_code === row.amfi_code ? { ...rr, trustner_preferred: !row.trustner_preferred } : rr),
        preferredCount: prev.preferredCount + (row.trustner_preferred ? -1 : 1),
      } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyAmfi(null);
    }
  }

  const quartile = (rank: number | null, total: number | null): number | null => {
    if (!rank || !total) return null;
    const ratio = rank / total;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  const categories = useMemo(() => data?.categories ?? [], [data]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trustner-Preferred Funds</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Mark the funds your CFP committee endorses. The scoring engine will lift these to <strong>KEEP</strong> at minimum, preventing the &ldquo;same fund, opposite recommendation&rdquo; inconsistency across client portfolios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm font-semibold text-amber-900">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            {data?.preferredCount ?? 0} preferred
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scheme name (e.g. parag parikh, hdfc small cap)…"
            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={preferredOnly}
            onChange={(e) => setPreferredOnly(e.target.checked)}
            className="rounded"
          />
          Preferred only
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Scheme</th>
                <th className="px-3 py-2.5 text-left font-semibold">AMC</th>
                <th className="px-3 py-2.5 text-left font-semibold">Category</th>
                <th className="px-3 py-2.5 text-right font-semibold">3Y CAGR</th>
                <th className="px-3 py-2.5 text-right font-semibold">5Y CAGR</th>
                <th className="px-3 py-2.5 text-center font-semibold">Qtl</th>
                <th className="px-4 py-2.5 text-center font-semibold w-32">Preferred</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (!data || data.rows.length === 0) && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading…
                </td></tr>
              )}
              {!loading && data?.rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No funds match these filters.
                </td></tr>
              )}
              {data?.rows.map((row) => {
                const q = quartile(row.category_rank_3y, row.category_total);
                return (
                  <tr key={row.amfi_code} className={row.trustner_preferred ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {row.trustner_preferred && <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 flex-shrink-0" />}
                        <span>{row.scheme_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">AMFI: {row.amfi_code}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700 text-xs">{row.amc_name ?? '—'}</td>
                    <td className="px-3 py-3 text-slate-700 text-xs">
                      {row.category ?? '—'}
                      {row.sub_category && <div className="text-[10px] text-slate-500">{row.sub_category}</div>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-slate-900">
                      {row.cagr_3y !== null ? `${row.cagr_3y.toFixed(2)}%` : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-700">
                      {row.cagr_5y !== null ? `${row.cagr_5y.toFixed(2)}%` : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {q ? <span className={`inline-block w-6 h-6 rounded-full text-[11px] font-bold leading-6 ${q === 1 ? 'bg-emerald-100 text-emerald-800' : q === 2 ? 'bg-sky-100 text-sky-800' : q === 3 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>Q{q}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => togglePreferred(row)}
                        disabled={busyAmfi === row.amfi_code}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          row.trustner_preferred
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {busyAmfi === row.amfi_code ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : row.trustner_preferred ? (
                          <Star className="h-3 w-3 fill-white" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {row.trustner_preferred ? 'Preferred' : 'Mark'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
            <span className="text-xs text-slate-600">
              Page <strong>{data.page}</strong> of <strong>{totalPages}</strong> · {data.total.toLocaleString('en-IN')} total funds
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-3 w-3" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* How this affects scoring */}
      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <p className="font-semibold mb-1">How marking affects scoring</p>
        <p className="text-xs leading-relaxed">
          A fund flagged here will never get a <strong>SWAP</strong> or <strong>LIQUIDATE</strong> verdict from the engine. Its lowest possible verdict is <strong>KEEP</strong>, even if its composite score sits just below 0.60. This prevents the &ldquo;same fund, opposite recommendation&rdquo; inconsistency across portfolios when fund-master data has gaps (missing manager tenure, narrow category samples, etc.). Mark only funds your committee has explicitly endorsed.
        </p>
      </div>
    </div>
  );
}
