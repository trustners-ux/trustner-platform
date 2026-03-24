'use client';

import { useRouter } from 'next/navigation';
import {
  Heart, TrendingUp, Wallet, CalendarClock,
  ArrowLeft, ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: TrendingUp,
    title: 'Wedding Cost Inflation',
    desc: 'Wedding expenses grow 8-10% yearly — our projections ensure your corpus keeps pace.',
  },
  {
    icon: Wallet,
    title: 'Customizable Budget',
    desc: 'Set your own budget for venue, catering, jewellery, and other wedding categories.',
  },
  {
    icon: CalendarClock,
    title: 'SIP Timeline',
    desc: 'A clear month-by-month savings roadmap aligned to your child\'s expected wedding year.',
  },
  {
    icon: Heart,
    title: 'Comprehensive Coverage',
    desc: 'From venue booking to jewellery — plan every expense category so nothing is missed.',
  },
];

export default function ChildMarriagePlanningPage() {
  const router = useRouter();

  const handleStart = () => {
    localStorage.setItem(
      'fp-preselected-goal',
      JSON.stringify({ goalType: 'child-marriage' }),
    );
    router.push('/financial-planning/assess');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50">
            <Heart className="h-10 w-10 text-brand" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Child Marriage Planning
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Build a dedicated corpus for your child&apos;s wedding — from venue
            to jewellery, with a clear savings roadmap.
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
            Start Marriage Planning
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
