'use client';

import Link from 'next/link';
import {
  Landmark,
  GraduationCap,
  TrendingUp,
  Shield,
  Home,
  Heart,
  ArrowRight,
} from 'lucide-react';

const GOALS = [
  {
    icon: Landmark,
    label: 'Retirement',
    desc: 'Plan a worry-free retirement',
    href: '/calculators/retirement',
    color: 'from-brand-500 to-teal-600',
    bg: 'bg-brand-50 hover:bg-brand-100',
    border: 'border-brand-200/50 hover:border-brand-300',
  },
  {
    icon: GraduationCap,
    label: 'Child Education',
    desc: 'Fund your child\'s future',
    href: '/calculators/goal-based',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-200/50 hover:border-amber-300',
  },
  {
    icon: TrendingUp,
    label: 'Wealth Creation',
    desc: 'Grow your money with SIP',
    href: '/calculators/sip',
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200/50 hover:border-purple-300',
  },
  {
    icon: Shield,
    label: 'Emergency Fund',
    desc: 'Build a safety net',
    href: '/calculators/emergency-fund',
    color: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50 hover:bg-teal-100',
    border: 'border-teal-200/50 hover:border-teal-300',
  },
  {
    icon: Home,
    label: 'Buy a Home',
    desc: 'Plan your down payment',
    href: '/calculators/home-affordability',
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 hover:bg-sky-100',
    border: 'border-sky-200/50 hover:border-sky-300',
  },
  {
    icon: Heart,
    label: 'Tax Saving',
    desc: 'Save tax with ELSS SIP',
    href: '/calculators/tax-saving',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 hover:bg-rose-100',
    border: 'border-rose-200/50 hover:border-rose-300',
  },
];

export function QuickGoalSelector() {
  return (
    <section className="py-10 lg:py-14 bg-white border-b border-surface-300/50">
      <div className="container-custom">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-primary-700 mb-2">
            What Are You Investing For?
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Choose your dream — we&apos;ll show you exactly how much SIP you need to get there
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
          {GOALS.map((goal) => (
            <Link
              key={goal.label}
              href={goal.href}
              className={`group flex flex-col items-center text-center p-4 lg:p-5 rounded-2xl border transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 ${goal.bg} ${goal.border}`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${goal.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}
              >
                <goal.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-bold text-primary-700 mb-0.5">
                {goal.label}
              </span>
              <span className="text-[11px] text-slate-400 leading-tight">
                {goal.desc}
              </span>
            </Link>
          ))}
        </div>

        {/* Or explore */}
        <div className="text-center mt-6">
          <Link
            href="/financial-planning"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-700 transition-colors"
          >
            Or get a complete Financial Health Assessment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
