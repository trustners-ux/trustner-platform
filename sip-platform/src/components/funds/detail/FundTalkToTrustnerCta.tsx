'use client';

/**
 * FundTalkToTrustnerCta
 *
 * Lead card pre-filled with the fund's name + AMFI code. Reuses the
 * existing CalculatorLeadForm component which already posts to /api/lead
 * with consent + WhatsApp deep-link follow-through.
 *
 * Compliance:
 *   - Headline: "Talk to Trustner about this fund" (no "advisor"/"advisory")
 *   - For Direct plans, the parent page also surfaces the "Trustner serves
 *     Regular plans" note in the hero. This CTA itself is plan-agnostic
 *     (we still want the conversation to happen).
 */

import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';

interface Props {
  fundName: string;
  amfiCode: string;
}

export function FundTalkToTrustnerCta({ fundName, amfiCode }: Props) {
  return (
    <section id="talk-to-trustner" className="py-10 bg-white border-t border-slate-200">
      <div className="container-custom">
        {/* Free Portfolio Check — converts the organic search visitor who landed
            on a single fund page into a whole-portfolio lead (the SEO → funnel
            loop). Teaser only; the full diagnostic stays behind the RM gate. */}
        <Link
          href="/portfolio-check"
          className="group mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-4 sm:p-5 transition hover:border-brand-400 hover:shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <Search className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Already invested? Get a free 60-second Portfolio Check
              </p>
              <p className="text-xs text-slate-600">
                Upload your CAS / statement — see your fund mix, duplicate-category
                overlaps and concentration. No charge, no obligation.
              </p>
            </div>
          </div>
          <span className="flex-none inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white transition group-hover:bg-brand-700">
            Run free check <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <CalculatorLeadForm
          calculatorName={`Fund Enquiry — ${fundName}`}
          heading="Talk to Trustner about this fund"
          subtext="Share your contact details and our team will reach out within a working day to discuss whether this scheme fits your goal, risk profile, and time horizon — no obligation."
          resultContext={`Fund: ${fundName} (AMFI Code ${amfiCode})`}
          accent="brand"
        />
      </div>
    </section>
  );
}
