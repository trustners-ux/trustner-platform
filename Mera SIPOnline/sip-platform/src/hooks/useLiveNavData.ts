'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FundNavData, NavUpdateResult } from '@/types/funds';

interface LiveNavState {
  navMap: Map<number, FundNavData>;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and cache live NAV data from the public endpoint.
 * Returns a Map keyed by schemeCode for O(1) lookup.
 */
export function useLiveNavData() {
  const [state, setState] = useState<LiveNavState>({
    navMap: new Map(),
    updatedAt: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchNav() {
      try {
        const res = await fetch('/api/funds/nav-data');
        if (!res.ok) throw new Error('Failed to fetch NAV data');

        const data: NavUpdateResult = await res.json();

        if (!cancelled) {
          const map = new Map<number, FundNavData>();
          if (data.funds) {
            for (const fund of data.funds) {
              map.set(fund.schemeCode, fund);
            }
          }
          setState({
            navMap: map,
            updatedAt: data.updatedAt || null,
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
