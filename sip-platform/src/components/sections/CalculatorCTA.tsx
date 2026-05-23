'use client';

import Link from 'next/link';
import { Brain, ArrowRight, Phone, MessageCircle } from 'lucide-react';

interface CalculatorCTAProps {
  /** Primary heading — contextual to the calculator */
  heading?: string;
  /** Sub-text below the heading */
  subtext?: string;
}

/**
 * Post-calculator conversion CTA — placed between calculator results and the disclaimer.
 * Bridges calculator usage → financial planning / advisor contact.
 */
export function CalculatorCTA({
  heading = 'Turn These Numbers Into Your Real Wealth',
  subtext = 'Get a personalized investment roadmap on WhatsApp in 30 seconds — our team will map these calculations to actual funds and a goal-based SIP plan, completely free.',
}: CalculatorCTAProps) {
  return (
    <section className="py-10 bg-gradient-to-r from-brand-50 via-teal-50 to-brand-50">
      <div className="container-custom">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 text-xs font-semibold text-brand mb-4 border border-brand-200/50 shadow-sm">
            <Brain className="w-3.5 h-3.5" />
            Next Step
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-primary-700 mb-3">
            {heading}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-xl mx-auto">
            {subtext}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/financial-planning"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-teal-700 text-white px-6 py-3 rounded-lg font-bold text-sm hover:from-brand-700 hover:to-teal-800 transition-all shadow-lg shadow-brand-600/20"
            >
              <Brain className="w-4 h-4" />
              Get My Personalized Roadmap
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/916003903737?text=Hi%20Trustner%20team%2C%20I%20just%20used%20the%20calculator%20on%20MeraSIP.%20I%20want%20to%20discuss%20a%20personalized%20plan.%20Please%20guide%20me."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-brand-700 px-6 py-3 rounded-lg font-bold text-sm hover:bg-brand-50 transition-colors border border-brand-200/50 shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Get Plan on WhatsApp
            </a>
          </div>
          <p className="text-[10px] text-slate-400 mt-4">
            Trustner Asset Services Pvt. Ltd. &middot; AMFI ARN-286886 &middot; No obligation, no charges
          </p>
        </div>
      </div>
    </section>
  );
}
