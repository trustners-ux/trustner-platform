'use client';

import Link from 'next/link';
import { Calculator, Brain, ArrowRight, Sparkles } from 'lucide-react';

interface PostLearnCTAProps {
  /** Module title for contextual messaging */
  moduleTitle?: string;
}

/**
 * CTA shown after learning module content — bridges education → action.
 * "You learned it, now apply it."
 */
export function PostLearnCTA({ moduleTitle }: PostLearnCTAProps) {
  return (
    <div className="mt-10 rounded-2xl border border-brand-200/50 bg-gradient-to-br from-brand-50/60 to-teal-50/60 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-base font-bold text-primary-700 mb-1">
            Ready to Apply What You Learned?
          </h4>
          <p className="text-sm text-slate-500 leading-relaxed">
            {moduleTitle
              ? `Now that you understand ${moduleTitle}, put it into practice with our free tools.`
              : 'Turn your knowledge into action with our free calculators and planning tools.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            href="/calculators"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Calculator className="w-4 h-4" />
            Try Calculators
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/financial-planning"
            className="inline-flex items-center gap-2 bg-white text-brand-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-50 transition-colors border border-brand-200/50"
          >
            <Brain className="w-4 h-4" />
            Get Free Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
