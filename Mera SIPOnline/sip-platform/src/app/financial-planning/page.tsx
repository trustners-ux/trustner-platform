'use client';

import Link from 'next/link';
import {
  Activity,
  Shield,
  TrendingUp,
  Wallet,
  Target,
  FileText,
  Smartphone,
  ClipboardList,
  Zap,
  Mail,
  Award,
  Users,
  Lock,
  Cpu,
  ArrowRight,
  Heart,
  PiggyBank,
  Scale,
  CheckCircle2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════ */

const REPORT_CARDS = [
  {
    icon: Activity,
    title: 'Financial Health Score (0-900)',
    description: 'A single number that captures your complete financial wellness across 5 pillars.',
    color: 'bg-brand-50 text-brand-700',
  },
  {
    icon: Wallet,
    title: 'Net Worth Analysis',
    description: 'Detailed breakdown of your assets vs liabilities with growth trajectory.',
    color: 'bg-teal-50 text-teal-700',
  },
  {
    icon: PiggyBank,
    title: 'Retirement Gap Assessment',
    description: 'How much you need vs how much you are on track for — with clear shortfall analysis.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: Target,
    title: 'Goal Funding Analysis',
    description: 'Check if your savings rate supports your goals — education, home, travel, and more.',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    icon: Shield,
    title: 'Insurance Coverage Check',
    description: 'Identify gaps in your life, health, and critical illness protection.',
    color: 'bg-secondary-50 text-secondary-500',
  },
  {
    icon: FileText,
    title: 'Personalized Action Plan',
    description: 'Prioritized steps you can take today to improve your financial health.',
    color: 'bg-emerald-50 text-emerald-700',
  },
];

const STEPS = [
  {
    step: 1,
    icon: Smartphone,
    title: 'Verify Your Identity',
    description: 'Quick OTP verification to keep your data secure.',
  },
  {
    step: 2,
    icon: ClipboardList,
    title: 'Answer 50+ Questions',
    description: 'Comprehensive questions covering income, expenses, goals, and assets.',
  },
  {
    step: 3,
    icon: Zap,
    title: 'Get Your Instant Score',
    description: 'AI-powered analysis delivers your Financial Health Score in seconds.',
  },
  {
    step: 4,
    icon: Mail,
    title: 'Receive Detailed PDF Report',
    description: 'CFP-grade report emailed to you — no data stored on our servers.',
  },
];

const PILLARS = [
  {
    icon: Wallet,
    title: 'Cashflow Health',
    description: 'Income stability, savings rate, and emergency fund adequacy.',
    weight: '25%',
  },
  {
    icon: Shield,
    title: 'Protection',
    description: 'Life, health, and critical illness insurance coverage gaps.',
    weight: '20%',
  },
  {
    icon: TrendingUp,
    title: 'Investments',
    description: 'Asset allocation, diversification, and growth trajectory.',
    weight: '20%',
  },
  {
    icon: Scale,
    title: 'Debt Management',
    description: 'Debt-to-income ratio, EMI burden, and repayment health.',
    weight: '15%',
  },
  {
    icon: Heart,
    title: 'Retirement Readiness',
    description: 'Corpus target vs current trajectory, pension, and withdrawal plan.',
    weight: '20%',
  },
];

const SCORE_BANDS = [
  { label: 'Critical', range: '0-300', color: 'bg-red-500' },
  { label: 'Needs Work', range: '301-500', color: 'bg-orange-500' },
  { label: 'Fair', range: '501-650', color: 'bg-yellow-500' },
  { label: 'Good', range: '651-780', color: 'bg-teal-500' },
  { label: 'Excellent', range: '781-900', color: 'bg-emerald-500' },
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
  const circumference = Math.PI * radius; // half-circle arc length

  // 742 out of 900 = ~82.4%
  const scorePercent = 742 / 900;
  const filledLength = circumference * scorePercent;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="200"
        height="120"
        viewBox="0 0 200 120"
        className="drop-shadow-lg"
      >
        {/* Background arc */}
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Score arc */}
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
        {/* Score text */}
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

      {/* Decorative glow ring */}
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
                <span>100% Free &middot; No Login Required</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-display font-extrabold leading-tight mb-6">
                Know Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-200 to-accent">
                  Financial Health Score
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-300 leading-relaxed max-w-xl mb-8">
                India&apos;s first AI-powered financial wellness assessment — absolutely free.
                Get a CFP-grade analysis of your entire financial life in under 10 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
                <Link
                  href="/financial-planning/assess"
                  className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-8 py-4 rounded-lg font-bold text-base transition-all shadow-lg shadow-amber-400/25 pulse-ring-coral"
                >
                  Start Free Assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="/sample-financial-health-report.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-lg font-semibold text-base transition-all border border-white/20"
                >
                  <FileText className="w-5 h-5" />
                  View Sample Report
                </a>
              </div>

              <p className="text-sm text-slate-400">
                Takes 8-10 minutes &middot; No credit card needed &middot; Instant score
              </p>
            </div>

            {/* Right — Gauge */}
            <div className="flex justify-center lg:justify-end animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                {/* Glass card container */}
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
                            style={{ width: `${65 + Math.random() * 25}%` }}
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

      {/* ═══════════ 2. WHAT YOU GET ═══════════ */}
      <section className="bg-mesh section-padding">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-3">
              Your Comprehensive Report
            </p>
            <h2 className="text-display-sm text-primary-700 mb-4">
              What You Get — For Free
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              A detailed financial wellness report that would cost Rs 5,000+ from a certified planner.
              We believe everyone deserves access to quality financial analysis.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {REPORT_CARDS.map((card) => (
              <div key={card.title} className="card-base p-6 hover-lift group">
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-primary-700 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 3. HOW IT WORKS ═══════════ */}
      <section className="bg-white section-padding">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-3">
              Simple Process
            </p>
            <h2 className="text-display-sm text-primary-700 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Four simple steps to your complete financial health report.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((item) => (
              <div key={item.step} className="relative text-center group">
                {/* Connector line (hidden on last item and mobile) */}
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

      {/* ═══════════ 4. SCORE EXPLAINER ═══════════ */}
      <section className="bg-mesh section-padding">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-brand uppercase tracking-wider mb-3">
              The 5 Pillars
            </p>
            <h2 className="text-display-sm text-primary-700 mb-4">
              What Makes Up Your Score
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Your Financial Health Score is a weighted composite of 5 critical financial dimensions.
            </p>
          </div>

          {/* Pillar cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-14">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="card-base p-5 text-center hover-lift group">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110">
                  <pillar.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-primary-700 mb-1">{pillar.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{pillar.description}</p>
                <span className="inline-block bg-brand-50 text-brand-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  {pillar.weight}
                </span>
              </div>
            ))}
          </div>

          {/* Score scale visualization */}
          <div className="max-w-3xl mx-auto">
            <div className="card-base p-6 sm:p-8">
              <h3 className="text-lg font-bold text-primary-700 mb-6 text-center">
                Score Grade Bands
              </h3>

              {/* Bar visualization */}
              <div className="flex rounded-full overflow-hidden h-5 mb-4">
                {SCORE_BANDS.map((band) => (
                  <div key={band.label} className={`flex-1 ${band.color}`} />
                ))}
              </div>

              {/* Labels */}
              <div className="flex">
                {SCORE_BANDS.map((band) => (
                  <div key={band.label} className="flex-1 text-center">
                    <p className="text-xs font-bold text-primary-700">{band.label}</p>
                    <p className="text-[10px] text-slate-400">{band.range}</p>
                  </div>
                ))}
              </div>

              {/* Example marker */}
              <div className="relative mt-4">
                <div className="flex items-center justify-center gap-2 text-sm text-brand-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Score of 742 = &ldquo;Good&rdquo; financial health</span>
                </div>
              </div>
            </div>
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
            Your financial health matters.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent">
              Start your free assessment now.
            </span>
          </h2>

          <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of Indians who have taken control of their financial future.
            It takes less than 10 minutes and costs absolutely nothing.
          </p>

          <Link
            href="/financial-planning/assess"
            className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-10 py-4 rounded-lg font-bold text-lg transition-all shadow-lg shadow-amber-400/25 pulse-ring"
          >
            Get My Financial Health Score
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
