'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, Crown, Loader2, TrendingUp } from 'lucide-react';
import type { PlanTier } from '@/types/financial-planning-v2';
import type { FinancialPlanningData } from '@/types/financial-planning';
import { TIER_CONFIGS } from '@/lib/constants/tier-config';

// Storage keys match those used in each wizard page
const STORAGE_KEYS: Record<PlanTier, string> = {
  basic: 'fp-basic-data',
  standard: 'fp-wizard-data',
  comprehensive: 'fp-comprehensive-data',
};

// What data carries forward from each tier
const UPGRADE_PATH: Record<string, { target: PlanTier; label: string }> = {
  basic: { target: 'standard', label: 'Standard Goal-Based Plan' },
  standard: { target: 'comprehensive', label: 'Comprehensive Financial Blueprint' },
};

function getTierBadgeColor(tier: PlanTier): string {
  switch (tier) {
    case 'basic': return 'bg-emerald-100 text-emerald-700';
    case 'standard': return 'bg-brand-100 text-brand-700';
    case 'comprehensive': return 'bg-amber-100 text-amber-700';
  }
}

function getTierName(tier: PlanTier): string {
  const config = TIER_CONFIGS.find(c => c.tier === tier);
  return config?.name || tier;
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    }>
      <UpgradePageInner />
    </Suspense>
  );
}

function UpgradePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTier = (searchParams.get('from') || 'basic') as PlanTier;

  const [savedData, setSavedData] = useState<FinancialPlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

  const upgrade = UPGRADE_PATH[fromTier];
  const targetTier = upgrade?.target || 'standard';
  const targetConfig = TIER_CONFIGS.find(c => c.tier === targetTier);

  // Load saved data from the source tier
  useEffect(() => {
    try {
      const storageKey = STORAGE_KEYS[fromTier];
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSavedData(JSON.parse(stored));
      }
    } catch {
      // No saved data found
    }
    setLoading(false);
  }, [fromTier]);

  // Migrate data to target tier and redirect
  const handleUpgrade = () => {
    setMigrating(true);

    try {
      if (savedData) {
        // Save existing data to the target tier's storage key
        const targetKey = STORAGE_KEYS[targetTier];
        const enrichedData = {
          ...savedData,
          // Mark as upgraded for tracking
          _upgradedFrom: fromTier,
          _upgradedAt: new Date().toISOString(),
        };
        localStorage.setItem(targetKey, JSON.stringify(enrichedData));
      }

      // Navigate to the target wizard
      if (targetTier === 'standard') {
        router.push('/financial-planning/assess');
      } else if (targetTier === 'comprehensive') {
        router.push('/financial-planning/comprehensive');
      }
    } catch {
      // On error, just navigate without pre-fill
      router.push(`/financial-planning/${targetTier}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  // Invalid upgrade path
  if (!upgrade) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md text-center">
          <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary-700 mb-2">
            You&apos;re Already at the Top!
          </h1>
          <p className="text-slate-500 mb-6">
            The Comprehensive Blueprint is our most detailed plan. There&apos;s nothing higher to upgrade to.
          </p>
          <button
            onClick={() => router.push('/financial-planning')}
            className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-600 transition-colors"
          >
            Back to Financial Planning
          </button>
        </div>
      </section>
    );
  }

  // Migrating state
  if (migrating) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary-700 mb-2">
            Preparing Your Upgrade...
          </h2>
          <p className="text-slate-500">Pre-filling your data into the {upgrade.label}</p>
        </div>
      </section>
    );
  }

  const hasData = !!savedData && !!savedData.personalProfile?.fullName;

  return (
    <section className="min-h-[80vh] py-12 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTierBadgeColor(fromTier)}`}>
              {getTierName(fromTier)}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTierBadgeColor(targetTier)}`}>
              {getTierName(targetTier)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-700 mb-2">
            Upgrade to {upgrade.label}
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            {hasData
              ? `Great news! Your ${getTierName(fromTier)} data will be pre-filled. You only need to complete the additional sections.`
              : `Start the ${upgrade.label} from scratch with our guided wizard.`
            }
          </p>
        </div>

        {/* Saved Data Summary */}
        {hasData && (
          <div className="card-base p-6 mb-6 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-emerald-800 mb-1">Your Saved Data</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-emerald-700">
                  <div>
                    <span className="text-emerald-500">Name:</span>{' '}
                    {savedData.personalProfile.fullName}
                  </div>
                  {savedData.personalProfile.age > 0 && (
                    <div>
                      <span className="text-emerald-500">Age:</span>{' '}
                      {savedData.personalProfile.age} years
                    </div>
                  )}
                  {savedData.incomeProfile?.monthlyInHandSalary > 0 && (
                    <div>
                      <span className="text-emerald-500">Income:</span>{' '}
                      {formatLakhs(savedData.incomeProfile.monthlyInHandSalary)}/mo
                    </div>
                  )}
                  {savedData.personalProfile.city && (
                    <div>
                      <span className="text-emerald-500">City:</span>{' '}
                      {savedData.personalProfile.city === 'other'
                        ? savedData.personalProfile.otherCity
                        : savedData.personalProfile.city}
                    </div>
                  )}
                </div>
                <p className="text-xs text-emerald-600 mt-2">
                  This data will be carried forward to your {upgrade.label}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What You'll Get */}
        {targetConfig && (
          <div className="card-base p-6 mb-6">
            <h3 className="font-bold text-primary-700 mb-3 flex items-center gap-2">
              {targetTier === 'comprehensive' ? (
                <Crown className="w-5 h-5 text-amber-500" />
              ) : (
                <TrendingUp className="w-5 h-5 text-brand" />
              )}
              What You&apos;ll Get with {targetConfig.name}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {targetConfig.features
                .filter(f => !f.includes('Everything in'))
                .map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      targetTier === 'comprehensive' ? 'text-amber-500' : 'text-brand'
                    }`} />
                    {feature}
                  </li>
                ))}
            </ul>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-300/60 text-sm text-slate-500">
              <span>{targetConfig.duration}</span>
              <span className="w-px h-4 bg-slate-200" />
              <span>{targetConfig.steps} steps</span>
              <span className="w-px h-4 bg-slate-200" />
              <span>{targetConfig.reportPages}-page PDF report</span>
            </div>
          </div>
        )}

        {/* New Steps Preview */}
        <div className="card-base p-6 mb-8">
          <h3 className="font-bold text-primary-700 mb-3">
            {hasData ? 'Additional Steps You\'ll Complete' : 'Steps in the Wizard'}
          </h3>
          {fromTier === 'basic' && targetTier === 'standard' && (
            <div className="space-y-2">
              {hasData && (
                <StepItem number={1} title="Personal Profile" description="Pre-filled from your Health Check" done />
              )}
              <StepItem
                number={hasData ? 2 : 1}
                title="Career & Income"
                description="Detailed employment, income & expense breakdown"
                isNew={hasData}
              />
              <StepItem
                number={hasData ? 3 : 2}
                title="Assets & Investments"
                description="Complete savings and investment portfolio"
                isNew={hasData}
              />
              <StepItem
                number={hasData ? 4 : 3}
                title="Loans & Liabilities"
                description="Outstanding loans, EMIs & credit obligations"
                isNew={hasData}
              />
              <StepItem
                number={hasData ? 5 : 4}
                title="Insurance & Protection"
                description="Life, health & critical illness coverage"
                isNew={hasData}
              />
              <StepItem
                number={hasData ? 6 : 5}
                title="Goals & Risk Profile"
                description="Define life goals and assess risk appetite"
                isNew={hasData}
              />
            </div>
          )}
          {fromTier === 'standard' && targetTier === 'comprehensive' && (
            <div className="space-y-2">
              {hasData && (
                <>
                  <StepItem number={1} title="Steps 1-6" description="Pre-filled from your Standard Plan" done />
                </>
              )}
              <StepItem
                number={hasData ? 7 : 7}
                title="Tax & Emergency Fund"
                description="Tax regime optimization and emergency preparedness"
                isNew={hasData}
              />
              <StepItem
                number={hasData ? 8 : 8}
                title="Family Details"
                description="Detailed family profiles, health history & expense breakdown"
                isNew={hasData}
              />
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleUpgrade}
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-[1.02] shadow-lg ${
              targetTier === 'comprehensive'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25'
                : 'bg-gradient-to-r from-brand to-brand-600 hover:from-brand-600 hover:to-brand-700 shadow-brand/25'
            }`}
          >
            {hasData ? 'Continue with Pre-filled Data' : `Start ${targetConfig?.name || 'Upgrade'}`}
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-400 mt-3">
            {hasData
              ? 'Your existing answers are saved. You can edit them anytime during the wizard.'
              : 'Free. No credit card required. Takes about ' + (targetConfig?.duration || '15 minutes') + '.'}
          </p>

          <button
            onClick={() => router.push('/financial-planning')}
            className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Back to Financial Planning
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Helper Components ─────────────────────────────────────────────

function StepItem({ number, title, description, done, isNew }: {
  number: number;
  title: string;
  description: string;
  done?: boolean;
  isNew?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      done ? 'bg-emerald-50 border border-emerald-100' :
      isNew ? 'bg-brand-50/50 border border-brand-100' :
      'bg-slate-50 border border-slate-100'
    }`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        done ? 'bg-emerald-500 text-white' :
        isNew ? 'bg-brand text-white' :
        'bg-slate-200 text-slate-600'
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${done ? 'text-emerald-700' : 'text-primary-700'}`}>
            {title}
          </span>
          {done && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">PRE-FILLED</span>}
          {isNew && <span className="text-[10px] font-bold text-brand-600 bg-brand-100 px-2 py-0.5 rounded-full">NEW</span>}
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function formatLakhs(val: number): string {
  if (val >= 10000000) return `${(val / 10000000).toFixed(1)} Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return `${val}`;
}
