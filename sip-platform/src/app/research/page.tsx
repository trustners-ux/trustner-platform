'use client';

import Link from 'next/link';
import {
  BarChart3, TrendingUp, TrendingDown, FlaskConical, BookOpen,
  ArrowRight, Activity, PieChart, Zap, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const researchTopics = [
  {
    title: 'Historical SIP Returns',
    slug: 'historical-returns',
    description: 'Explore 10, 15, and 20-year SIP returns across Nifty 50, Sensex, and major fund categories. Data-backed analysis of long-term SIP performance.',
    icon: BarChart3,
    color: 'from-brand-500 to-brand-600',
    stats: '20+ years of data',
    highlights: [
      'No 10-year SIP in Nifty has given negative returns',
      'Average 10-year SIP CAGR: 12-15%',
      'Best entry: SIPs started before market corrections',
    ],
  },
  {
    title: 'SIP in Bull vs Bear Markets',
    slug: 'bull-vs-bear',
    description: 'How SIP performs differently in rising and falling markets. Understand why market crashes are actually beneficial for SIP investors.',
    icon: Activity,
    color: 'from-teal-500 to-teal-600',
    stats: 'Cycle analysis',
    highlights: [
      'SIPs started in bear markets outperform by 20-30%',
      'Rupee Cost Averaging shines during volatility',
      'Case studies from 2008, 2015, 2020 crashes',
    ],
  },
  {
    title: 'Rolling Returns Study',
    slug: 'rolling-returns',
    description: 'The most accurate method to evaluate SIP performance. Rolling returns eliminate the bias of start and end dates.',
    icon: TrendingUp,
    color: 'from-brand-700 to-secondary-600',
    stats: 'Statistical analysis',
    highlights: [
      'What are rolling returns and why they matter',
      '5, 7, 10, 15-year rolling return distributions',
      'Probability of positive returns over different periods',
    ],
  },
  {
    title: 'XIRR Explained',
    slug: 'xirr-explained',
    description: 'The correct way to calculate SIP returns. Learn why CAGR is misleading for SIP and how XIRR gives accurate results.',
    icon: PieChart,
    color: 'from-amber-500 to-orange-600',
    stats: 'Methodology deep-dive',
    highlights: [
      'Why CAGR does not work for SIP returns',
      'Step-by-step XIRR calculation with examples',
      'Common mistakes in SIP return calculation',
    ],
  },
  {
    title: 'SIP Case Studies',
    slug: 'case-studies',
    description: 'Real-world scenarios showing SIP outcomes across different life stages, amounts, and market conditions.',
    icon: FileText,
    color: 'from-rose-500 to-pink-600',
    stats: '10+ scenarios',
    highlights: [
      'Fresh graduate starting ₹3,000 SIP',
      'Family planning ₹50,000 SIP portfolio',
      'Pre-retiree shifting from equity to debt SIP',
    ],
  },
  {
    title: 'Market Volatility Simulator',
    slug: 'volatility-simulator',
    description: 'Interactive tool to simulate market crashes, slow growth periods, and recovery phases. See how your SIP holds up under stress.',
    icon: Zap,
    color: 'from-red-500 to-rose-600',
    stats: 'Interactive tool',
    highlights: [
      'Simulate market crash at any year',
      'Adjust correction severity and recovery period',
      'Compare normal vs stressed SIP portfolios',
    ],
    badge: 'Interactive',
  },
];

export default function ResearchPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl animate-in">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-6 backdrop-blur-sm">
              <FlaskConical className="w-3.5 h-3.5 text-accent" />
              Research & Data
            </div>
            <h1 className="text-4xl lg:text-display font-extrabold mb-4">
              SIP Research & Data Hub
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Data-driven analysis of SIP performance across market cycles. Historical returns, rolling returns studies,
              case studies, and interactive simulators — backed by decades of market data.
            </p>
          </div>
        </div>
      </section>

      {/* Research Topics */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-6">
            {researchTopics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/research/${topic.slug}`}
                className="card-interactive p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0', topic.color)}>
                    <topic.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-primary-700 group-hover:text-brand transition-colors">
                        {topic.title}
                      </h2>
                      {topic.badge && (
                        <span className="text-[10px] font-semibold bg-positive-50 text-positive px-2 py-0.5 rounded-full">
                          {topic.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-3">{topic.description}</p>

                    <div className="space-y-1.5">
                      {topic.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                          <div className="w-1 h-1 rounded-full bg-brand mt-1.5 shrink-0" />
                          {h}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-200">
                      <span className="text-xs text-slate-400">{topic.stats}</span>
                      <span className="text-xs font-medium text-brand flex items-center gap-1 group-hover:gap-2 transition-all">
                        Explore <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Key Findings Summary */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="text-display-sm text-primary-700 text-center mb-10">Key Research Findings</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { stat: '0%', label: 'Chance of loss in any 10-year Nifty SIP', icon: TrendingUp, color: 'text-positive' },
              { stat: '12-15%', label: 'Average 10-year SIP CAGR in equity', icon: BarChart3, color: 'text-brand' },
              { stat: '4x', label: 'Typical wealth multiplier in 15-year SIP', icon: Zap, color: 'text-accent-600' },
              { stat: '20-30%', label: 'Extra returns from SIPs started in bear markets', icon: TrendingDown, color: 'text-sip-purple' },
            ].map((item) => (
              <div key={item.label} className="text-center card-base p-6">
                <item.icon className={cn('w-8 h-8 mx-auto mb-3', item.color)} />
                <div className="text-2xl font-bold text-primary-700 mb-1">{item.stat}</div>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Research data is based on historical performance of Indian equity markets and mutual fund indices.
            Past performance does not guarantee future returns. The information is for educational purposes only.
          </p>
        </div>
      </section>
    </>
  );
}
