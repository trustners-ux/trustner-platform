'use client';

import { useFundSearch } from '@/lib/hooks/useFundSearch';
import { generateFundSlug } from '@/lib/utils/fund-slug';
import { useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';

interface FundSearchInputProps {
  onSelect?: (schemeCode: number, slug: string) => void;
  placeholder?: string;
  mode?: 'navigate' | 'select';
}

export function FundSearchInput({
  onSelect,
  placeholder = 'Search mutual funds...',
  mode = 'navigate',
}: FundSearchInputProps) {
  const router = useRouter();
  const { query, setQuery, results, loading, error, clear } = useFundSearch();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(schemeCode: number, schemeName: string) {
    const slug = generateFundSlug(schemeCode, schemeName);
    if (mode === 'navigate') {
      router.push(`/funds/${slug}`);
    } else if (onSelect) {
      onSelect(schemeCode, slug);
    }
    clear();
    setIsOpen(false);
  }

  const showDropdown =
    isOpen && query.trim().length >= 2 && (results.length > 0 || loading || error);
  const showNoResults =
    isOpen &&
    query.trim().length >= 2 &&
    results.length === 0 &&
    !loading &&
    !error;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none text-sm transition-all"
        />

        {/* Loading spinner or clear button */}
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : query.length > 0 ? (
          <button
            onClick={() => {
              clear();
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute mt-1 w-full bg-white rounded-xl shadow-lg border max-h-80 overflow-y-auto z-50">
          {error && (
            <div className="px-4 py-3 text-sm text-red-500">{error}</div>
          )}
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
          )}
          {results.map((fund) => (
            <button
              key={fund.schemeCode}
              onClick={() => handleSelect(fund.schemeCode, fund.schemeName)}
              className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <div className="font-medium text-sm text-gray-900">
                {fund.schemeName}
              </div>
              {(fund.fundHouse || fund.category) && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {[fund.fundHouse, fund.category].filter(Boolean).join(' \u00B7 ')}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showNoResults && (
        <div className="absolute mt-1 w-full bg-white rounded-xl shadow-lg border z-50">
          <div className="px-4 py-3 text-sm text-gray-500">
            No results found for &ldquo;{query}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}
