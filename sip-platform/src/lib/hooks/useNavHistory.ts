'use client';

import { useState, useEffect } from 'react';
import { NavHistoryPoint } from '@/types/live-fund';

export function useNavHistory(
  schemeCode: number | null,
  period: '1Y' | '3Y' | '5Y' | 'MAX' = '3Y'
) {
  const [data, setData] = useState<NavHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schemeCode) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/funds/${schemeCode}/nav-history?period=${period}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load NAV history');
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [schemeCode, period]);

  return { data, loading, error };
}
