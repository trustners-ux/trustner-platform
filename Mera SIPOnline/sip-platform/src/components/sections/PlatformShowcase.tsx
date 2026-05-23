'use client';

import Link from 'next/link';
import {
  Calculator,
  GraduationCap,
  BarChart3,
  Brain,
  Target,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Shield,
  Heart,
} from 'lucide-react';

const PLATFORM_FEATURES = [
  {
    icon: Calculator,
    title: '52 Financial Calculators',
    desc: 'SIP, EMI, tax, insurance, retirement, FIRE, child education, SSY, NRI deposits, senior income and more — every tool for every life stage.',
    href: '/calculators',
    color: 'bg-brand-50 text-brand border-brand-200/50',
    iconBg: 'bg-brand-100',
    stat: '52+',
    statLabel: 'Tools',
  },
  {
    icon: GraduationCap,
    title: '12 Learning Modules',
    desc: '100+ lessons with MCQs, formulas, FAQs, and real-life examples — from SIP basics to advanced strategies.',
    href: '/learn',
    color: 'bg-amber-50 text-amber-700 border-amber-200/50',
    iconBg: 'bg-amber-100',
    stat: '100+',
    statLabel: 'Lessons',
  },
  {
    icon: BarChart3,
    title: '6 Research Studies',
    desc: 'Rolling returns, historical analysis, volatility simulation, bull vs bear, XIRR case studies — data-backed decisions.',
    href: '/research',
    color: 'bg-purple-50 text-purple-700 border-purple-200/50',
    iconBg: 'bg-purple-100',
    stat: '20+',
    statLabel: 'Years Data',
  },
  {
    icon: Brain,
    title: 'AI Financial Planning',
    desc: 'Get your Financial Health Score (0-900) with CFP-grade analysis. 3 tiers — Basic, Standard & Comprehensive.',
    href: '/financial-planning',
    color: 'bg-teal-50 text-teal-700 border-teal-200/50',
    iconBg: 'bg-teal-100',
    stat: 'Free',
    statLabel: 'Assessment',
  },
  {
    icon: BookOpen,
    title: 'Taxation & Resources',
    desc: 'Complete mutual fund taxation guide, LTCG/STCG rules, TDS, indexation — everything in one place.',
    href: '/resources/taxation',
    color: 'bg-rose-50 text-rose-700 border-rose-200/50',
    iconBg: 'bg-rose-100',
    stat: '2025-26',
    statLabel: 'Updated',
  },
  {
    icon: TrendingUp,
    title: 'Blog & Market Insights',
    desc: 'Weekly articles on SIP strategies, market analysis, beginner guides, and investment tips by CFP Ram Shah.',
    href: '/blog',
    color: 'bg-sky-50 text-sky-700 border-sky-200/50',
    iconBg: 'bg-sky-100',
    stat: '50+',
    statLabel: 'Articles',
  },
];

export function PlatformShowcase() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-50 rounded-full px-4 py-2 text-xs font-semibold text-brand mb-4 border border-brand-200/50 shadow-sm">
            <Shield className="w-3.5 h-3.5" />
            Complete Platform
          </div>
          <h2 className="text-display-sm text-primary-700 mb-3">
            Everything You Need — In One Place
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            MeraSIP is not just a calculator website. It is a complete investment
            ecosystem — education, research, planning tools, and professional
            guidance under one roof.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {PLATFORM_FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className={`group relative rounded-2xl border p-6 transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 ${feature.color}`}
            >
              {/* Stat Badge */}
              <div className="absolute top-4 right-4 text-right">
                <div className="text-lg font-extrabold leading-none">
                  {feature.stat}
                </div>
                <div className="text-[10px] font-medium opacity-70 mt-0.5">
                  {feature.statLabel}
                </div>
              </div>

              {/* Icon */}
              <div
                className={`w-11 h-11 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}
              >
                <feature.icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <h3 className="font-bold text-primary-700 mb-2 pr-12">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {feature.desc}
              </p>

              {/* Explore Link */}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:gap-2.5 transition-all">
                Explore
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>

        {/* Summary Line */}
        <div className="mt-10 text-center">
          <div className="inline-flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-brand" />
              52 Calculators
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
              100+ Lessons
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              6 Research Tools
            </span>
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-teal-600" />
              AI Planning
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              100% Free
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
