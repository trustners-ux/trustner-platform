'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import TeaserDashboard from '@/components/financial-planning/TeaserDashboard';
import { UpgradeBanner } from '@/components/financial-planning/UpgradeBanner';
import type { TeaserData } from '@/types/financial-planning';
import type { PlanTier } from '@/types/financial-planning-v2';

const STORAGE_KEY = 'fp-teaser-data';

export default function TeaserPage() {
  const router = useRouter();
  const [teaserData, setTeaserData] = useState<TeaserData | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [tier, setTier] = useState<PlanTier>('standard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        router.replace('/financial-planning');
        return;
      }

      const parsed = JSON.parse(stored);
      setTeaserData(parsed.teaser);
      setUserName(parsed.userName || '');
      setUserEmail(parsed.userEmail || '');
      setTier(parsed.tier || 'standard');
    } catch {
      router.replace('/financial-planning');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading || !teaserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      {/* Tier Badge */}
      <div className="max-w-3xl mx-auto text-center mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
          tier === 'basic' ? 'bg-emerald-100 text-emerald-700' :
          tier === 'comprehensive' ? 'bg-amber-100 text-amber-700' :
          'bg-teal-100 text-teal-700'
        }`}>
          {tier === 'basic' ? 'FINANCIAL HEALTH CHECK' :
           tier === 'comprehensive' ? 'COMPREHENSIVE BLUEPRINT' :
           'GOAL-BASED FINANCIAL PLAN'}
        </span>
      </div>

      <TeaserDashboard data={teaserData} userName={userName} userEmail={userEmail} />

      {/* Upgrade Banner (only for basic and standard) */}
      {tier !== 'comprehensive' && (
        <div className="max-w-3xl mx-auto mt-8">
          <UpgradeBanner currentTier={tier} />
        </div>
      )}
    </div>
  );
}
