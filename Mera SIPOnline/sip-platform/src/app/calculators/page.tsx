'use client';

import Link from 'next/link';
import {
  Calculator, TrendingUp, Target, Shield, IndianRupee,
  BarChart3, PieChart, Clock, Zap, ArrowRight, ChevronRight, Layers, Wallet,
  Home, Landmark, Scale, Heart, Flame, Timer, Users, Briefcase, Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';

/* ── Category definitions ─────────────────────────────────────────── */

interface CalcItem {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgLight: string;
  textColor: string;
  tag: string;
}

interface Category {
  title: string;
  subtitle: string;
  id: string;
  accentColor: string;
  items: CalcItem[];
}

const categories: Category[] = [
  {
    title: 'Wealth & SIP Calculators',
    subtitle: 'Plan your investments, compare strategies, and project long-term wealth growth',
    id: 'wealth',
    accentColor: 'from-brand-500 to-brand-700',
    items: [
      {
        name: 'SIP Future Value Calculator',
        description: 'Calculate how much your monthly SIP will grow over time with the power of compounding.',
        href: '/calculators/sip',
        icon: Calculator,
        gradient: 'from-brand-500 to-brand-600',
        bgLight: 'bg-brand-50',
        textColor: 'text-brand',
        tag: 'Most Popular',
      },
      {
        name: 'Step-Up SIP Calculator',
        description: 'Model the impact of increasing your SIP amount annually. Compare regular vs step-up SIP.',
        href: '/calculators/step-up-sip',
        icon: TrendingUp,
        gradient: 'from-brand-700 to-secondary-600',
        bgLight: 'bg-brand-50',
        textColor: 'text-brand',
        tag: 'Recommended',
      },
      {
        name: 'Goal-Based SIP Calculator',
        description: 'Find the exact monthly SIP for your goal. 3-scenario analysis included.',
        href: '/calculators/goal-based',
        icon: Target,
        gradient: 'from-teal-500 to-teal-600',
        bgLight: 'bg-teal-50',
        textColor: 'text-teal-600',
        tag: 'Goal Planning',
      },
      {
        name: 'Inflation-Adjusted SIP',
        description: 'See the real value of your SIP after accounting for inflation over time.',
        href: '/calculators/inflation-adjusted',
        icon: BarChart3,
        gradient: 'from-amber-500 to-secondary-600',
        bgLight: 'bg-violet-50',
        textColor: 'text-violet-600',
        tag: 'Essential',
      },
      {
        name: 'Retirement SIP Planner',
        description: 'Calculate the monthly SIP needed for your retirement corpus.',
        href: '/calculators/retirement',
        icon: Shield,
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50',
        textColor: 'text-amber-600',
        tag: 'Life Planning',
      },
      {
        name: 'SWP Calculator',
        description: 'Plan systematic withdrawals. See how long your money lasts.',
        href: '/calculators/swp',
        icon: IndianRupee,
        gradient: 'from-rose-500 to-pink-600',
        bgLight: 'bg-rose-50',
        textColor: 'text-rose-600',
        tag: 'Post-Retirement',
      },
      {
        name: 'Lumpsum Investment Calculator',
        description: 'Model lumpsum scenarios with future investments and planned withdrawals.',
        href: '/calculators/lumpsum',
        icon: Wallet,
        gradient: 'from-emerald-500 to-green-600',
        bgLight: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        tag: 'Investment',
      },
      {
        name: 'SIP vs Lumpsum Comparison',
        description: 'Compare monthly investing vs lump sum side-by-side with detailed charts.',
        href: '/calculators/sip-vs-lumpsum',
        icon: PieChart,
        gradient: 'from-cyan-500 to-brand-600',
        bgLight: 'bg-cyan-50',
        textColor: 'text-cyan-600',
        tag: 'Strategy',
      },
      {
        name: 'SIP Duration Optimizer',
        description: 'Find how long it takes to reach your target amount with a given monthly SIP.',
        href: '/calculators/duration-optimizer',
        icon: Clock,
        gradient: 'from-teal-500 to-teal-600',
        bgLight: 'bg-teal-50',
        textColor: 'text-teal-600',
        tag: 'Optimizer',
      },
      {
        name: 'Market Correction Impact',
        description: 'Simulate a market crash and see how corrections affect your SIP portfolio.',
        href: '/calculators/correction-impact',
        icon: Zap,
        gradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50',
        textColor: 'text-red-600',
        tag: 'Simulation',
      },
      {
        name: 'Life-Stage Planner',
        description: 'Plan your financial journey through 3 life stages — Invest, Grow, Withdraw.',
        href: '/calculators/life-stage',
        icon: Layers,
        gradient: 'from-secondary-500 to-brand-700',
        bgLight: 'bg-secondary-50',
        textColor: 'text-secondary-600',
        tag: 'Life Planning',
      },
      {
        name: 'Lifeline Financial Planner',
        description: 'CFP-style planner — add SIPs, lump sums, withdrawals at any year.',
        href: '/calculators/lifeline',
        icon: Layers,
        gradient: 'from-violet-500 to-purple-600',
        bgLight: 'bg-violet-50',
        textColor: 'text-violet-600',
        tag: 'CFP-Style',
      },
      {
        name: 'Daily SIP Calculator',
        description: 'Calculate returns on daily investments — calendar or working days.',
        href: '/calculators/daily-sip',
        icon: Clock,
        gradient: 'from-sky-500 to-cyan-600',
        bgLight: 'bg-sky-50',
        textColor: 'text-sky-600',
        tag: 'Micro-Invest',
      },
      {
        name: 'FIRE Calculator',
        description: 'Calculate your Financial Independence number and years to early retirement.',
        href: '/calculators/fire',
        icon: Flame,
        gradient: 'from-orange-500 to-red-600',
        bgLight: 'bg-orange-50',
        textColor: 'text-orange-600',
        tag: 'FIRE',
      },
      {
        name: 'Cost of Delay Calculator',
        description: 'See how procrastination destroys wealth. Compare delay scenarios.',
        href: '/calculators/delay-cost',
        icon: Timer,
        gradient: 'from-red-500 to-rose-600',
        bgLight: 'bg-red-50',
        textColor: 'text-red-600',
        tag: 'Eye-Opener',
      },
      {
        name: 'Bucket Strategy Calculator',
        description: 'Divide retirement corpus into safety, income, and growth buckets for sustainable withdrawals.',
        href: '/calculators/bucket-strategy',
        icon: Layers,
        gradient: 'from-teal-500 to-emerald-600',
        bgLight: 'bg-teal-50',
        textColor: 'text-teal-600',
        tag: 'Retirement',
      },
      {
        name: 'SIP Shield Calculator',
        description: 'Let your SIP pay your premiums and EMIs. See how investments can cover life\'s fixed costs.',
        href: '/calculators/sip-shield',
        icon: Shield,
        gradient: 'from-indigo-500 to-violet-600',
        bgLight: 'bg-indigo-50',
        textColor: 'text-indigo-600',
        tag: 'Trustner Exclusive',
      },
    ],
  },
  {
    title: 'Loan Calculators',
    subtitle: 'Compare loans, plan prepayments, and make smarter borrowing decisions',
    id: 'loan',
    accentColor: 'from-blue-500 to-blue-700',
    items: [
      {
        name: 'EMI Calculator',
        description: 'Calculate EMI for home, car, personal, or education loans with amortization schedule.',
        href: '/calculators/emi',
        icon: IndianRupee,
        gradient: 'from-blue-500 to-blue-600',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-600',
        tag: 'Popular',
      },
      {
        name: 'Loan Prepayment Calculator',
        description: 'See how extra payments reduce your loan tenure and total interest.',
        href: '/calculators/loan-prepayment',
        icon: TrendingUp,
        gradient: 'from-blue-600 to-indigo-600',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-600',
        tag: 'Save Interest',
      },
      {
        name: 'Car Loan vs Cash Calculator',
        description: 'Should you take a car loan or pay cash? Compare with opportunity cost analysis.',
        href: '/calculators/car-loan-vs-cash',
        icon: Scale,
        gradient: 'from-indigo-500 to-blue-600',
        bgLight: 'bg-indigo-50',
        textColor: 'text-indigo-600',
        tag: 'Decision',
      },
      {
        name: 'Home Affordability Calculator',
        description: '3-tier FOIR analysis to find how much house you can afford.',
        href: '/calculators/home-affordability',
        icon: Home,
        gradient: 'from-sky-500 to-blue-600',
        bgLight: 'bg-sky-50',
        textColor: 'text-sky-600',
        tag: 'Home Buying',
      },
    ],
  },
  {
    title: 'Tax Calculators',
    subtitle: 'Compare tax regimes, plan deductions, and calculate capital gains',
    id: 'tax',
    accentColor: 'from-emerald-500 to-emerald-700',
    items: [
      {
        name: 'Income Tax Calculator',
        description: 'Compare Old vs New tax regime with FY 2026-27 slabs and HRA exemption.',
        href: '/calculators/income-tax',
        icon: IndianRupee,
        gradient: 'from-emerald-500 to-green-600',
        bgLight: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        tag: 'FY 2026-27',
      },
      {
        name: 'Capital Gains Tax Calculator',
        description: 'Calculate STCG/LTCG tax for equity, debt, property, and gold post-Budget 2024.',
        href: '/calculators/capital-gains-tax',
        icon: BarChart3,
        gradient: 'from-green-500 to-emerald-600',
        bgLight: 'bg-green-50',
        textColor: 'text-green-600',
        tag: 'Budget 2024',
      },
      {
        name: 'Tax Saving Calculator',
        description: 'Plan deductions under 80C, 80D, 80CCD(1B), and 24(b) to minimize taxes.',
        href: '/calculators/tax-saving',
        icon: Shield,
        gradient: 'from-teal-500 to-emerald-600',
        bgLight: 'bg-teal-50',
        textColor: 'text-teal-600',
        tag: 'Save Tax',
      },
    ],
  },
  {
    title: 'Insurance Calculators',
    subtitle: 'Calculate your ideal life and health insurance coverage',
    id: 'insurance',
    accentColor: 'from-violet-500 to-violet-700',
    items: [
      {
        name: 'Human Life Value Calculator',
        description: 'Income replacement method to find your ideal life insurance cover.',
        href: '/calculators/human-life-value',
        icon: Heart,
        gradient: 'from-violet-500 to-purple-600',
        bgLight: 'bg-violet-50',
        textColor: 'text-violet-600',
        tag: 'Life Cover',
      },
      {
        name: 'Term Insurance Calculator',
        description: 'Needs-based approach to find adequate term insurance with gap analysis.',
        href: '/calculators/term-insurance',
        icon: Shield,
        gradient: 'from-purple-500 to-violet-600',
        bgLight: 'bg-purple-50',
        textColor: 'text-purple-600',
        tag: 'Protection',
      },
      {
        name: 'Health Insurance Calculator',
        description: 'City-tier, family, and age-based calculation with medical inflation projection.',
        href: '/calculators/health-insurance',
        icon: Heart,
        gradient: 'from-pink-500 to-rose-600',
        bgLight: 'bg-pink-50',
        textColor: 'text-pink-600',
        tag: 'Health Cover',
      },
      {
        name: 'Term Plan: Regular + SIP vs Limited Pay',
        description: 'Unique calculator: prove Regular Pay + SIP beats Limited Pay with bonus corpus at maturity.',
        href: '/calculators/term-plan-sip',
        icon: Scale,
        gradient: 'from-indigo-500 to-violet-600',
        bgLight: 'bg-indigo-50',
        textColor: 'text-indigo-600',
        tag: 'Trustner Exclusive',
      },
    ],
  },
  {
    title: 'Life Decision Calculators',
    subtitle: 'Make smarter financial decisions with behavioral finance tools',
    id: 'life-decision',
    accentColor: 'from-amber-500 to-amber-700',
    items: [
      {
        name: 'Emergency Fund Calculator',
        description: 'Find your ideal emergency fund based on expenses, dependents, and job stability.',
        href: '/calculators/emergency-fund',
        icon: Shield,
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50',
        textColor: 'text-amber-600',
        tag: 'Safety Net',
      },
      {
        name: 'Net Worth Calculator',
        description: 'Track assets and liabilities with wealth score and debt-to-asset ratio.',
        href: '/calculators/net-worth',
        icon: Wallet,
        gradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        tag: 'Wealth Score',
      },
      {
        name: 'Rent vs Buy Calculator',
        description: 'Compare renting vs buying with break-even analysis and opportunity cost.',
        href: '/calculators/rent-vs-buy',
        icon: Home,
        gradient: 'from-blue-500 to-cyan-600',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-600',
        tag: 'Decision',
      },
      {
        name: 'Break FD vs Take Loan',
        description: 'Should you break your FD or take a loan? Compare net cost with tax impact.',
        href: '/calculators/fd-vs-loan',
        icon: Landmark,
        gradient: 'from-teal-500 to-emerald-600',
        bgLight: 'bg-teal-50',
        textColor: 'text-teal-600',
        tag: 'Decision',
      },
      {
        name: 'Lifestyle Inflation Calculator',
        description: 'See how lifestyle creep erodes your savings rate over time.',
        href: '/calculators/lifestyle-inflation',
        icon: TrendingUp,
        gradient: 'from-red-500 to-orange-600',
        bgLight: 'bg-red-50',
        textColor: 'text-red-600',
        tag: 'Eye-Opener',
      },
    ],
  },
];

const totalCalculators = categories.reduce((sum, cat) => sum + cat.items.length, 0);

/* ── Category nav pills ─────────────────────────────────────────── */
const categoryNav = categories.map((cat) => ({
  id: cat.id,
  title: cat.title.replace(' Calculators', '').replace(' & SIP', ''),
  count: cat.items.length,
}));

export default function CalculatorsPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-pattern text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="container-custom relative z-10 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-6 backdrop-blur-sm">
              <Calculator className="w-3.5 h-3.5 text-accent" />
              {totalCalculators} Interactive Calculators
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
              Financial Calculators &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-brand-200 to-accent">
                Planning Tools
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
              Interactive calculators with real-time charts, year-by-year breakdowns, and scenario analysis.
              Plan every financial decision with precision and clarity.
            </p>

            {/* Category pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {categoryNav.map((nav) => (
                <a
                  key={nav.id}
                  href={`#${nav.id}`}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 rounded-full px-4 py-2 text-sm font-medium transition-colors backdrop-blur-sm"
                >
                  {nav.title}
                  <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{nav.count}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured: Financial Planning */}
      <section className="section-padding bg-surface-100 pb-0">
        <div className="container-custom">
          <Link
            href="/financial-planning"
            className="block card-base border-l-4 border-brand p-6 bg-gradient-to-r from-teal-50/50 to-white hover:shadow-elevated transition-all group"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-brand" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-bold text-primary-700">Comprehensive Financial Health Assessment</h2>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full uppercase">FREE</span>
                </div>
                <p className="text-sm text-slate-500">
                  Go beyond individual calculators. Answer 50+ questions across income, investments, insurance, debt, and goals — get a personalized Financial Health Score out of 900 with a detailed 10-page AI-powered PDF report.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-brand opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block" />
            </div>
          </Link>
        </div>
      </section>

      {/* Calculator Categories */}
      {categories.map((category) => (
        <section key={category.id} id={category.id} className="section-padding bg-surface-100 scroll-mt-16">
          <div className="container-custom">
            {/* Section header */}
            <div className="mb-8">
              <div className={cn('inline-block h-1 w-12 rounded-full bg-gradient-to-r mb-3', category.accentColor)} />
              <h2 className="text-display-sm text-primary-700 mb-2">{category.title}</h2>
              <p className="text-slate-500 max-w-xl">{category.subtitle}</p>
            </div>

            {/* Calculator grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.items.map((calc) => (
                <Link
                  key={calc.name}
                  href={calc.href}
                  className="card-base p-6 group hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', calc.gradient)}>
                      <calc.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full', calc.bgLight, calc.textColor)}>
                      {calc.tag}
                    </span>
                  </div>

                  <h3 className="font-bold text-primary-700 mb-2 group-hover:text-brand transition-colors">
                    {calc.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    {calc.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-sm font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Calculator <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Quick Links */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-display-sm text-primary-700 mb-3">Quick Access</h2>
            <p className="text-slate-500">Jump directly to the calculator you need</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-6xl mx-auto">
            {categories.flatMap((cat) => cat.items).map((calc) => (
              <Link
                key={calc.name}
                href={calc.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-100 transition-colors group"
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', calc.bgLight)}>
                  <calc.icon className={cn('w-4 h-4', calc.textColor)} />
                </div>
                <span className="text-sm font-medium text-primary-700 group-hover:text-brand transition-colors flex-1">
                  {calc.name}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <div className="bg-white rounded-lg p-4 mb-3">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              <strong className="text-slate-600">Calculator Disclaimer:</strong> {DISCLAIMER.calculator}
            </p>
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.mutual_fund} {DISCLAIMER.amfi} | {DISCLAIMER.sebi_investor}
          </p>
        </div>
      </section>
    </>
  );
}
