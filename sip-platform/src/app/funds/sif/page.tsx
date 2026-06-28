import { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck, MessageCircle, BadgeCheck, AlertTriangle, BookOpen,
  ArrowRight, ChevronRight, Building2, Database,
} from 'lucide-react';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';
import { getSifUniverseRich } from '@/lib/services/sif-data';
import SifUniverseTable from './SifUniverseTable';

export const revalidate = 1800; // 30 min — matches the merasif SIF engine cache

export const metadata: Metadata = generateSEOMetadata({
  title: 'Live SIF Fund Universe — NAV, 1D/5D/1M/3M & Since-Inception Returns 2026',
  description:
    'The complete live tracker of every Specialized Investment Fund (SIF) in India — official AMFI NAVs (Regular-Growth), 1D / 5D / 1M / 3M and since-inception returns, AUM, risk band, TER and the Trustner Fund Score with verdicts. Hybrid, Equity, Ex-Top-100, Active Asset Allocator and Sector Rotation long-short funds. Trustner is an AMFI-registered SIF Distributor empanelled with every SIF house (ARN-286886).',
  path: '/funds/sif',
  keywords: [
    'SIF NAV today', 'SIF returns', 'SIF performance', 'live SIF tracker', 'SIF funds India',
    'list of SIF funds', 'specialized investment fund NAV', 'hybrid long short fund', 'SIF since inception return',
  ],
});

export default async function SifUniversePage() {
  const u = await getSifUniverseRich();
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Funds', url: '/funds' },
    { name: 'Specialized Investment Funds (SIF)', url: '/funds/sif' },
  ]);
  const wa = COMPANY.contact?.whatsapp?.replace('+', '') || '916003903737';
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent('Hi Trustner, I want the current SIF list and to discuss which SIF fits my portfolio. Please guide me.')}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb */}
      <div className="bg-surface-100 border-b border-surface-200">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/sif" className="hover:text-brand transition-colors">SIF</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-700 font-medium">Live SIF Universe</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-hero-pattern text-white py-14 lg:py-16">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-5 border border-white/10">
              <BadgeCheck className="w-3.5 h-3.5 text-accent" />
              <span>Official AMFI data{u.navAsOf ? ` · NAVs as of ${u.navAsOf}` : ''}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              The Live SIF{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">Fund Universe</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              Every Specialized Investment Fund in India — <strong className="text-white">{u.total} SIFs</strong> across{' '}
              <strong className="text-white">{u.amcCount} AMCs</strong> — with official AMFI NAVs, exact since-inception,
              1M &amp; 3M returns, AUM, risk band and TER, plus the proprietary <strong className="text-white">Trustner Fund Score</strong>.
              Only officially-sourced data. Every one carries a ₹10 lakh minimum.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-amber-300 transition-colors text-sm">
                <MessageCircle className="w-4 h-4" /> Get the curated list from Trustner
              </a>
              <Link href="/sif" className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors text-sm">
                <BookOpen className="w-4 h-4" /> What is a SIF?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust + source strip */}
      <section className="bg-white border-b border-surface-200">
        <div className="container-custom py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary-700">
              <ShieldCheck className="w-4 h-4 text-brand" /> {COMPANY.mfEntity?.name ?? 'Trustner Asset Services Pvt. Ltd.'}
            </span>
            <span>AMFI-registered SIF Distributor · {COMPANY.mfEntity?.amfiArn ?? 'ARN-286886'} · empanelled with every SIF house</span>
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Database className="w-3.5 h-3.5" /> Source: AMFI official SIF NAV feed (amfiindia.com)
            </span>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">

            {/* sub-1-year flag */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                Every live SIF launched in 2025&ndash;26, so <strong>all carry under one year of track record</strong>. Returns are shown for context only — <strong>past performance is not indicative of future results</strong>, and these strategies use derivatives and short positions. Read the ISID, SID, SAI and KIM before investing.
              </p>
            </div>

            {/* Category summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              {u.byCat.map((s) => (
                <div key={s.cat} className="rounded-xl border border-surface-200 bg-surface-100 p-4 text-center">
                  <div className="text-2xl font-extrabold text-brand tabular-nums">{s.count}</div>
                  <div className="text-[11px] font-semibold text-primary-700 leading-tight mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* The live universe table */}
            <SifUniverseTable data={u} />

            {/* Sourcing note */}
            <p className="text-[11px] text-slate-500 leading-relaxed mt-4">
              <strong className="text-slate-600">Every figure here is real and sourced.</strong> <strong>NAV</strong> is the official
              AMFI SIF NAV (Regular-Growth plan), refreshed daily; <strong>SI</strong> is exact — NAV vs the fund&rsquo;s NFO face value
              (₹10; ₹1,000 for Diviniti and Sapphire). <strong>1D/5D</strong> compute from our archive of official daily NAVs and appear
              as the archive builds. <strong>1M &amp; 3M returns, AUM, risk band and TER</strong> are Regular-plan figures from{' '}
              <strong>Value Research</strong> until the official archive spans those windows. <strong>TFS</strong> (Trustner Fund Score) and
              the verdict are the Trustner Research Desk&rsquo;s proprietary educational view, reviewed monthly — not a buy/sell recommendation.
              We never display indicative or estimated numbers.
            </p>

            {/* Why Trustner */}
            <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-6 mt-6">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-brand shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-primary-700 mb-1">A comparison site can show you a SIF. Trustner can get you into one.</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We&rsquo;re an AMFI-registered SIF Distributor empanelled with every SIF house, so we give you the current
                    curated list, walk you through which strategy fits your goals and risk profile, and handle onboarding in
                    the Regular plan with ongoing servicing &mdash; not a dead-end form.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-cta-gradient text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Find the right SIF for your goals</h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Talk to Trustner about which of the {u.total} live SIFs fits your portfolio, risk appetite and time horizon. No obligation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-8 py-3.5 rounded-lg font-bold hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/25 text-sm">
              <MessageCircle className="w-5 h-5" /> Talk to Trustner about SIF
            </a>
            <Link href="/sif" className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition-colors shadow-lg text-sm">
              SIF Complete Guide <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-surface-100 py-6">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto space-y-2">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-600">Important:</strong> NAVs are sourced from AMFI&rsquo;s official Specialized Investment
              Fund feed and shown for the Regular-Growth plan. All SIFs are a new SEBI category with under one year of track record; this
              page is for educational and comparison purposes and does <strong>not</strong> constitute investment advice under the
              SEBI (Investment Advisers) Regulations, 2013, nor a recommendation to buy any scheme. The Trustner Fund Score is Trustner&rsquo;s
              proprietary educational opinion, reviewed monthly.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-500">Disclaimer:</strong> {DISCLAIMER.mutual_fund}{' '}
              {COMPANY.mfEntity?.name ?? 'Trustner Asset Services Pvt. Ltd.'} is an AMFI-registered Mutual Fund &amp; SIF Distributor
              ({COMPANY.mfEntity?.amfiArn ?? 'ARN-286886'}) and recommends Regular plans only; it is not a SEBI Registered Investment Adviser.
              Read all scheme-related documents and the riskometer carefully before investing.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
