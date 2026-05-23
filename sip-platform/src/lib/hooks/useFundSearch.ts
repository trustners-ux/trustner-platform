'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FundSearchResult } from '@/types/live-fund';

export function useFundSearch(debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FundSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      // Abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/funds/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.results || []);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError('Search failed. Please try again.');
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, debounceMs]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return { query, setQuery, results, loading, error, clear };
}
