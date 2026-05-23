'use client';

import { useState, useEffect } from 'react';
import { LiveFundDetail } from '@/types/live-fund';

export function useFundDetail(schemeCode: number | null) {
  const [fund, setFund] = useState<LiveFundDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schemeCode) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/funds/${schemeCode}`)
      .then((res) => {
        if (!res.ok) throw new Error('Fund not found');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setFund(data);
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
  }, [schemeCode]);

  return { fund, loading, error };
}
