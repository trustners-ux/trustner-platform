'use client';

import { useRouter } from 'next/navigation';
import {
  ShieldAlert, Clock, Droplets, ListChecks,
  ArrowLeft, ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: '6-12 Months of Expenses',
    desc: 'We calculate your ideal emergency corpus based on your monthly outflows and dependents.',
  },
  {
    icon: Droplets,
    title: 'Liquid Fund Recommendation',
    desc: 'Get specific fund suggestions that offer instant redemption with better returns than savings accounts.',
  },
  {
    icon: ListChecks,
    title: 'Step-by-Step Build Plan',
    desc: 'A phased approach — start small, build gradually, and reach full coverage within a set timeline.',
  },
  {
    icon: ShieldAlert,
    title: 'Protection from Job Loss',
    desc: 'Know exactly how many months your family can sustain comfortably without income.',
  },
];

export default function EmergencyFundPlanningPage() {
  const router = useRouter();

  const handleStart = () => {
    localStorage.setItem(
      'fp-preselected-goal',
      JSON.stringify({ goalType: 'emergency-fund' }),
    );
    router.push('/financial-planning/assess');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50">
            <ShieldAlert className="h-10 w-10 text-brand" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Emergency Fund Planning
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Build a financial safety net that protects your family from
            unexpected expenses and job loss.
          </p>
        </div>

        {/* Features */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <f.icon className="mb-3 h-6 w-6 text-brand" />
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
          >
            Start Emergency Fund Planning
            <ArrowRight className="h-5 w-5" />
          </button>

          <div className="mt-4">
            <button
              onClick={() => router.push('/financial-planning')}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all plans
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Free &bull; No payment required &bull; Report delivered to your email
          </p>
        </div>
      </div>
    </div>
  );
}
