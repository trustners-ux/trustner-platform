import Link from 'next/link';
import type { Metadata } from 'next';
import {
  BookOpen, IndianRupee, Globe, Newspaper, BarChart3, Image as ImageIcon,
  ChevronRight, GraduationCap, Calculator,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Resources — Learning, Taxation & Research | MeraSIP.com',
  description:
    'Free financial resources — Learning Academy, MF Taxation Guides, NRI Tax Guide, SIP Glossary, Blog, Market Pulse, and Gallery. Everything an investor needs.',
  openGraph: {
    title: 'Resources | MeraSIP.com',
    description: 'Free financial learning, taxation guides, research, and tools for Indian mutual fund investors.',
    url: 'https://www.merasip.com/resources',
    type: 'website',
  },
};

const resources = [
  {
    title: 'Learning Academy',
    description: '12 NISM VA-aligned modules with 60+ sections covering everything from SIP basics to advanced scheme selection. MCQ assessments and progress tracking included.',
    href: '/learn',
    icon: GraduationCap,
    gradient: 'from-brand-500 to-teal-600',
    bg: 'bg-brand-50',
    color: 'text-brand',
    tag: '12 Modules',
  },
  {
    title: 'MF Taxation Guide',
    description: 'Comprehensive Indian mutual fund taxation — equity, debt, hybrid, SIP FIFO rules, ELSS, TDS, tax-loss harvesting, and complete tax changes timeline.',
    href: '/resources/taxation',
    icon: IndianRupee,
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50',
    color: 'text-emerald-600',
    tag: '10 Sections',
  },
  {
    title: 'NRI Taxation Guide',
    description: 'Complete tax guide for NRIs investing in Indian mutual funds — US (PFIC/FATCA), Canada, Europe, UAE/GCC, DTAA treaties, and repatriation rules.',
    href: '/resources/taxation/nri',
    icon: Globe,
    gradient: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50',
    color: 'text-purple-600',
    tag: '9 Sections',
  },
  {
    title: 'SIP Glossary',
    description: '45+ financial terms explained in simple language — from AUM and NAV to XIRR and Sharpe Ratio. Searchable, categorized, and cross-linked.',
    href: '/glossary',
    icon: BookOpen,
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    color: 'text-amber-600',
    tag: '45+ Terms',
  },
  {
    title: 'Blog',
    description: 'Expert articles on SIP strategies, market analysis, tax planning, and fund selection. Written by CFP Ram Shah with real-world advisory experience.',
    href: '/blog',
    icon: Newspaper,
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'bg-blue-50',
    color: 'text-blue-600',
    tag: '74+ Articles',
  },
  {
    title: 'Market Pulse',
    description: 'Weekly market commentary, real-time indicators, SIP timing insights, and sentiment analysis to help you make informed investment decisions.',
    href: '/market-pulse',
    icon: BarChart3,
    gradient: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-50',
    color: 'text-teal-600',
    tag: 'Weekly Updates',
  },
  {
    title: 'Research Center',
    description: '6 data-driven studies — historical SIP returns, rolling returns analysis, bull vs bear markets, volatility simulations, and XIRR case studies.',
    href: '/research',
    icon: Calculator,
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    color: 'text-rose-600',
    tag: '6 Studies',
  },
  {
    title: 'Gallery',
    description: 'Photos from team events, office milestones, industry conferences, and client celebrations at Trustner Asset Services.',
    href: '/gallery',
    icon: ImageIcon,
    gradient: 'from-slate-500 to-slate-700',
    bg: 'bg-slate-50',
    color: 'text-slate-600',
    tag: 'Photos',
  },
];

export default function ResourcesPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-hero-pattern text-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium mb-6 border border-white/10">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>Free Resources for Investors</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              Learning &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-accent">
                Resources
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl">
              Everything you need to become a smarter investor — learning modules, taxation guides,
              market research, expert blog, and financial glossary. All free, always.
            </p>
          </div>
        </div>
      </section>

      {/* Resource Grid */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {resources.map((r) => (
              <Link
                key={r.title}
                href={r.href}
                className="card-base p-6 group hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center`}>
                    <r.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${r.bg} ${r.color}`}>
                    {r.tag}
                  </span>
                </div>
                <h2 className="font-bold text-primary-700 mb-2 group-hover:text-brand transition-colors">
                  {r.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {r.description}
                </p>
                <div className="flex items-center gap-1 text-sm font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
