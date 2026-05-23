'use client';

import { useState } from 'react';
import { AMC_PARTNERS } from '@/lib/constants/company';

/* ──────────────────────────────────────────────
   AMC Marquee — 40+ AMCs, seamless scroll
   Attempts to render the logo from /public/amcs/,
   falls back to a branded initial-circle if the
   file is missing (onError).
   ────────────────────────────────────────────── */

type AMC = (typeof AMC_PARTNERS)[number] & { logo?: string };

function AMCBadge({ amc }: { amc: AMC }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoPath = (amc as { logo?: string }).logo;
  const showLogo = !!logoPath && !logoFailed;

  return (
    <a
      href={amc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 flex items-center gap-2.5 group px-1"
      title={amc.name}
    >
      {showLogo ? (
        <div className="w-10 h-10 rounded-full bg-white border border-surface-300/60 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoPath}
            alt={`${amc.name} logo`}
            className="w-full h-full object-contain"
            loading="lazy"
            onError={() => setLogoFailed(true)}
          />
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[11px] font-bold tracking-tight shrink-0 shadow-sm"
          style={{ backgroundColor: amc.color }}
        >
          {amc.initials.slice(0, 4)}
        </div>
      )}
      <span className="text-sm font-semibold text-slate-600 whitespace-nowrap group-hover:text-brand transition-colors">
        {amc.shortName}
      </span>
    </a>
  );
}

function Separator() {
  return <span className="shrink-0 text-slate-200 mx-3">|</span>;
}

export function AMCPartners() {
  // Duplicate for seamless infinite scroll
  const allAMCs = [...AMC_PARTNERS, ...AMC_PARTNERS];
  // Round down to the nearest 5 for marketing-friendly display ("40+")
  const displayCount = Math.floor(AMC_PARTNERS.length / 5) * 5;

  return (
    <section className="py-10 bg-white border-y border-surface-300/50 overflow-hidden">
      <div className="container-custom mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-surface-300" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Distributing schemes from {displayCount}+ AMCs
          </p>
          <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-surface-300" />
        </div>
        <p className="text-center text-sm text-slate-500 max-w-2xl mx-auto">
          Almost every major Indian mutual fund house — we&apos;re empanelled with{' '}
          <strong className="text-primary-700">{AMC_PARTNERS.length} AMCs</strong>{' '}
          across Equity, Debt, Hybrid, Index, International, and Thematic categories.
        </p>
      </div>

      {/* Marquee — single row, continuous scroll */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex items-center animate-scroll-left">
          {allAMCs.map((amc, i) => (
            <div key={`${amc.shortName}-${i}`} className="flex items-center">
              <AMCBadge amc={amc} />
              {i < allAMCs.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>

      <div className="container-custom mt-6">
        <p className="text-[10px] text-slate-400 text-center leading-relaxed max-w-3xl mx-auto">
          Trustner Asset Services Pvt. Ltd. (ARN-286886) is an AMFI registered mutual fund distributor.
          Logos shown are property of respective AMCs. Mutual fund investments are subject to market risks.
          Visit respective AMC websites for scheme-related documents.
        </p>
      </div>
    </section>
  );
}
