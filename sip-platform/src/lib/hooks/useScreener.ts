'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { CURRENT_TRUSTNER_LIST } from '@/data/funds/trustner';
import { FUND_CATEGORIES } from '@/data/funds/categories';
import type { FundCategory, TrustnerCuratedFund } from '@/types/funds';

// ─── Types ───

export type SortField = 'oneYear' | 'threeYear' | 'fiveYear' | 'aumCr' | 'ter' | 'sharpeRatio' | 'rank';
export type SortDirection = 'asc' | 'desc';
export type RiskLevel = 'Low' | 'Moderate' | 'Moderately High' | 'High' | 'Very High';

export interface ScreenerFilterState {
  category: string | null;
  minRating: number | null;       // Not applicable to Trustner data (no per-fund rating)
  aumMin: number | null;          // In Crores
  aumMax: number | null;          // In Crores
  expenseRatioMax: number | null; // Decimal (e.g. 0.03 = 3%)
  minThreeYearReturn: number | null; // Decimal (e.g. 0.15 = 15%)
  riskLevels: RiskLevel[];
}

export interface ScreenerFund extends TrustnerCuratedFund {
  categoryDisplayName: string;
  riskLevel: string;
}

const INITIAL_FILTERS: ScreenerFilterState = {
  category: null,
  minRating: null,
  aumMin: null,
  aumMax: null,
  expenseRatioMax: null,
  minThreeYearReturn: null,
  riskLevels: [],
};

// Map category name to risk level from FUND_CATEGORIES
const CATEGORY_RISK_MAP: Record<string, string> = {};
FUND_CATEGORIES.forEach((c) => { CATEGORY_RISK_MAP[c.name] = c.riskLevel; });

// Flatten all funds with enrichments
const ALL_SCREENER_FUNDS: ScreenerFund[] = CURRENT_TRUSTNER_LIST.categories.flatMap((cat) =>
  cat.funds.map((f) => ({
    ...f,
    categoryDisplayName: cat.displayName,
    riskLevel: CATEGORY_RISK_MAP[cat.name] || 'Moderate',
  }))
);

export function useScreener() {
  const [filters, setFilters] = useState<ScreenerFilterState>(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState<SortField>('threeYear');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [debouncedFilters, setDebouncedFilters] = useState<ScreenerFilterState>(INITIAL_FILTERS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce filter changes (250ms)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [filters]);

  const totalFunds = ALL_SCREENER_FUNDS.length;

  const setFilter = useCallback(<K extends keyof ScreenerFilterState>(
    key: K,
    value: ScreenerFilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        // Default sort direction per field type
        setSortDirection(field === 'ter' || field === 'rank' ? 'asc' : 'desc');
      }
      return field;
    });
  }, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedFilters.category) count++;
    if (debouncedFilters.aumMin !== null) count++;
    if (debouncedFilters.aumMax !== null) count++;
    if (debouncedFilters.expenseRatioMax !== null) count++;
    if (debouncedFilters.minThreeYearReturn !== null) count++;
    if (debouncedFilters.riskLevels.length > 0) count++;
    return count;
  }, [debouncedFilters]);

  // Filter + sort
  const results = useMemo(() => {
    let filtered = ALL_SCREENER_FUNDS;
    const f = debouncedFilters;

    // Category filter
    if (f.category) {
      filtered = filtered.filter((fund) => fund.category === f.category);
    }

    // AUM range
    if (f.aumMin !== null) {
      filtered = filtered.filter((fund) => fund.aumCr >= f.aumMin!);
    }
    if (f.aumMax !== null) {
      filtered = filtered.filter((fund) => fund.aumCr <= f.aumMax!);
    }

    // Expense ratio max (compare as decimals)
    if (f.expenseRatioMax !== null) {
      filtered = filtered.filter((fund) => fund.ter <= f.expenseRatioMax!);
    }

    // Min 3Y return (compare as decimals)
    if (f.minThreeYearReturn !== null) {
      filtered = filtered.filter(
        (fund) => fund.returns.threeYear > 0 && fund.returns.threeYear >= f.minThreeYearReturn!
      );
    }

    // Risk levels
    if (f.riskLevels.length > 0) {
      filtered = filtered.filter((fund) =>
        f.riskLevels.includes(fund.riskLevel as RiskLevel)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortBy) {
        case 'oneYear':   aVal = a.returns.oneYear;   bVal = b.returns.oneYear;   break;
        case 'threeYear': aVal = a.returns.threeYear;  bVal = b.returns.threeYear; break;
        case 'fiveYear':  aVal = a.returns.fiveYear;   bVal = b.returns.fiveYear;  break;
        case 'aumCr':     aVal = a.aumCr;              bVal = b.aumCr;             break;
        case 'ter':       aVal = a.ter;                bVal = b.ter;               break;
        case 'sharpeRatio': aVal = a.sharpeRatio;      bVal = b.sharpeRatio;       break;
        case 'rank':      aVal = a.rank;               bVal = b.rank;              break;
        default:          aVal = a.returns.threeYear;   bVal = b.returns.threeYear;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [debouncedFilters, sortBy, sortDirection]);

  return {
    filters,
    setFilter,
    results,
    totalFunds,
    sortBy,
    setSortBy: handleSort,
    sortDirection,
    toggleSortDirection,
    resetFilters,
    activeFilterCount,
  };
}
