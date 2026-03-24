'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  FileText,
  CheckCircle2,
  Award,
  Users,
  Lock,
  Cpu,
  ClipboardList,
  BarChart3,
  Mail,
  Target,
  GraduationCap,
  Heart,
  Home,
  ShieldAlert,
  Calculator,
  Sparkles,
} from 'lucide-react';
import TierSelector from '@/components/financial-planning/TierSelector';
import { STANDALONE_PLANS } from '@/lib/constants/tier-config';

/* ═══════════════════════════════════════════════════════════════════════
   ICON LOOKUP for standalone plans
   ═══════════════════════════════════════════════════════════════════════ */

const ICON_MAP: Record<string, typeof Target> = {
  Target,
  GraduationCap,
  Heart,
  Home,
  ShieldAlert,
  Calculator,
};

/* ═══════════════════════════════════════════════════════════════════════
   STATIC DATA
   ═══════════════════════════════════════════════════════════════════════ */

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Sparkles,
    title: 'Choose Your Plan',
    description: 'Pick from a quick health check, goal-based plan, or full financial blueprint.',
  },
  {
    step: 2,
    icon: ClipboardList,
    title: 'Fill the Questionnaire',
    description: 'Answer questions about your income, expenses, goals, and assets.',
  },
  {
    step: 3,
    icon: BarChart3,
    title: 'Get Your Score',
    description: 'AI-powered analysis delivers your Financial Health Score in seconds.',
  },
  {
    step: 4,
    icon: Mail,
    title: 'Receive Your Report',
    description: 'A detailed CFP-grade PDF report emailed to you instantly.',
  },
];

const TRUST_POINTS = [
  {
    icon: Award,
    title: 'AMFI Registered',
    description: 'ARN-286886 — fully regulated mutual fund distributor.',
  },
  {
    icon: Users,
    title: '10,000+ Clients Served',
    description: 'Trusted by families across India for over a decade.',
  },
  {
    icon: Lock,
    title: 'Data Not Stored',
    description: 'Your report is emailed to you — we do not retain your financial data.',
  },
  {
    icon: Cpu,
    title: 'Powered by Advanced AI',
    description: 'CFP-grade analysis algorithms deliver institutional-quality insights.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   HERO GAUGE SVG
   ═══════════════════════════════════════════════════════════════════════ */

function ScoreGauge() {
  const radius = 80;
  const stroke = 12;
  const center = 100;
  const circumference = Math.PI * radius;
  const scorePercent = 742 / 900;
  const filledLength = circumference * scorePercent;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="120" viewBox="0 0 200 120" className="drop-shadow-lg">
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${circumference}`}
          className="transition-all duration-1000"
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14B8A6" />
            <stop offset="50%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#F0FDFA" />
          </linearGradient>
        </defs>
        <text
          x={center}
          y={center - 16}
          textAnchor="middle"
          className="fill-white text-[2.75rem] font-extrabold"
          style={{ fontSize: '2.75rem', fontWeight: 800 }}
        >
          742
        </text>
        <text
          x={center}
          y={center + 6}
          textAnchor="middle"
          className="fill-white/70 text-[0.65rem] font-medium tracking-widest uppercase"
          style={{ fontSize: '0.65rem' }}
        >
          out of 900
        </text>
      </svg>
      <div className="absolute inset-0 rounded-full bg-brand-400/10 blur-2xl pointer-events-none" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export default function FinancialPlanningPage() {
  return (
    <>
      {/* ═══════════ 1. HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white">
        {/* Decorative orbs */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

        <div className="container-custom relative z-10 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="text-center lg:text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span>100% Free Health Check &middot; No Login Required</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-display font-extrabold leading-tight mb-6">
                AI-Powered{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-200 to-accent">
                  Financial Planning
                </span>
              </h1>

              <p className="text-base lg:text-lg text-slate-300 leading-relaxed max-w-xl mb-3 font-semibold">
                India&apos;s First Free CFP-Grade Financial Health Assessment
              </p>

              <p className="text-base lg:text-lg text-slate-400 leading-relaxed max-w-xl mb-8">
                Choose the depth of analysis that matches your needs — from a quick 5-minute health check
                to a comprehensive financial blueprint rivaling what top CFPs charge &#8377;25,000+ for.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
                <Link
                  href="/financial-planning/basic"
                  className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-8 py-4 rounded-lg font-bold text-base transition-all shadow-lg shadow-amber-400/25 pulse-ring-coral"
                >
                  Start Free Health Check
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#plans"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-lg font-semibold text-base transition-all border border-white/20"
                >
                  <FileText className="w-5 h-5" />
                  Explore All Plans
                </a>
              </div>

              <p className="text-sm text-slate-400">
                5-30 minutes &middot; No credit card needed &middot; Instant score
              </p>
            </div>

            {/* Right — Gauge */}
            <div className="flex justify-center lg:justify-end animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                <div className="card-glass-dark p-8 sm:p-10 flex flex-col items-center gap-4">
                  <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">
                    Sample Score
                  </p>
                  <ScoreGauge />
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">Good Financial Health</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4 w-full">
                    {['Cashflow', 'Protection', 'Growth'].map((label) => (
                      <div key={label} className="text-center">
                        <div className="text-xs text-white/40 mb-1">{label}</div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-300"
                            style={{ width: `${70 + Math.floor(Math.random() * 20)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 2. TIER SELECTOR ═══════════ */}
      <section id="plans" className="bg-mesh section-padding">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-3">
              Choose Your Plan
            </p>
            <h2 className="text-display-sm text-primary-700 mb-4">
              Financial Plans for Every Need
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              From a quick health check to a comprehensive financial blueprint — pick the depth that matches your goals.
            </p>
          </div>

          <TierSelector />
        </div>
      </section>

      {/* ═══════════ 3. STANDALONE PLANS ═══════════ */}
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-3">
              Goal-Specific Modules
            </p>
            <h2 className="text-display-sm text-primary-700 mb-4">
              Plan for Specific Life Goals
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Need focused planning for one goal? Choose a standalone module and get a targeted action plan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {STANDALONE_PLANS.map((plan) => {
              const IconComp = ICON_MAP[plan.iconName] || Target;
              return (
                <Link
                  key={plan.slug}
                  href={`/financial-planning/${plan.slug}`}
                  className="card-base p-6 hover-lift group transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-primary-700 mb-2 group-hover:text-brand-700 transition-colors">
                    {plan.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 bg-surface-200 px-3 py-1 rounded-full">
                      {plan.reportPages}-page report
                    </span>
                    <ArrowRight className="w-4 h-4 text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ 4. HOW IT WORKS ═══════════ */}
      <section className="bg-mesh section-padding">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-3">
              Simple Process
            </p>
            <h2 className="text-display-sm text-primary-700 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Four simple steps to your personalized financial plan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative text-center group">
                {item.step < 4 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-brand-200 to-transparent" />
                )}

                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-50 border border-brand-100 mb-5 mx-auto transition-all group-hover:shadow-glow-brand group-hover:scale-105">
                  <item.icon className="w-8 h-8 text-brand-700" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-primary-700 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 5. TRUST SECTION ═══════════ */}
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-3">
              Backed by Trust
            </p>
            <h2 className="text-display-sm text-primary-700 mb-4">
              Why Trust Trustner
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              We have been helping Indian families build wealth responsibly for over a decade.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {TRUST_POINTS.map((point) => (
              <div
                key={point.title}
                className="text-center p-6 rounded-xl border border-surface-300/60 hover:border-brand-200 transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                  <point.icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-primary-700 mb-2">{point.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 6. BOTTOM CTA ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white section-padding">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

        <div className="container-custom relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
            Start Your Free Financial
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent">
              Health Check Today
            </span>
          </h2>

          <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of Indians who have taken control of their financial future.
            It takes just 5 minutes and costs absolutely nothing.
          </p>

          <Link
            href="/financial-planning/basic"
            className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-lg shadow-amber-400/25 pulse-ring"
          >
            Start Free Health Check
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="mt-6 text-sm text-slate-400">
            No credit card &middot; No login &middot; Instant results
          </p>
        </div>
      </section>

      {/* ═══════════ 7. DISCLAIMER FOOTER ═══════════ */}
      <section className="bg-surface-200 py-8">
        <div className="container-custom">
          <p className="text-xs text-slate-400 leading-relaxed text-center max-w-4xl mx-auto">
            This Financial Wellness Assessment is for educational purposes only.
            Trustner Asset Services Pvt. Ltd. (ARN-286886) is an AMFI Registered Mutual Fund Distributor
            and does not provide investment advisory services under SEBI (Investment Advisers) Regulations, 2013.
            The Financial Health Score and recommendations are generated algorithmically and should not be construed
            as personalized investment advice. Past performance does not guarantee future results.
            Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.
          </p>
        </div>
      </section>
    </>
  );
}
