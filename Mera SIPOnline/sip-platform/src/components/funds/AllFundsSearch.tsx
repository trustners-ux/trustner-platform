'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Loader2, TrendingUp, SearchX,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { generateFundSlug } from '@/lib/utils/fund-slug';

/* ─── Types ─── */

interface SearchResult {
  schemeCode: number;
  schemeName: string;
}

/* ─── Category quick-search keywords ─── */

const CATEGORY_KEYWORDS = [
  { label: 'Large Cap', query: 'Large Cap Growth' },
  { label: 'Mid Cap', query: 'Mid Cap Growth' },
  { label: 'Small Cap', query: 'Small Cap Growth' },
  { label: 'Flexi Cap', query: 'Flexi Cap Growth' },
  { label: 'Multi Cap', query: 'Multi Cap Growth' },
  { label: 'ELSS', query: 'ELSS Tax Saver Growth' },
  { label: 'Index', query: 'Nifty Index Growth' },
  { label: 'Large & Mid', query: 'Large Mid Cap Growth' },
  { label: 'Value', query: 'Value Fund Growth' },
  { label: 'Balanced', query: 'Balanced Advantage Growth' },
  { label: 'Hybrid', query: 'Aggressive Hybrid Growth' },
  { label: 'Debt', query: 'Short Duration Fund Growth' },
  { label: 'Liquid', query: 'Liquid Fund Growth' },
  { label: 'Sectoral', query: 'Sectoral Theme Growth' },
  { label: 'International', query: 'International Fund Growth' },
  { label: 'Gold', query: 'Gold Fund Growth' },
];

/* ─── Helpers ─── */

function formatReturn(val: number | null): { text: string; color: string } {
  if (val === null || val === 0) return { text: '--', color: 'text-gray-400' };
  const pct = val * 100;
  return {
    text: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    color: pct >= 0 ? 'text-green-600' : 'text-red-500',
  };
}

/* ─── Main Component ─── */

export function AllFundsSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);
  const [enrichedData, setEnrichedData] = useState<Record<number, {
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
    nav: number | null;
    fundHouse: string;
  }>>({});
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search MFapi
  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);
    setEnrichedData({});

    try {
      const res = await fetch(
        `/api/funds/search?q=${encodeURIComponent(searchQuery.trim())}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
        // Filter to show only Regular Growth plans
        const filtered = data.results.filter((r: SearchResult) => {
          const name = r.schemeName.toLowerCase();
          // Exclude direct plans
          if (name.includes('direct')) return false;
          // Prefer growth plans
          if (name.includes('growth') || name.includes('regular')) return true;
          // Also include if no plan type specified
          return !name.includes('idcw') && !name.includes('dividend') && !name.includes('bonus');
        });

        // Fall back to all results if filtering removes everything
        setResults(filtered.length > 0 ? filtered : data.results);
      } else {
        setResults([]);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Search error:', err);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Enrich results with NAV data (lazy - fetch first 5)
  useEffect(() => {
    if (results.length === 0) return;

    const toEnrich = results.slice(0, 8);
    let cancelled = false;

    async function enrichFunds() {
      for (const fund of toEnrich) {
        if (cancelled) break;
        try {
          const res = await fetch(`/api/funds/live-nav?code=${fund.schemeCode}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (cancelled) break;
          setEnrichedData(prev => ({
            ...prev,
            [fund.schemeCode]: {
              oneYear: data.returns?.oneYear ?? null,
              threeYear: data.returns?.threeYear ?? null,
              fiveYear: data.returns?.fiveYear ?? null,
              nav: data.currentNav ?? null,
              fundHouse: data.fundHouse ?? '',
            }
          }));
        } catch {
          // Skip enrichment errors
        }
      }
    }

    enrichFunds();
    return () => { cancelled = true; };
  }, [results]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveKeyword(null);
    doSearch(query);
  };

  // Handle category keyword click
  const handleKeywordClick = (kw: typeof CATEGORY_KEYWORDS[0]) => {
    setQuery(kw.query);
    setActiveKeyword(kw.label);
    doSearch(kw.query);
  };

  return (
    <div>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any fund — e.g. HDFC Top 100, SBI Bluechip, Nifty 50 Index..."
            className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg text-sm font-semibold transition-all',
              loading || !query.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>
      </form>

      {/* Category keyword buttons */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2.5">
          <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Browse by Category
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_KEYWORDS.map((kw) => (
            <button
              key={kw.label}
              onClick={() => handleKeywordClick(kw)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                activeKeyword === kw.label
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700 hover:bg-teal-50'
              )}
            >
              {kw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Loader2 className="w-8 h-8 text-teal-500 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-500">Searching across 37,000+ mutual fund schemes...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <SearchX className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">No funds found</h3>
          <p className="text-sm text-gray-500">
            Try a different search term, fund name, or AMC name.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-700">{results.length}</span> results
              {results.length >= 20 && (
                <span className="text-gray-400 ml-1">(refine search for more)</span>
              )}
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[280px]">
                      Fund Name
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      NAV
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      1Y Return
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      3Y Return
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      5Y Return
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.map((fund) => {
                    const enriched = enrichedData[fund.schemeCode];
                    const oneY = formatReturn(enriched?.oneYear ?? null);
                    const threeY = formatReturn(enriched?.threeYear ?? null);
                    const fiveY = formatReturn(enriched?.fiveYear ?? null);

                    return (
                      <tr
                        key={fund.schemeCode}
                        className="hover:bg-teal-50/40 transition-colors group"
                      >
                        <td className="px-4 py-3 min-w-[280px]">
                          <Link
                            href={`/funds/${generateFundSlug(fund.schemeCode, fund.schemeName)}`}
                            className="text-sm font-medium text-gray-900 hover:text-teal-700 transition-colors line-clamp-1 group-hover:text-teal-700"
                          >
                            {fund.schemeName}
                          </Link>
                          {enriched?.fundHouse && (
                            <p className="text-[11px] text-gray-400 mt-0.5">{enriched.fundHouse}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700 whitespace-nowrap">
                          {enriched?.nav ? `₹${enriched.nav.toFixed(2)}` : (
                            <span className="inline-block w-16 h-4 bg-gray-100 rounded animate-pulse" />
                          )}
                        </td>
                        <td className={cn('px-4 py-3 text-right text-sm font-semibold', oneY.color)}>
                          {enriched ? oneY.text : (
                            <span className="inline-block w-14 h-4 bg-gray-100 rounded animate-pulse" />
                          )}
                        </td>
                        <td className={cn('px-4 py-3 text-right text-sm font-semibold', threeY.color)}>
                          {enriched ? threeY.text : (
                            <span className="inline-block w-14 h-4 bg-gray-100 rounded animate-pulse" />
                          )}
                        </td>
                        <td className={cn('px-4 py-3 text-right text-sm font-semibold', fiveY.color)}>
                          {enriched ? fiveY.text : (
                            <span className="inline-block w-14 h-4 bg-gray-100 rounded animate-pulse" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {results.map((fund) => {
              const enriched = enrichedData[fund.schemeCode];
              const oneY = formatReturn(enriched?.oneYear ?? null);
              const threeY = formatReturn(enriched?.threeYear ?? null);
              const fiveY = formatReturn(enriched?.fiveYear ?? null);

              return (
                <div key={fund.schemeCode} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <Link
                    href={`/funds/${generateFundSlug(fund.schemeCode, fund.schemeName)}`}
                    className="font-semibold text-sm text-gray-900 hover:text-teal-700 transition-colors line-clamp-2 mb-1 block"
                  >
                    {fund.schemeName}
                  </Link>
                  {enriched?.fundHouse && (
                    <p className="text-[11px] text-gray-400 mb-3">{enriched.fundHouse}</p>
                  )}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] text-gray-500">1Y</div>
                      <div className={cn('text-sm font-bold', oneY.color)}>
                        {enriched ? oneY.text : '...'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">3Y</div>
                      <div className={cn('text-sm font-bold', threeY.color)}>
                        {enriched ? threeY.text : '...'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">5Y</div>
                      <div className={cn('text-sm font-bold', fiveY.color)}>
                        {enriched ? fiveY.text : '...'}
                      </div>
                    </div>
                  </div>
                  {enriched?.nav && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <span>NAV <span className="font-medium text-gray-700">₹{enriched.nav.toFixed(2)}</span></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Return data loads progressively. Click any fund name for detailed analysis.
          </p>
        </div>
      )}

      {!searched && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            Search All Indian Mutual Funds
          </h3>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Search across 37,000+ schemes from 40+ AMCs. Type a fund name, AMC, or select a category
            above to discover any mutual fund in India.
          </p>
        </div>
      )}
    </div>
  );
}
