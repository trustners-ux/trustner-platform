'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle, Clock, FileText, CalendarCheck, Award } from 'lucide-react';
import TeaserDashboard from '@/components/financial-planning/TeaserDashboard';
import { UpgradeBanner } from '@/components/financial-planning/UpgradeBanner';
import type { TeaserData } from '@/types/financial-planning';
import type { PlanTier } from '@/types/financial-planning-v2';

const TIER_MESSAGE: Record<PlanTier, string> = {
  basic: 'Your Financial Health Check is ready! Here\'s your quick snapshot.',
  standard: 'Your Goal-Based Financial Plan has been submitted for expert review.',
  comprehensive: 'Your CFP-Grade Financial Blueprint is being prepared by our team.',
};

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
        {/* Tier-specific congratulations message */}
        <p className="mt-2 text-sm text-slate-600">{TIER_MESSAGE[tier]}</p>
      </div>

      <TeaserDashboard data={teaserData} userName={userName} userEmail={userEmail} tier={tier} />

      {/* What's Next? Section */}
      <div className="max-w-3xl mx-auto mt-8">
        <div className="bg-white rounded-xl border border-slate-100 p-5 sm:p-6 shadow-sm">
          <h3 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-brand" />
            What&apos;s Next?
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
              </div>
              <p className="text-sm text-slate-600">Our certified financial planners will review your report within 24 hours</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-brand-600" />
              </div>
              <p className="text-sm text-slate-600">You&apos;ll receive a detailed PDF report via email/WhatsApp</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CalendarCheck className="w-3.5 h-3.5 text-brand-600" />
              </div>
              <p className="text-sm text-slate-600">Schedule a free consultation call to discuss your plan</p>
            </div>
          </div>
          <div className="mt-5">
            <a
              href="https://wa.me/916003903737?text=Hi, I just completed my financial assessment on MeraSIP."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat with Us on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Upgrade Banner (basic/standard) or Premium Confirmation (comprehensive) */}
      {tier !== 'comprehensive' ? (
        <div className="max-w-3xl mx-auto mt-8">
          <UpgradeBanner currentTier={tier} />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto mt-8">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Award className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-700 mb-1">Premium Plan</h3>
                <p className="text-sm text-slate-600">
                  You&apos;ve selected our most comprehensive plan. Our CFP team will prepare your full 16-page blueprint.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
