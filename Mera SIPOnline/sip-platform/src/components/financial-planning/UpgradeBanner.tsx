'use client';

import Link from 'next/link';
import { ArrowRight, Crown, TrendingUp, Zap } from 'lucide-react';
import type { PlanTier } from '@/types/financial-planning-v2';

interface UpgradeBannerProps {
  currentTier: PlanTier;
  reportId?: string;
}

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
}> = {
  basic: {
    nextTier: 'standard',
    nextName: 'Standard Plan',
    message: 'Want goal-wise SIP recommendations and a personalized action plan?',
    features: ['Goal-wise SIP calculator', 'Insurance gap analysis', 'Asset allocation recommendation', 'Detailed action plan'],
    icon: TrendingUp,
    color: 'text-brand-700',
    bgColor: 'bg-gradient-to-r from-brand-50 to-teal-50',
    borderColor: 'border-brand-200',
    href: '/financial-planning/upgrade?from=basic',
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
  },
};

export function UpgradeBanner({ currentTier, reportId }: UpgradeBannerProps) {
  const config = UPGRADE_CONFIG[currentTier];
  if (!config) return null; // Already comprehensive — nothing to upgrade

  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-5 sm:p-6`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${currentTier === 'basic' ? 'bg-brand-100' : 'bg-amber-100'}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-base font-bold ${config.color} mb-1`}>
            Upgrade to {config.nextName}
          </h3>
          <p className="text-sm text-slate-600 mb-3">{config.message}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
            {config.features.map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600">
                <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href={`${config.href}${reportId ? `?upgrade=${reportId}` : ''}`}
            className={`inline-flex items-center gap-2 text-sm font-bold text-white ${currentTier === 'basic' ? 'bg-brand hover:bg-brand-600' : 'bg-amber-600 hover:bg-amber-700'} px-5 py-2.5 rounded-lg transition-colors`}
          >
            Upgrade Now <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[10px] text-slate-400 mt-2">
            Your existing data will be pre-filled — you only need to complete the additional steps.
          </p>
        </div>
      </div>
    </div>
  );
}
