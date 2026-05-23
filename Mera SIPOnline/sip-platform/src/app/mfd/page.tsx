import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp, Wallet, BarChart3, LineChart, Target, Crosshair,
  Shield, Users, ArrowRight, Briefcase, Calculator,
  Percent, Receipt, Award, Sparkles, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';

// MFD landing page — INDEXABLE so Trustner team can surface it during sub-broker
// onboarding via Google search. NOT linked from top nav or homepage (discovery is
// intentional-search or direct-URL only). Individual internal business calcs
// (GST, LTV, cost-ratio, valuation, churn, NFO) remain noindex.
export const metadata: Metadata = {
  title: 'MFD Business Calculators | Trail Commission, AUM Growth, Sub-Broker Scale | Trustner',
  description:
    'Business-planning calculators for AMFI-registered Mutual Fund Distributors. Project trail commission, AUM growth, target income, sub-broker scaling and compare distribution channels — built by Trustner for India\'s MFD community.',
  keywords: [
    'MFD calculator',
    'trail commission calculator',
    'mutual fund distributor tools',
    'AMFI ARN calculator',
    'AUM growth calculator',
    'MFD business planning',
    'sub-broker commission',
    'MFD target income',
    'Trustner MFD platform',
  ],
  alternates: { canonical: '/mfd' },
};

type Tool = {
  title: string;
  subtitle: string;
  href: string;
  icon: typeof TrendingUp;
  tag?: string;
  tagColor?: 'amber' | 'brand' | 'blue' | 'rose' | 'violet' | 'gray';
  gradient: string;
};

const trailTools: Tool[] = [
  {
    title: 'New SIP Trail',
    subtitle: 'Start X new SIPs each month — project AUM buildup and trail income over N years.',
    href: '/mfd/trail-calculator?tab=new-sip',
    icon: TrendingUp,
    tag: 'Core',
    tagColor: 'amber',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Lump Sum Trail',
    subtitle: 'A one-time lump sum placement — watch it compound and pay trail for the holding period.',
    href: '/mfd/trail-calculator?tab=lumpsum',
    icon: Wallet,
    tag: 'Core',
    tagColor: 'amber',
    gradient: 'from-yellow-500 to-amber-600',
  },
  {
    title: 'SIP Book Growth',
    subtitle: 'Your existing SIP book + new SIPs added monthly — see how the book compounds.',
    href: '/mfd/trail-calculator?tab=sip-book',
    icon: BarChart3,
    tag: 'Core',
    tagColor: 'amber',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    title: 'Pure AUM Growth',
    subtitle: 'Your current book with zero new additions — pure market-driven trail escalation.',
    href: '/mfd/trail-calculator?tab=aum-growth',
    icon: LineChart,
    tag: 'Core',
    tagColor: 'amber',
    gradient: 'from-teal-500 to-emerald-600',
  },
  {
    title: 'Full Income Projection',
    subtitle: 'AUM + SIP book + new SIPs + lump-sums combined — the complete business view.',
    href: '/mfd/trail-calculator?tab=comprehensive',
    icon: Target,
    tag: 'Advanced',
    tagColor: 'brand',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'Target Income Reverse-Calc',
    subtitle: 'Want ₹1 lakh/month trail? Reverse-engineer the AUM & client count needed.',
    href: '/mfd/trail-calculator?tab=target',
    icon: Crosshair,
    tag: 'Planner',
    tagColor: 'brand',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Insurance vs MF Commission',
    subtitle: 'Traditional insurance first-year commission vs MF 10-year trail — eye-opener.',
    href: '/mfd/trail-calculator?tab=insurance-vs-mf',
    icon: Shield,
    tag: 'Compare',
    tagColor: 'rose',
    gradient: 'from-rose-500 to-red-600',
  },
  {
    title: 'Sub-Broker / Agency Scale',
    subtitle: 'Hire sub-brokers, split commissions, scale your agency — project the net income.',
    href: '/mfd/trail-calculator?tab=sub-broker',
    icon: Users,
    tag: 'Scale',
    tagColor: 'violet',
    gradient: 'from-purple-500 to-fuchsia-600',
  },
];

const businessTools: Tool[] = [
  {
    title: 'GST on Brokerage',
    subtitle: 'Compute 18% output GST on trail commission, claim Input Tax Credit on GST-invoiced business expenses, and see net take-home.',
    href: '/mfd/gst-brokerage',
    icon: Receipt,
    tag: 'Compliance',
    tagColor: 'blue',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    title: 'Client Lifetime Value',
    subtitle: 'Per-client trail over their investment journey + LTV/CAC ratio for sustainable campaign-level client acquisition.',
    href: '/mfd/client-ltv',
    icon: Award,
    tag: 'Growth',
    tagColor: 'brand',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Cost-to-Commission Ratio',
    subtitle: 'Operating costs (office, staff, software, marketing) vs trail income — see your true profit margin after GST & tax.',
    href: '/mfd/cost-ratio',
    icon: Percent,
    tag: 'Margin',
    tagColor: 'brand',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'MFD Business Valuation',
    subtitle: 'Estimate what your book is worth today using 3 methods — income multiple, % of AUM, and DCF. Typical range: 2–5× annual trail.',
    href: '/mfd/business-valuation',
    icon: Briefcase,
    tag: 'Succession',
    tagColor: 'violet',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    title: 'SIP Renewal & Churn',
    subtitle: 'Forecast trail impact at different retention rates (85-98%) — retention is the single biggest unheralded lever of MFD profits.',
    href: '/mfd/sip-churn',
    icon: Clock,
    tag: 'Retention',
    tagColor: 'amber',
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    title: 'NFO Incentive Tracker',
    subtitle: 'Model NFO trail vs existing-fund trail. See whether higher year-1 rates actually add up over the full holding period.',
    href: '/mfd/nfo-tracker',
    icon: Sparkles,
    tag: 'Trade-off',
    tagColor: 'rose',
    gradient: 'from-rose-500 to-pink-600',
  },
];

const TAG_STYLES: Record<NonNullable<Tool['tagColor']>, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  brand: 'bg-brand-50 text-brand border-brand-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  gray: 'bg-slate-100 text-slate-500 border-slate-200',
};

function ToolCard({ tool }: { tool: Tool }) {
  const disabled = tool.href === '#';
  const inner = (
    <div className={cn(
      'card-base p-6 group transition-all duration-200 h-full',
      !disabled && 'hover:shadow-elevated hover:-translate-y-0.5',
      disabled && 'opacity-75 cursor-not-allowed',
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center', tool.gradient)}>
          <tool.icon className="w-6 h-6 text-white" />
        </div>
        {tool.tag && (
          <span className={cn(
            'text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border',
            TAG_STYLES[tool.tagColor ?? 'gray'],
          )}>
            {tool.tag}
          </span>
        )}
      </div>
      <h3 className="font-bold text-primary-700 mb-2 group-hover:text-brand transition-colors">
        {tool.title}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-4">
        {tool.subtitle}
      </p>
      {!disabled && (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Open Calculator <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
  if (disabled) return inner;
  return (
    <Link href={tool.href} className="h-full block">
      {inner}
    </Link>
  );
}

export default function MFDLandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-pattern text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="container-custom relative z-10 py-16 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-200 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 backdrop-blur-sm border border-amber-300/30">
              <Briefcase className="w-3.5 h-3.5" />
              For AMFI-Registered Mutual Fund Distributors
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
              MFD Business{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400">
                Calculators
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
              Purpose-built tools to plan your MFD business: trail commission projections,
              AUM growth scenarios, target-income reverse-engineering, and income comparisons
              across distribution channels.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/mfd/trail-calculator"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg font-bold text-sm hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg"
              >
                <Calculator className="w-4 h-4" />
                Open Trail Calculator (8-in-1)
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trail Calculator Sub-Tools */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="mb-8">
            <div className="inline-block h-1 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 mb-3" />
            <h2 className="text-display-sm text-primary-700 mb-2">Trail Commission Planners</h2>
            <p className="text-slate-500 max-w-2xl">
              Eight specialized sub-tools inside the Trail Calculator — pick the scenario that matches your question.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trailTools.map((tool) => (
              <ToolCard key={tool.title} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Business Tools — NEW live */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mb-8">
            <div className="inline-block h-1 w-12 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 mb-3" />
            <h2 className="text-display-sm text-primary-700 mb-2">Business Planning Tools</h2>
            <p className="text-slate-500 max-w-2xl">
              Beyond trail projections — model GST liability, per-client LTV, cost margins, business valuation, retention impact, and NFO trade-offs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessTools.map((tool) => (
              <ToolCard key={tool.title} tool={tool} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href="https://wa.me/916003903737?text=Hi%20Trustner%2C%20I%27m%20an%20MFD%20and%20would%20like%20to%20suggest%20calculators%20for%20the%20%2Fmfd%20section."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Suggest a Calculator via WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <div className="bg-white rounded-lg p-4 mb-3 max-w-4xl mx-auto">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              <strong className="text-slate-600">MFD Tools Disclaimer:</strong> These calculators are for business-planning
              purposes only. Trail commission rates are indicative and vary by AMC, scheme and
              plan type. Actual income depends on the specific schemes distributed and is subject
              to change by AMCs. {DISCLAIMER.calculator}
            </p>
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.mutual_fund} {DISCLAIMER.amfi}
          </p>
        </div>
      </section>
    </>
  );
}
