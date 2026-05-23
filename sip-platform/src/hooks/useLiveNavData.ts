'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FundNavData, NavUpdateResult } from '@/types/funds';

interface LiveNavState {
  navMap: Map<number, FundNavData>;
  updatedAt: string | null;          // when the cron LAST RAN (not for display)
  latestNavDate: string | null;      // actual NAV publication date from AMFI (DD-MM-YYYY)
  latestNavDateFormatted: string | null; // human-readable e.g. "30 Apr 2026"
  isLoading: boolean;
  error: string | null;
}

/**
 * Convert DD-MM-YYYY → "30 Apr 2026" for display.
 * Falls back to the input string if parsing fails.
 */
function formatNavDate(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split('-').map(Number);
  if (!dd || !mm || !yyyy) return ddmmyyyy;
  const d = new Date(yyyy, mm - 1, dd);
  if (isNaN(d.getTime())) return ddmmyyyy;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Find the latest NAV date across all funds in the map.
 * Returns the date as DD-MM-YYYY (matches the source format).
 */
function findLatestNavDate(navMap: Map<number, FundNavData>): string | null {
  let latest: { date: Date; raw: string } | null = null;
  for (const fund of navMap.values()) {
    const raw = fund.latestNavDate;
    if (!raw) continue;
    const [dd, mm, yyyy] = raw.split('-').map(Number);
    if (!dd || !mm || !yyyy) continue;
    const d = new Date(yyyy, mm - 1, dd);
    if (isNaN(d.getTime())) continue;
    if (!latest || d > latest.date) {
      latest = { date: d, raw };
    }
  }
  return latest?.raw ?? null;
}

/**
 * Hook to fetch and cache live NAV data from the public endpoint.
 * Returns a Map keyed by schemeCode for O(1) lookup.
 */
export function useLiveNavData() {
  const [state, setState] = useState<LiveNavState>({
    navMap: new Map(),
    updatedAt: null,
    latestNavDate: null,
    latestNavDateFormatted: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchNav() {
      try {
        // Try primary path, fall back to alternate
        let res = await fetch('/api/funds/nav-data');
        if (!res.ok) {
          res = await fetch('/api/nav-data');
        }
        if (!res.ok) throw new Error('Failed to fetch NAV data');

        const data: NavUpdateResult = await res.json();

        if (!cancelled) {
          const map = new Map<number, FundNavData>();
          if (data.funds) {
            for (const fund of data.funds) {
              map.set(fund.schemeCode, fund);
            }
          }
          const latestNavDate = findLatestNavDate(map);
          setState({
            navMap: map,
            updatedAt: data.updatedAt || null,
            latestNavDate,
            latestNavDateFormatted: latestNavDate ? formatNavDate(latestNavDate) : null,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          }));
        }
      }
    }

    fetchNav();
    return () => { cancelled = true; };
  }, []);

  /**
   * Get live NAV data for a specific fund by schemeCode.
   */
  const getNavData = useCallback(
    (schemeCode?: number): FundNavData | undefined => {
      if (!schemeCode) return undefined;
      return state.navMap.get(schemeCode);
    },
    [state.navMap]
  );

  /**
   * Get a live return value. Falls back to static value if live isn't available.
   */
  const getLiveReturn = useCallback(
    (
      schemeCode: number | undefined,
      period: keyof FundNavData['returns'],
      staticValue?: number
    ): number | undefined => {
      if (!schemeCode) return staticValue;
      const nav = state.navMap.get(schemeCode);
      if (!nav) return staticValue;
      const liveVal = nav.returns[period];
      return liveVal !== null ? liveVal : staticValue;
    },
    [state.navMap]
  );

  return {
    ...state,
    hasData: state.navMap.size > 0,
    getNavData,
    getLiveReturn,
  };
}
