'use client';

/**
 * /funds/universe — Public mutual fund universe explorer.
 *
 * World-class fund discovery surface. ~2,000 Indian mutual fund schemes,
 * every column sortable, every category filterable, dual view modes
 * (returns table + calendar-year heatmap), heatmap-coloured returns,
 * peer-rank pills, NAV-growth-since-launch annotation, URL-persisted
 * state for shareable links, smart preset filters, density toggle,
 * CSV export, and a pinned category-median benchmark row.
 *
 * Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
  Download,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Award,
  Gauge,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CalculatorCTA } from '@/components/sections/CalculatorCTA';

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
  returns_1d: number | null;
  returns_5d: number | null;
  returns_mtd: number | null;
  returns_ytd: number | null;
  returns_1m: number | null;
  returns_3m: number | null;
  returns_6m: number | null;
  returns_1y: number | null;
  returns_2y: number | null;
  returns_3y: number | null;
  returns_5y: number | null;
  returns_7y: number | null;
  returns_10y: number | null;
  returns_15y: number | null;
  returns_since_launch: number | null;
  annual_2025: number | null;
  annual_2024: number | null;
  annual_2023: number | null;
  annual_2022: number | null;
  annual_2021: number | null;
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
  pendingSetup?: boolean;
  message?: string;
}

type SortDir = 'asc' | 'desc';
type ViewMode = 'table' | 'calendar';
type Density = 'compact' | 'comfortable' | 'spacious';
type Preset = '' | 'vintage' | 'champions' | 'low-ter' | 'trustner-picks' | 'top-sharpe';

// ─── Broad buckets ─────────────────────────────────────────

const BROAD_BUCKETS = [
  { key: 'Equity', label: 'Equity', icon: TrendingUp },
  { key: 'Debt', label: 'Debt', icon: ArrowDown },
  { key: 'Hybrid', label: 'Hybrid', icon: ArrowUpDown },
  { key: 'Other', label: 'ETFs & FoF', icon: Star },
  { key: 'Solution', label: 'Solution', icon: Filter },
];

// ─── Preset filter chips ───────────────────────────────────
// Each preset applies a client-side filter on top of the server-fetched page
// (server-side enforcement of AUM/TER thresholds would require API extension;
// in practice the chips work best as discovery aids).

const PRESETS: Array<{ key: Preset; label: string; icon: React.ElementType; desc: string }> = [
  { key: 'vintage',        label: '10Y+ vintage',     icon: Award,    desc: 'Funds with 10+ year track record' },
  { key: 'champions',      label: 'AUM Champions',    icon: Sparkles, desc: 'AUM > ₹10,000 Cr — battle-tested at scale' },
  { key: 'low-ter',        label: 'Low Cost',         icon: Gauge,    desc: 'TER < 1% — more of your money working' },
  { key: 'trustner-picks', label: 'Trustner Picks',   icon: Star,     desc: 'Hand-picked by Trustner research desk' },
  { key: 'top-sharpe',     label: 'Best Sharpe',      icon: TrendingUp, desc: 'Top risk-adjusted performance' },
];

// ─── Format helpers ────────────────────────────────────────

const pct = (v: unknown) => (v != null ? (Number(v) * 100).toFixed(2) + '%' : '—');
const num = (v: unknown, d = 2) => (v != null ? Number(v).toFixed(d) : '—');
const terPct = (v: unknown) => (v != null ? (Number(v) * 100).toFixed(2) + '%' : '—');

const yearsLive = (launchIso: unknown): number | null => {
  if (!launchIso) return null;
  const d = new Date(String(launchIso));
  if (Number.isNaN(d.getTime())) return null;
  const ms = Date.now() - d.getTime();
  if (ms <= 0) return null;
  return ms / (365.25 * 24 * 60 * 60 * 1000);
};

const launchWithVintage = (v: unknown) => {
  if (!v) return '—';
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return '—';
  const datePart = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  const yrs = yearsLive(v);
  if (yrs == null) return datePart;
  const vintage =
    yrs < 1 ? `${Math.round(yrs * 12)}M` :
    yrs < 10 ? `${yrs.toFixed(1)}Y` :
    `${Math.round(yrs)}Y`;
  return `${datePart} · ${vintage}`;
};

/**
 * Median of an array (ignores null/undefined). Used for the pinned
 * category-benchmark row.
 */
function median(values: Array<number | null | undefined>): number | null {
  const clean = values.filter((v): v is number => typeof v === 'number');
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Heatmap colour for a return value. 5 bands diverging green ↔ red.
 * Decimal input (0.18 = 18%). Calibrated for annual / multi-year returns.
 */
function returnHeatColor(value: number | null | undefined, scale: 'annual' | 'short' = 'annual'): string {
  if (value == null) return '';
  const v = value * 100;
  if (scale === 'short') {
    // Tighter band for 1D/5D/1M
    if (v > 5)   return 'bg-emerald-200/70 text-emerald-900';
    if (v > 1)   return 'bg-emerald-100/70 text-emerald-800';
    if (v > -1)  return 'bg-slate-100/60 text-slate-700';
    if (v > -5)  return 'bg-rose-100/70 text-rose-700';
    return 'bg-rose-200/70 text-rose-800';
  }
  // Annual / multi-year band
  if (v > 25)  return 'bg-emerald-200/80 text-emerald-900 font-semibold';
  if (v > 15)  return 'bg-emerald-100/80 text-emerald-800';
  if (v > 8)   return 'bg-emerald-50  text-emerald-700';
  if (v > 0)   return 'bg-slate-50    text-slate-700';
  if (v > -10) return 'bg-rose-100/70 text-rose-700';
  return 'bg-rose-200/80 text-rose-800 font-semibold';
}

// Columns metadata
interface ColumnDef {
  key: keyof UniverseFund;
  label: string;
  align?: 'left' | 'right';
  width?: string;
  format?: (v: unknown, row: UniverseFund) => string;
  sortable?: boolean;
  sticky?: boolean;
  heatScale?: 'annual' | 'short';
  isReturn?: boolean;
}

const TABLE_COLUMNS: ColumnDef[] = [
  { key: 'scheme_name',     label: 'Scheme',          align: 'left',  width: 'min-w-[260px]', sortable: true, sticky: true },
  { key: 'external_category', label: 'Category',      align: 'left',  width: 'min-w-[140px]',
    format: (v) => (v ? String(v).split(':')[0].trim() : '—') },
  { key: 'live_nav',        label: 'NAV (₹)',         align: 'right', format: (v) => num(v, 2), sortable: true },
  { key: 'launch_date',     label: 'Launch · Age',    align: 'right', width: 'min-w-[140px]', format: launchWithVintage, sortable: true },
  { key: 'aum_inr_cr',      label: 'AUM (₹ Cr)',      align: 'right',
    format: (v) => (v ? Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'), sortable: true },
  { key: 'returns_1d',      label: '1D',  align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'short' },
  { key: 'returns_5d',      label: '5D',  align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'short' },
  { key: 'returns_1m',      label: '1M',  align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'short' },
  { key: 'returns_3m',      label: '3M',  align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'short' },
  { key: 'returns_6m',      label: '6M',  align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'returns_1y',      label: '1Y',  align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'returns_3y',      label: '3Y',  align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'returns_5y',      label: '5Y',  align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'returns_10y',     label: '10Y', align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'sharpe',          label: 'Sharpe',     align: 'right', format: (v) => num(v, 2), sortable: true },
  { key: 'volatility',      label: 'Volatility', align: 'right', format: pct,              sortable: true },
  { key: 'ter',             label: 'TER',        align: 'right', format: terPct,           sortable: true },
  { key: 'riskometer',      label: 'Risk',       align: 'left',  format: (v) => v ? String(v) : '—' },
];

const CALENDAR_COLUMNS: ColumnDef[] = [
  { key: 'scheme_name',     label: 'Scheme',  align: 'left',  width: 'min-w-[260px]', sortable: true, sticky: true },
  { key: 'external_category', label: 'Category', align: 'left', width: 'min-w-[140px]',
    format: (v) => (v ? String(v).split(':')[0].trim() : '—') },
  { key: 'annual_2025',     label: '2025 YTD', align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'annual_2024',     label: '2024',     align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'annual_2023',     label: '2023',     align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'annual_2022',     label: '2022',     align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'annual_2021',     label: '2021',     align: 'right', format: pct, sortable: true, isReturn: true, heatScale: 'annual' },
  { key: 'aum_inr_cr',      label: 'AUM (₹ Cr)', align: 'right',
    format: (v) => (v ? Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'), sortable: true },
  { key: 'riskometer',      label: 'Risk',     align: 'left',  format: (v) => v ? String(v) : '—' },
];

const DENSITY_CLASS: Record<Density, string> = {
  compact:     'px-2.5 py-1.5 text-xs',
  comfortable: 'px-3 py-2.5 text-sm',
  spacious:    'px-4 py-4 text-sm',
};

// ─── Page ──────────────────────────────────────────────────

function FundUniversePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ─── State: hydrate from URL on initial render ─────────
  const [broad, setBroad]       = useState<string>(() => searchParams?.get('broad') || 'Equity');
  const [category, setCategory] = useState<string>(() => searchParams?.get('category') || '');
  const [search, setSearch]     = useState<string>(() => searchParams?.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(search);
  const [sortCol, setSortCol]   = useState<string>(() => {
    const s = searchParams?.get('sort');
    return s ? s.split(':')[0] : 'aum_inr_cr';
  });
  const [sortDir, setSortDir]   = useState<SortDir>(() => {
    const s = searchParams?.get('sort');
    return s && s.split(':')[1] === 'asc' ? 'asc' : 'desc';
  });
  const [page, setPage]         = useState<number>(() => parseInt(searchParams?.get('page') || '1', 10));
  const [pageSize]              = useState<number>(50);
  const [viewMode, setViewMode] = useState<ViewMode>(() => (searchParams?.get('view') === 'calendar' ? 'calendar' : 'table'));
  const [density, setDensity]   = useState<Density>(() => {
    const d = searchParams?.get('d');
    return d === 'compact' || d === 'spacious' ? d : 'comfortable';
  });
  const [preset, setPreset]     = useState<Preset>(() => {
    const p = searchParams?.get('preset') as Preset | null;
    return p && PRESETS.some((x) => x.key === p) ? p : '';
  });

  const [data, setData] = useState<ApiResponse | null>(null);
  const [categories, setCategories] = useState<Array<{ name: string; count: number; broad_bucket: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ─── URL state persistence ──────────────────────────────
  // Write filter state back to URL on every change so the link is shareable.
  // Using history.replaceState avoids a full router push (no scroll-to-top).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const u = new URLSearchParams();
    if (broad && broad !== 'Equity') u.set('broad', broad);
    if (category) u.set('category', category);
    if (debouncedSearch) u.set('q', debouncedSearch);
    const sort = `${sortCol}:${sortDir}`;
    if (sort !== 'aum_inr_cr:desc') u.set('sort', sort);
    if (page > 1) u.set('page', String(page));
    if (viewMode !== 'table') u.set('view', viewMode);
    if (density !== 'comfortable') u.set('d', density);
    if (preset) u.set('preset', preset);
    const qs = u.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState({}, '', next);
  }, [broad, category, debouncedSearch, sortCol, sortDir, page, viewMode, density, preset, pathname]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter / preset change (but NOT on sort change within same view)
  useEffect(() => { setPage(1); }, [broad, category, debouncedSearch, preset]);

  // Fetch categories once
  useEffect(() => {
    fetch('/api/funds/universe/categories')
      .then((r) => r.json())
      .then((j) => setCategories(j.categories || []))
      .catch(() => setCategories([]));
  }, []);

  // Resolve effective sort for current preset. Presets that imply a sort
  // (top-sharpe) override the user's chosen column; non-sort presets leave
  // the user's sort in place.
  const effectiveSort = useMemo(() => {
    if (preset === 'top-sharpe')      return { col: 'sharpe', dir: 'desc' as SortDir };
    if (preset === 'low-ter')         return { col: 'ter', dir: 'asc' as SortDir };
    return { col: sortCol, dir: sortDir };
  }, [preset, sortCol, sortDir]);

  // Fetch universe rows
  const fetchUniverse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort: `${effectiveSort.col}:${effectiveSort.dir}`,
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
  }, [broad, category, debouncedSearch, effectiveSort.col, effectiveSort.dir, page, pageSize]);

  useEffect(() => { void fetchUniverse(); }, [fetchUniverse]);

  // ─── Client-side preset filtering ──────────────────────
  // For presets that imply data filters (not pure sort), apply on the
  // visible page after fetch. Acceptable because the server already ranks
  // by AUM / Sharpe so the top page is the right cohort.
  const visibleRows = useMemo<UniverseFund[]>(() => {
    if (!data) return [];
    let rows = data.rows;
    if (preset === 'vintage') {
      rows = rows.filter((r) => {
        const y = yearsLive(r.launch_date);
        return y != null && y >= 10;
      });
    } else if (preset === 'champions') {
      rows = rows.filter((r) => (r.aum_inr_cr ?? 0) >= 10_000);
    } else if (preset === 'low-ter') {
      rows = rows.filter((r) => (r.ter ?? 1) < 0.01);
    } else if (preset === 'trustner-picks') {
      rows = rows.filter((r) => r.trustner_preferred === true);
    }
    return rows;
  }, [data, preset]);

  // ─── Latest NAV refresh timestamp across the visible universe ──
  // Drives a banner so users can see at a glance when the AMFI cron last touched the data.
  const latestNavRefresh = useMemo<Date | null>(() => {
    if (!visibleRows?.length) return null;
    let maxTs = 0;
    for (const r of visibleRows) {
      if (!r.live_nav_at) continue;
      const t = new Date(r.live_nav_at).getTime();
      if (!isNaN(t) && t > maxTs) maxTs = t;
    }
    return maxTs ? new Date(maxTs) : null;
  }, [visibleRows]);

  // ─── Pinned benchmark row (category median) ────────────
  // When a single category is selected, compute median for visible numeric
  // columns and render as a non-scrolling "Category median" row above the body.
  // Anchors every fund's number against its peer median — a single-glance alpha
  // signal even before sorting.
  const benchmarkRow = useMemo<Partial<UniverseFund> | null>(() => {
    if (!category || visibleRows.length < 3) return null;
    const med: Partial<UniverseFund> = {
      scheme_name: 'Category Median',
      external_category: category,
      live_nav: median(visibleRows.map((r) => r.live_nav)),
      aum_inr_cr: median(visibleRows.map((r) => r.aum_inr_cr)),
      returns_1d:  median(visibleRows.map((r) => r.returns_1d)),
      returns_5d:  median(visibleRows.map((r) => r.returns_5d)),
      returns_1m:  median(visibleRows.map((r) => r.returns_1m)),
      returns_3m:  median(visibleRows.map((r) => r.returns_3m)),
      returns_6m:  median(visibleRows.map((r) => r.returns_6m)),
      returns_1y:  median(visibleRows.map((r) => r.returns_1y)),
      returns_3y:  median(visibleRows.map((r) => r.returns_3y)),
      returns_5y:  median(visibleRows.map((r) => r.returns_5y)),
      returns_10y: median(visibleRows.map((r) => r.returns_10y)),
      annual_2025: median(visibleRows.map((r) => r.annual_2025)),
      annual_2024: median(visibleRows.map((r) => r.annual_2024)),
      annual_2023: median(visibleRows.map((r) => r.annual_2023)),
      annual_2022: median(visibleRows.map((r) => r.annual_2022)),
      annual_2021: median(visibleRows.map((r) => r.annual_2021)),
      sharpe:     median(visibleRows.map((r) => r.sharpe)),
      volatility: median(visibleRows.map((r) => r.volatility)),
      ter:        median(visibleRows.map((r) => r.ter)),
    };
    return med;
  }, [category, visibleRows]);

  // ─── Peer rank: position within visible category for 1Y returns ──
  const peerRankMap = useMemo(() => {
    const m = new Map<string, number>();
    const sorted = [...visibleRows]
      .filter((r) => r.returns_1y != null)
      .sort((a, b) => (b.returns_1y ?? 0) - (a.returns_1y ?? 0));
    sorted.forEach((r, i) => m.set(r.amfi_code, i + 1));
    return { ranks: m, total: sorted.length };
  }, [visibleRows]);

  const handleSort = (col: string) => {
    // Picking a column manually clears preset-implied sort
    if (preset === 'top-sharpe' || preset === 'low-ter') setPreset('');
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir(col === 'scheme_name' || col === 'external_category' ? 'asc' : 'desc');
    }
  };

  const filteredCategories = useMemo(() => {
    if (!broad) return categories;
    return categories.filter((c) => c.broad_bucket === broad);
  }, [categories, broad]);

  // ─── CSV export ────────────────────────────────────────
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '2000',
        sort: `${effectiveSort.col}:${effectiveSort.dir}`,
      });
      if (broad) params.set('broad', broad);
      if (category) params.set('category', category);
      if (debouncedSearch) params.set('q', debouncedSearch);
      const res = await fetch(`/api/funds/universe?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const j: ApiResponse = await res.json();
      // Re-apply preset filter so the export matches what user sees
      let rows = j.rows;
      if (preset === 'vintage')        rows = rows.filter((r) => { const y = yearsLive(r.launch_date); return y != null && y >= 10; });
      else if (preset === 'champions') rows = rows.filter((r) => (r.aum_inr_cr ?? 0) >= 10_000);
      else if (preset === 'low-ter')   rows = rows.filter((r) => (r.ter ?? 1) < 0.01);
      else if (preset === 'trustner-picks') rows = rows.filter((r) => r.trustner_preferred === true);

      const headers = [
        'AMFI Code', 'Scheme Name', 'AMC', 'Category', 'Launch Date', 'Years Live',
        'NAV (INR)', 'NAV Date', 'AUM (INR Cr)', 'TER (%)', 'Riskometer',
        'Return 1D (%)', 'Return 5D (%)', 'Return 1M (%)', 'Return 3M (%)', 'Return 6M (%)',
        'Return 1Y (%)', 'Return 3Y (CAGR %)', 'Return 5Y (CAGR %)', 'Return 10Y (CAGR %)',
        'Annual 2025 (%)', 'Annual 2024 (%)', 'Annual 2023 (%)', 'Annual 2022 (%)', 'Annual 2021 (%)',
        'Sharpe', 'Volatility (%)', 'Sortino',
        'Equity %', 'Large Cap %', 'Mid Cap %', 'Small Cap %',
        'Holdings', 'P/E', 'P/B', 'Trustner Preferred',
      ];
      const esc = (s: unknown) => {
        const str = s == null ? '' : String(s);
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
      };
      const p100 = (v: number | null | undefined) => (v != null ? (v * 100).toFixed(2) : '');
      const lines = [
        headers.map(esc).join(','),
        ...rows.map((r) => [
          r.amfi_code, r.scheme_name, r.amc_name ?? '', r.external_category ?? '',
          r.launch_date ?? '', yearsLive(r.launch_date)?.toFixed(1) ?? '',
          r.live_nav ?? '', r.nav_date ?? '', r.aum_inr_cr ?? '', p100(r.ter), r.riskometer ?? '',
          p100(r.returns_1d), p100(r.returns_5d), p100(r.returns_1m), p100(r.returns_3m), p100(r.returns_6m),
          p100(r.returns_1y), p100(r.returns_3y), p100(r.returns_5y), p100(r.returns_10y),
          p100(r.annual_2025), p100(r.annual_2024), p100(r.annual_2023), p100(r.annual_2022), p100(r.annual_2021),
          r.sharpe ?? '', p100(r.volatility), r.sortino ?? '',
          p100(r.equity_pct), p100(r.large_cap_pct), p100(r.mid_cap_pct), p100(r.small_cap_pct),
          r.holdings_count ?? '', r.pe ?? '', r.pb ?? '', r.trustner_preferred ? 'Yes' : 'No',
        ].map(esc).join(',')),
      ];
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `trustner-fund-universe-${broad || 'all'}${category ? '-' + category.replace(/[^a-z0-9]+/gi, '-') : ''}-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`CSV export failed: ${(e as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  const COLUMNS = viewMode === 'calendar' ? CALENDAR_COLUMNS : TABLE_COLUMNS;
  const cellPad = DENSITY_CLASS[density];

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
              Explore <span className="text-brand-300">4,200+ Indian mutual funds</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Live NAVs (refreshed daily), 1-15 year returns, Sharpe ratios, allocation breakdowns,
              calendar-year heatmap, peer-ranked, shareable filtered views. Every column sortable.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
              <span className="bg-white/5 border border-white/10 rounded px-2 py-0.5">Daily AMFI NAV</span>
              <span className="bg-white/5 border border-white/10 rounded px-2 py-0.5">5-year calendar returns</span>
              <span className="bg-white/5 border border-white/10 rounded px-2 py-0.5">Heatmap colour-coded</span>
              <span className="bg-white/5 border border-white/10 rounded px-2 py-0.5">CSV export</span>
              <span className="bg-white/5 border border-white/10 rounded px-2 py-0.5">Shareable URLs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container-custom py-3 space-y-3">
          {/* Row 1: Broad buckets + view-mode + density + export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {BROAD_BUCKETS.map((b) => {
                const Icon = b.icon;
                const active = broad === b.key;
                return (
                  <button
                    key={b.key}
                    onClick={() => { setBroad(b.key); setCategory(''); }}
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

            {/* View-mode toggle */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition',
                  viewMode === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900')}
                title="Returns table view"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Returns</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition',
                  viewMode === 'calendar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900')}
                title="Calendar-year heatmap"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>

            {/* Density toggle */}
            <select
              value={density}
              onChange={(e) => setDensity(e.target.value as Density)}
              className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white"
              title="Row density"
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfort</option>
              <option value="spacious">Spacious</option>
            </select>

            {/* CSV Export */}
            <button
              onClick={handleExportCsv}
              disabled={exporting || loading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60 transition"
              title="Download current view as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Exporting…' : 'CSV'}
            </button>
          </div>

          {/* Row 2: Preset filter chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mr-1">Quick filter:</span>
            {PRESETS.map((p) => {
              const Icon = p.icon;
              const active = preset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setPreset(active ? '' : p.key)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition',
                    active
                      ? 'bg-brand text-white border-brand shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-brand/40 hover:bg-brand/5'
                  )}
                  title={p.desc}
                >
                  <Icon className="w-3 h-3" />
                  {p.label}
                </button>
              );
            })}
            {preset && (
              <button
                onClick={() => setPreset('')}
                className="text-[11px] text-slate-500 hover:text-rose-600 inline-flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> clear
              </button>
            )}
          </div>

          {/* Row 3: Search + Category */}
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
          <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>
              {loading ? (
                'Loading…'
              ) : data ? (
                <>
                  Showing <strong>{visibleRows.length}</strong>{preset ? ' filtered' : ''} of{' '}
                  <strong>{data.total.toLocaleString('en-IN')}</strong> funds
                  {category && peerRankMap.total > 0 && (
                    <span className="text-slate-400"> · peer-ranked by 1Y return</span>
                  )}
                  {latestNavRefresh && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live · AMFI NAV as of {latestNavRefresh.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </>
              ) : (
                '—'
              )}
            </span>
            <span className="text-slate-500">
              {viewMode === 'calendar'
                ? 'Calendar-year returns (last 5 years). Green = strong, red = weak.'
                : 'Click headers to sort. Heatmap colours show return strength at a glance.'}
            </span>
          </div>

          {/* SEBI-mandated inline disclosure — placed adjacent to returns data */}
          <div className="text-[11px] text-slate-600 bg-amber-50 border-y border-amber-200 px-3 py-2">
            <strong>Past performance is not indicative of future returns.</strong>{' '}
            Mutual fund investments are subject to market risks. Read all
            scheme-related documents carefully before investing.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {COLUMNS.map((col) => {
                    const isActive = (sortCol === col.key) && !preset;
                    const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th
                        key={String(col.key)}
                        className={cn(
                          'px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap',
                          col.align === 'right' ? 'text-right' : 'text-left',
                          col.width,
                          col.sticky && 'sticky left-0 z-10 bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]'
                        )}
                      >
                        {col.sortable ? (
                          <button
                            onClick={() => handleSort(String(col.key))}
                            className={cn('inline-flex items-center gap-1 hover:text-brand transition',
                              isActive && 'text-brand')}
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
                {/* Pinned benchmark row */}
                {benchmarkRow && visibleRows.length > 2 && (
                  <tr className="border-b-2 border-brand/30 bg-brand/5 sticky top-0">
                    {COLUMNS.map((col) => {
                      const value = (benchmarkRow as Record<string, unknown>)[String(col.key)];
                      const formatted =
                        col.key === 'scheme_name'
                          ? 'Category Median'
                          : col.key === 'external_category'
                          ? category
                          : col.format
                          ? col.format(value, benchmarkRow as UniverseFund)
                          : value == null
                          ? '—'
                          : String(value);
                      const isSchemeCell = col.key === 'scheme_name';
                      return (
                        <td
                          key={String(col.key)}
                          className={cn(
                            cellPad,
                            'whitespace-nowrap font-semibold text-brand-800',
                            col.align === 'right' ? 'text-right font-mono tabular-nums' : 'text-left',
                            col.sticky && 'sticky left-0 z-10 bg-brand/10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]'
                          )}
                        >
                          {isSchemeCell ? (
                            <div className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                              <span>Category Median</span>
                              <span className="text-[10px] text-slate-500 font-normal">(benchmark)</span>
                            </div>
                          ) : (
                            formatted
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )}

                {visibleRows.map((fund, rowIdx) => (
                  <tr
                    key={fund.amfi_code}
                    className={cn(
                      'border-b border-slate-100 hover:bg-brand/5 transition',
                      rowIdx % 2 === 1 && 'bg-slate-50/40'
                    )}
                  >
                    {COLUMNS.map((col) => {
                      const value = fund[col.key];
                      const formatted = col.format
                        ? col.format(value, fund)
                        : value == null
                        ? '—'
                        : String(value);
                      const isSchemeCell = col.key === 'scheme_name';
                      const isNavCell = col.key === 'live_nav';
                      const numericValue = typeof value === 'number' ? value : null;
                      // Heatmap on return / annual cells
                      const heatClass = col.isReturn && numericValue !== null
                        ? returnHeatColor(numericValue, col.heatScale || 'annual')
                        : '';
                      // NAV-from-₹10 growth annotation
                      const navGrowth =
                        isNavCell && typeof fund.live_nav === 'number' && fund.live_nav > 10
                          ? fund.live_nav / 10
                          : null;
                      const peerRank = col.key === 'returns_1y' && peerRankMap.ranks.get(fund.amfi_code);
                      return (
                        <td
                          key={String(col.key)}
                          className={cn(
                            cellPad,
                            'whitespace-nowrap',
                            col.align === 'right' ? 'text-right font-mono tabular-nums' : 'text-left',
                            col.sticky && 'sticky left-0 z-10 bg-inherit shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]',
                            heatClass
                          )}
                          style={
                            col.sticky
                              ? {
                                  backgroundColor:
                                    rowIdx % 2 === 1 ? 'rgb(248 250 252 / 1)' : 'white',
                                }
                              : undefined
                          }
                        >
                          {isSchemeCell ? (
                            <Link
                              href={`/funds/${fund.amfi_code}`}
                              className="flex items-center gap-1.5 group"
                              title={`Open detail page for ${fund.scheme_name}`}
                            >
                              {fund.trustner_preferred && (
                                <span title="Trustner Preferred">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                                </span>
                              )}
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900 truncate max-w-[240px] group-hover:text-brand group-hover:underline">
                                  {fund.scheme_name}
                                </div>
                                {fund.amc_name && (
                                  <div className="text-[11px] text-slate-500">{fund.amc_name}</div>
                                )}
                              </div>
                            </Link>
                          ) : isNavCell ? (
                            <div className="flex flex-col items-end leading-tight">
                              <span>{formatted}</span>
                              {fund.live_nav_at && (
                                <span
                                  className="text-[10px] text-slate-500 font-normal"
                                  title={`AMFI NAV date: ${new Date(fund.live_nav_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`}
                                >
                                  as of {new Date(fund.live_nav_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                </span>
                              )}
                              {navGrowth != null && (
                                <span className="text-[10px] text-emerald-700 font-normal" title="NAV growth from ₹10 face value at launch">
                                  ↑ {navGrowth >= 100 ? navGrowth.toFixed(0) : navGrowth.toFixed(1)}× from ₹10
                                </span>
                              )}
                            </div>
                          ) : col.key === 'returns_1y' && peerRank ? (
                            <div className="flex flex-col items-end leading-tight">
                              <span>{formatted}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                #{peerRank}/{peerRankMap.total}
                              </span>
                            </div>
                          ) : (
                            formatted
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {!loading && visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-sm text-slate-500">
                      {data?.pendingSetup ? (
                        <div className="space-y-2">
                          <div className="font-semibold text-slate-700">Research universe is initialising</div>
                          <div className="text-xs text-slate-500 max-w-md mx-auto">
                            We&apos;re preparing the database of 4,200+ Indian mutual fund schemes
                            with returns, risk metrics, and live NAVs. This typically takes a few
                            minutes after a fresh setup. Please refresh in a moment.
                          </div>
                        </div>
                      ) : preset ? (
                        <>
                          No funds match this preset within current filters.{' '}
                          <button onClick={() => setPreset('')} className="text-brand underline hover:no-underline">
                            Clear preset
                          </button>
                        </>
                      ) : (
                        'No funds match these filters. Try clearing the search or category.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && !preset && (
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

        {/* Heatmap legend */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
          <span className="font-semibold uppercase tracking-wider text-slate-400">Return heatmap:</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-3 rounded bg-emerald-200/80" />&gt; 25%</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-3 rounded bg-emerald-100/80" />15–25%</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-3 rounded bg-emerald-50" />8–15%</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-3 rounded bg-slate-50" />0–8%</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-3 rounded bg-rose-100/70" />–10%</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-3 rounded bg-rose-200/80" />&lt; –10%</span>
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

      <CalculatorCTA
        heading="Found funds you like? See how they fit YOUR portfolio."
        subtext="Fund research is the start, not the answer. Our team will review your existing holdings against your goals and risk profile — and show you exactly what to keep, what to consolidate, and what to switch. Free, no obligation."
      />
    </main>
  );
}

// Wrap in Suspense because useSearchParams requires it during prerender
export default function FundUniversePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <FundUniversePageInner />
    </Suspense>
  );
}
