/**
 * FundHeaderCanonical
 *
 * Hero band for the canonical per-fund detail page at /funds/[amfi_code].
 * Shows scheme name, AMC, category, riskometer, live NAV with timestamp,
 * and the CTA buttons. Direct-plan schemes suppress the Start-SIP CTA
 * (MFD compliance — Trustner serves Regular plans).
 */

import Link from 'next/link';
import { Star, ShieldCheck, MessageCircle, TrendingUp, Info } from 'lucide-react';
import type { FundDetail } from '@/lib/services/pd-fund-detail';
import { isDirectPlan } from '@/lib/services/pd-fund-detail';

interface Props {
  fund: FundDetail;
}

const fmtINR = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

const RISK_TONE: Record<string, string> = {
  Low: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  'Low to Moderate': 'bg-lime-500/15 text-lime-200 border-lime-400/30',
  Moderate: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  'Moderately High': 'bg-orange-500/15 text-orange-200 border-orange-400/30',
  High: 'bg-rose-500/15 text-rose-200 border-rose-400/30',
  'Very High': 'bg-red-600/20 text-red-200 border-red-400/30',
};

export function FundHeaderCanonical({ fund }: Props) {
  const directPlan = isDirectPlan(fund.scheme_name);
  const riskTone = (fund.riskometer && RISK_TONE[fund.riskometer]) || 'bg-white/10 text-white border-white/20';
  const navTs = fund.live_nav_at ? new Date(fund.live_nav_at) : null;

  return (
    <section className="relative overflow-hidden bg-hero-pattern text-white">
      <div className="container-custom py-10 lg:py-14">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-300/80 mb-6">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-1">/</span>
          <Link href="/funds" className="hover:text-white transition-colors">Funds</Link>
          <span className="mx-1">/</span>
          <Link href="/funds/universe" className="hover:text-white transition-colors">Universe</Link>
          <span className="mx-1">/</span>
          <span className="text-slate-400 truncate max-w-[280px]">{fund.scheme_name}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
          {/* Left — name + badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {fund.trustner_preferred && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-xs font-semibold">
                  <Star className="w-3 h-3 fill-amber-300" />
                  Trustner Preferred
                </span>
              )}
              {fund.external_category && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium">
                  {fund.external_category}
                </span>
              )}
              {fund.broad_bucket && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-100 text-xs font-medium">
                  {fund.broad_bucket}
                </span>
              )}
              {fund.riskometer && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${riskTone}`}>
                  <ShieldCheck className="w-3 h-3" />
                  Risk: {fund.riskometer}
                </span>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight">
              {fund.scheme_name}
            </h1>
            {fund.amc_name && (
              <p className="mt-1.5 text-sm text-slate-300">{fund.amc_name} · AMFI Code {fund.amfi_code}</p>
            )}
          </div>

          {/* Right — NAV card + CTAs */}
          <div className="lg:min-w-[320px]">
            <div className="bg-white/[0.06] backdrop-blur border border-white/10 rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Latest NAV</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums">
                  ₹{fund.live_nav != null ? fmtINR(fund.live_nav) : '—'}
                </span>
              </div>
              {navTs && (
                <div className="mt-1 text-[11px] text-slate-400">
                  As of {navTs.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              )}
              {typeof fund.returns_1y === 'number' && (
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                  <span className={fund.returns_1y >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                    {fund.returns_1y >= 0 ? '+' : ''}{fund.returns_1y.toFixed(2)}% (1Y)
                  </span>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                {!directPlan ? (
                  <Link
                    href={`/start?fund=${encodeURIComponent(fund.amfi_code)}&name=${encodeURIComponent(fund.scheme_name)}`}
                    className="inline-flex items-center justify-center gap-2 bg-white text-brand font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Start SIP through Trustner
                  </Link>
                ) : (
                  <div className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-400/20 rounded-md px-3 py-2 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      This is a Direct Plan. Trustner is an AMFI-registered Mutual Fund Distributor (ARN-286886) and services Regular plans. Talk to us about the Regular plan equivalent.
                    </span>
                  </div>
                )}
                <a
                  href="#talk-to-trustner"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-white/15 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Talk to Trustner about this fund
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
