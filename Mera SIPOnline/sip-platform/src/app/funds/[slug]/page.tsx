'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { parseSlugCode } from '@/lib/utils/fund-slug';
import { useFundDetail } from '@/lib/hooks/useFundDetail';
import { FundDetailSkeleton } from '@/components/funds/FundLoadingSkeleton';
import { FundDetailHero } from '@/components/funds/FundDetailHero';
import { FundMetricsGrid } from '@/components/funds/FundMetricsGrid';
import { FundReturnsTable } from '@/components/funds/FundReturnsTable';
import { NavChart } from '@/components/funds/NavChart';
import { InvestmentDetails } from '@/components/funds/InvestmentDetails';
import { PeerComparisonTable } from '@/components/funds/PeerComparisonTable';
import { DISCLAIMER } from '@/lib/constants/company';

/**
 * Resolves a text-based slug to a numeric scheme code by searching MFapi.
 * Converts hyphens to spaces and uses the search API.
 */
async function resolveSlugToCode(slug: string): Promise<number | null> {
  try {
    // Convert slug to search query: "whiteoak-capital-large-cap-fund" → "whiteoak capital large cap fund"
    const query = slug.replace(/-/g, ' ').trim();
    if (!query) return null;

    const res = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;

    const data = await res.json();
    // API returns { results: [...] }
    if (data.results && data.results.length > 0) {
      return data.results[0].schemeCode;
    }
    return null;
  } catch {
    return null;
  }
}

export default function FundDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  // Try direct numeric parse first
  const directCode = parseSlugCode(slug);

  // State for resolved code (when slug is non-numeric)
  const [resolvedCode, setResolvedCode] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveFailed, setResolveFailed] = useState(false);

  // The effective scheme code to use
  const schemeCode = directCode || resolvedCode;

  // Resolution effect for non-numeric slugs
  useEffect(() => {
    if (directCode) return; // Already have a numeric code
    if (!slug) return;

    let cancelled = false;
    setResolving(true);
    setResolveFailed(false);

    resolveSlugToCode(slug).then((code) => {
      if (cancelled) return;
      if (code) {
        setResolvedCode(code);
      } else {
        setResolveFailed(true);
      }
      setResolving(false);
    });

    return () => { cancelled = true; };
  }, [slug, directCode]);

  const { fund, loading, error } = useFundDetail(schemeCode);

  // Resolving state (searching MFapi by name)
  if (resolving) {
    return (
      <>
        <section className="relative overflow-hidden bg-hero-pattern text-white">
          <div className="container-custom py-10 lg:py-14">
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-1">/</span>
              <Link href="/funds" className="hover:text-white transition-colors">Funds</Link>
              <span className="mx-1">/</span>
              <span className="text-slate-500">Resolving...</span>
            </nav>
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-teal-300" />
              <div>
                <h1 className="text-lg font-semibold">Resolving fund...</h1>
                <p className="text-sm text-slate-400">Looking up fund details, please wait.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="section-padding bg-surface-100">
          <div className="container-custom">
            <FundDetailSkeleton />
          </div>
        </section>
      </>
    );
  }

  // Resolution failed — could not find the fund by name
  if (resolveFailed || (!schemeCode && !resolving)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-surface-100">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary-700 mb-2">Fund Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">
            We couldn&apos;t find a fund matching &quot;{slug.replace(/-/g, ' ')}&quot;.
            The fund may have been renamed, merged, or closed.
          </p>
          <Link
            href="/funds"
            className="inline-flex items-center gap-2 btn-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Fund Explorer
          </Link>
        </div>
      </div>
    );
  }

  // Loading fund detail (after schemeCode is resolved)
  if (loading) {
    return (
      <>
        <section className="relative overflow-hidden bg-hero-pattern text-white">
          <div className="container-custom py-10 lg:py-14">
            <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-1">/</span>
              <Link href="/funds" className="hover:text-white transition-colors">Funds</Link>
              <span className="mx-1">/</span>
              <span className="text-slate-500">Loading...</span>
            </nav>
            <div className="animate-pulse">
              <div className="h-4 bg-white/10 rounded w-40 mb-4" />
              <div className="h-8 bg-white/10 rounded w-96 mb-3" />
              <div className="h-4 bg-white/10 rounded w-64" />
            </div>
          </div>
        </section>
        <section className="section-padding bg-surface-100">
          <div className="container-custom">
            <FundDetailSkeleton />
          </div>
        </section>
      </>
    );
  }

  // Error state
  if (error || !fund) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-surface-100">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary-700 mb-2">
            {error === 'Fund not found' ? 'Fund Not Found' : 'Something Went Wrong'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {error === 'Fund not found'
              ? `We couldn't find a fund with scheme code ${schemeCode}. It may have been merged or closed.`
              : `Failed to load fund data. ${error || 'Please try again later.'}`}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/funds"
              className="inline-flex items-center gap-2 bg-surface-200 text-primary-700 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-surface-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Funds
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 btn-primary"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success - render fund detail
  return (
    <>
      {/* Hero with breadcrumb, fund name, badges, NAV */}
      <FundDetailHero fund={fund} />

      {/* Key metrics grid */}
      <FundMetricsGrid fund={fund} />

      {/* Returns table */}
      <FundReturnsTable fund={fund} />

      {/* NAV history chart */}
      <NavChart schemeCode={fund.schemeCode} />

      {/* Investment details */}
      <InvestmentDetails fund={fund} />

      {/* Peer comparison table */}
      {fund.enriched?.comparison && fund.enriched.comparison.length > 0 && (
        <PeerComparisonTable
          peers={fund.enriched.comparison}
          currentFundName={fund.enriched?.shortName || fund.schemeName}
        />
      )}

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <div className="bg-white rounded-lg p-4 mb-3">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              <strong className="text-slate-600">Data Disclaimer:</strong> Fund data is sourced
              from MFapi.in and Kuvera (via Captnemo). Returns shown are historical and do not
              guarantee future performance. Always verify with official AMC sources before investing.
            </p>
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.mutual_fund} {DISCLAIMER.amfi} | {DISCLAIMER.sebi_investor}
          </p>
        </div>
      </section>
    </>
  );
}
