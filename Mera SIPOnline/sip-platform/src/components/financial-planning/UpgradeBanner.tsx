'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Crown, TrendingUp, Zap, X, Check, Sparkles, Clock } from 'lucide-react';
import type { PlanTier } from '@/types/financial-planning-v2';

interface UpgradeBannerProps {
  currentTier: PlanTier;
  reportId?: string;
}

const CURRENT_TIER_FEATURES: Record<string, string[]> = {
  basic: [
    'Financial Health Score',
    'Key Insights & Strengths',
    'Net Worth Estimate',
    'Retirement Readiness %',
  ],
  standard: [
    'Everything in Basic',
    'Goal-wise SIP Calculator',
    'Insurance Gap Analysis',
    'Asset Allocation Recommendation',
  ],
};

const UPGRADE_CONFIG: Record<string, {
  nextTier: PlanTier;
  nextName: string;
  message: string;
  features: string[];
  icon: typeof Crown;
  color: string;
  bgColor: string;
  borderColor: string;
  href: string;
  estimateMinutes: number;
}> = {
  basic: {
    nextTier: 'standard',
    nextName: 'Standard Plan',
    message: 'Want goal-wise SIP recommendations and a personalized action plan?',
    features: ['Goal-wise SIP Calculator', 'Insurance Gap Analysis', 'Asset Allocation Recommendation', 'Detailed Action Plan'],
    icon: TrendingUp,
    color: 'text-brand-700',
    bgColor: 'bg-gradient-to-r from-brand-50 to-teal-50',
    borderColor: 'border-brand-200',
    href: '/financial-planning/upgrade?from=basic',
    estimateMinutes: 5,
  },
  standard: {
    nextTier: 'comprehensive',
    nextName: 'Comprehensive Blueprint',
    message: 'Ready for a CFP-grade financial blueprint with 5-year cashflow projection?',
    features: ['5-Year Cashflow Projection', 'Asset Allocation Matrix', 'Tax Optimization Strategy', 'Executive Summary & Action Timeline'],
    icon: Crown,
    color: 'text-amber-700',
    bgColor: 'bg-gradient-to-r from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
    href: '/financial-planning/upgrade?from=standard',
    estimateMinutes: 8,
  },
};

export function UpgradeBanner({ currentTier, reportId }: UpgradeBannerProps) {
  const config = UPGRADE_CONFIG[currentTier];
  const currentFeatures = CURRENT_TIER_FEATURES[currentTier];
  const [dismissed, setDismissed] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    try {
      if (sessionStorage.getItem(`upgrade-banner-dismissed-${currentTier}`) === 'true') {
        setDismissed(true);
      }
    } catch {
      // sessionStorage may not be available (SSR / private mode)
    }
  }, [currentTier]);

  if (!config || dismissed) return null;

  const Icon = config.icon;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(`upgrade-banner-dismissed-${currentTier}`, 'true');
    } catch {
      // Silently fail if sessionStorage unavailable
    }
  };

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-5 sm:p-6 relative`}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors text-slate-400 hover:text-slate-600"
        aria-label="Dismiss upgrade banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className={`p-2 rounded-lg ${currentTier === 'basic' ? 'bg-brand-100' : 'bg-amber-100'}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-base font-bold ${config.color} mb-1`}>
            Upgrade to {config.nextName}
          </h3>
          <p className="text-sm text-slate-600 mb-4">{config.message}</p>

          {/* Feature comparison: what you have vs what you'll gain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0 mb-4">
            {/* Current features */}
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                What you have
              </div>
              <ul className="space-y-1">
                {currentFeatures?.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade features */}
            <div className="mt-3 sm:mt-0">
              <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1.5 ${config.color}`}>
                What you&apos;ll gain
              </div>
              <ul className="space-y-1">
                {config.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Time estimate */}
          <div className="flex items-center gap-1.5 mb-4 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">
              Takes only ~{config.estimateMinutes} more minutes to complete
            </span>
          </div>

          {/* CTA — own row, prominent */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-black/5">
            <Link
              href={`${config.href}${reportId ? `&upgrade=${reportId}` : ''}`}
              className={`inline-flex items-center gap-2 text-sm font-bold text-white ${currentTier === 'basic' ? 'bg-brand hover:bg-brand-600' : 'bg-amber-600 hover:bg-amber-700'} px-6 py-3 rounded-lg transition-colors shadow-sm`}
            >
              Upgrade Now <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[10px] text-slate-400">
              Your existing data will be pre-filled — you only need to complete the additional steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
