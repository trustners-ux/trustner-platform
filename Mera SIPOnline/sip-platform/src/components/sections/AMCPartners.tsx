'use client';

import { AMC_PARTNERS } from '@/lib/constants/company';

/* ──────────────────────────────────────────────
   AMC Marquee — single seamless scroll of
   branded AMC names, like Groww / Kuvera / ET Money.
   Clean, scannable, professional.
   ────────────────────────────────────────────── */

function AMCName({ amc }: { amc: (typeof AMC_PARTNERS)[number] }) {
  return (
    <a
      href={amc.url}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 flex items-center gap-2.5 group px-1"
      title={amc.name}
    >
      {/* Brand-colored circle with initials */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold tracking-tight shrink-0 shadow-sm"
        style={{ backgroundColor: amc.color }}
      >
        {amc.initials.slice(0, 3)}
      </div>
      {/* Short name */}
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
  // Duplicate the full list for seamless infinite scroll
  const allAMCs = [...AMC_PARTNERS, ...AMC_PARTNERS];

  return (
    <section className="py-10 bg-white border-y border-surface-300/50 overflow-hidden">
      <div className="container-custom mb-6">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-surface-300" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Distributing schemes from {AMC_PARTNERS.length}+ AMCs
          </p>
          <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-surface-300" />
        </div>
      </div>

      {/* Marquee — single row, continuous scroll */}
      <div className="relative">
        {/* Edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex items-center animate-scroll-left">
          {allAMCs.map((amc, i) => (
            <div key={`${amc.shortName}-${i}`} className="flex items-center">
              <AMCName amc={amc} />
              {i < allAMCs.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>

      <div className="container-custom mt-6">
        <p className="text-[10px] text-slate-400 text-center leading-relaxed max-w-3xl mx-auto">
          Trustner Asset Services Pvt. Ltd. (ARN-286886) is an AMFI registered mutual fund distributor.
          Mutual fund investments are subject to market risks. Visit respective AMC websites for scheme-related documents.
        </p>
      </div>
    </section>
  );
}
