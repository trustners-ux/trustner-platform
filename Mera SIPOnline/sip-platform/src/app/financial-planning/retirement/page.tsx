'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sunset, TrendingUp, ShieldCheck, Calculator, Droplets,
  ArrowLeft, ArrowRight, BarChart3, Wallet, Target,
  PiggyBank, RefreshCcw,
} from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: 'Retirement Corpus Calculation',
    desc: 'Know the exact amount you need based on your lifestyle, city, and life expectancy.',
  },
  {
    icon: TrendingUp,
    title: 'Inflation-Adjusted Projections',
    desc: 'Your plan accounts for 6-7% inflation so your purchasing power stays intact.',
  },
  {
    icon: Sunset,
    title: 'Personalized SIP Recommendation',
    desc: 'Get a monthly SIP amount tailored to your age, income, and retirement timeline.',
  },
  {
    icon: ShieldCheck,
    title: 'Pension Gap Analysis',
    desc: 'See how much your EPF, NPS, and existing savings cover — and what gap remains.',
  },
];

const bucketFeatures = [
  {
    icon: PiggyBank,
    title: '5 Time-Horizon Buckets',
    desc: 'Emergency, Short-Term, Medium-Term, Growth, and Aggressive buckets tailored to your retirement timeline.',
  },
  {
    icon: RefreshCcw,
    title: 'Automatic Rebalancing',
    desc: 'When one bucket runs out, the next higher bucket refills it — your income never stops.',
  },
  {
    icon: Wallet,
    title: 'Multiple Income Sources',
    desc: 'Factor in pension, rental income, SCSS, NPS, SWP, and EPF — see how they reduce withdrawal pressure.',
  },
  {
    icon: BarChart3,
    title: 'Product Recommendations',
    desc: 'Get CFP-grade fund recommendations for each bucket — from Liquid Funds to Multi Cap Funds.',
  },
];

export default function RetirementPlanningPage() {
  const router = useRouter();

  const handleStart = () => {
    localStorage.setItem(
      'fp-preselected-goal',
      JSON.stringify({ goalType: 'retirement' }),
    );
    router.push('/financial-planning/assess');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50">
            <Sunset className="h-10 w-10 text-brand" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Retirement Planning
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Comprehensive retirement planning with corpus calculation, bucket strategy,
            and personalized income optimization.
          </p>
        </div>

        {/* Two Paths */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Path 1: Financial Health Check */}
          <div className="rounded-2xl border-2 border-brand-200 bg-white p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-brand text-white text-[10px] font-bold uppercase rounded-bl-lg">
              Full Planning
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                <Target className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Financial Health Check</h2>
                <p className="text-xs text-slate-500">Comprehensive retirement assessment</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-2.5">
                  <f.icon className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{f.title}</p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleStart}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-800"
            >
              Start Retirement Assessment
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-400">
              Free &bull; Get a personalized report delivered to your email
            </p>
          </div>

          {/* Path 2: Bucket Strategy */}
          <div className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase rounded-bl-lg">
              Income Strategy
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Bucket Strategy Calculator</h2>
                <p className="text-xs text-slate-500">Optimize retirement income across 5 buckets</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {bucketFeatures.map((f) => (
                <div key={f.title} className="flex items-start gap-2.5">
                  <f.icon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{f.title}</p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/calculators/bucket-strategy"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-600"
            >
              Open Bucket Strategy Calculator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-2 text-center text-[10px] text-slate-400">
              Free &bull; Instant results &bull; PDF export available
            </p>
          </div>
        </div>

        {/* Bucket Strategy Mini Explainer */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-slate-50 to-amber-50 border border-slate-200 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-2">What is the Bucket Strategy?</h3>
          <p className="text-sm text-slate-600 mb-4">
            The Bucket Strategy divides your retirement corpus into 5 time-horizon buckets.
            Short-term buckets (1-3 years) stay in safe instruments like Liquid Funds and FDs,
            while long-term buckets (10+ years) grow in equity. When a bucket runs out, the next
            one refills it — ensuring your income never stops while maximizing growth.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Bucket 0', color: 'bg-red-100 text-red-700', desc: 'Emergency (6 months)' },
              { label: 'Bucket 1', color: 'bg-blue-100 text-blue-700', desc: 'Safety (1-3 yrs)' },
              { label: 'Bucket 2', color: 'bg-purple-100 text-purple-700', desc: 'Balanced (4-6 yrs)' },
              { label: 'Bucket 3', color: 'bg-amber-100 text-amber-700', desc: 'Growth (7-10 yrs)' },
              { label: 'Bucket 4', color: 'bg-emerald-100 text-emerald-700', desc: 'Equity (10+ yrs)' },
            ].map((b) => (
              <span key={b.label} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${b.color}`}>
                {b.label}: {b.desc}
              </span>
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="mt-10 text-center">
          <button
            onClick={() => router.push('/financial-planning')}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all plans
          </button>
        </div>
      </div>
    </div>
  );
}
