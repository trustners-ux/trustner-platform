'use client';

import Link from 'next/link';
import { ChevronRight, TrendingUp, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { StarRating } from '@/components/funds/StarRatingShared';
import type { LiveFundDetail } from '@/types/live-fund';

const RISK_COLORS: Record<string, string> = {
  Low: 'bg-green-400/20 text-green-200 border-green-400/30',
  Moderate: 'bg-brand-400/20 text-brand-200 border-brand-400/30',
  'Moderately High': 'bg-amber-400/20 text-amber-200 border-amber-400/30',
  High: 'bg-orange-400/20 text-orange-200 border-orange-400/30',
  'Very High': 'bg-red-400/20 text-red-200 border-red-400/30',
};

interface FundDetailHeroProps {
  fund: LiveFundDetail;
}

export function FundDetailHero({ fund }: FundDetailHeroProps) {
  const category = fund.enriched?.category || fund.schemeCategory;
  const riskLevel = fund.schemeType?.includes('Open')
    ? fund.schemeCategory?.includes('Small') || fund.schemeCategory?.includes('Mid')
      ? 'High'
      : fund.schemeCategory?.includes('Large')
        ? 'Moderate'
        : 'Moderately High'
    : 'Moderate';

  const riskStyle = RISK_COLORS[riskLevel] || RISK_COLORS['Moderate'];

  return (
    <section className="relative overflow-hidden bg-hero-pattern text-white">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

      <div className="container-custom relative z-10 py-10 lg:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/funds" className="hover:text-white transition-colors">Funds</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/funds" className="hover:text-white transition-colors">Explore</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-300 truncate max-w-[200px] sm:max-w-none">
            {fund.enriched?.shortName || fund.schemeName}
          </span>
        </nav>

        <div className="max-w-4xl animate-in">
          {/* Fund house badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-4 backdrop-blur-sm">
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
            {fund.fundHouse}
          </div>

          {/* Fund name */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 leading-tight">
            {fund.schemeName}
          </h1>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[10px] font-semibold px-3 py-1 rounded-full border bg-white/10 text-white/90 border-white/20 uppercase tracking-wider">
              {category}
            </span>
            <span className={cn('text-[10px] font-semibold px-3 py-1 rounded-full border uppercase tracking-wider', riskStyle)}>
              {riskLevel} Risk
            </span>
            {fund.enriched?.fundRating && fund.enriched.fundRating > 0 && (
              <StarRating rating={fund.enriched.fundRating} size="md" />
            )}
          </div>

          {/* Current NAV */}
          <div className="flex items-baseline gap-3">
            <span className="text-sm text-slate-400">Current NAV</span>
            <span className="text-2xl font-bold text-white">
              <IndianRupee className="w-4 h-4 inline -mt-1" />
              {fund.currentNav.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">as on {fund.navDate}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
