'use client';

// unused: import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Target,
  Info,
  Clock,
  Award,
  Brain,
  Compass,
  Landmark,
  Layers,
  Building2,
  Scale,
  Calculator,
  Receipt,
  Handshake,
  Users,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getAllModules, getTotalStats, getModuleCountByTrack } from '@/data/modules';
import { getAllTracks } from '@/data/learn-tracks';
import {
  PiggyBank, BriefcaseBusiness, GitBranch, Globe2, Plane, Shield as ShieldIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  GraduationCap,
  Lightbulb,
  Target,
  Brain,
  Award,
  Info,
  Clock,
  Compass,
  Landmark,
  Layers,
  Building2,
  Scale,
  Calculator,
  Receipt,
  Handshake,
  Users,
  TrendingUp,
  PiggyBank,
  BriefcaseBusiness,
  GitBranch,
  Globe2,
  Plane,
  Shield: ShieldIcon,
};

const LEVEL_BADGE: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

export default function LearnPage() {
  const modules = getAllModules();
  const stats = getTotalStats();
  const firstModule = modules[0];

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-brand to-brand-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="container-custom relative z-10 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-6 backdrop-blur-sm">
              <GraduationCap className="w-3.5 h-3.5 text-accent" />
              SIP Knowledge Academy
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Learn SIP Investing{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-brand-200 to-accent">
                Like a Pro
              </span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
              A structured, academy-style learning system covering everything from SIP fundamentals
              to advanced strategies. Definitions, real-life examples, formulas, quizzes, and more.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {firstModule && (
                <Link
                  href={`/learn/${firstModule.slug}`}
                  className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-md font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg"
                >
                  <BookOpen className="w-4 h-4" />
                  Start with {firstModule.title}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <a
                href="#all-modules"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-md font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20"
              >
                Browse All Modules
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-white border-b border-surface-300/50 py-8">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: stats.modules, label: 'Learning Modules', icon: BookOpen },
              { value: `${stats.sections}+`, label: 'Topics Covered', icon: GraduationCap },
              { value: `${stats.mcqs}+`, label: 'Practice MCQs', icon: Brain },
              { value: `${stats.faqs}+`, label: 'FAQs Answered', icon: Lightbulb },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-brand" />
                </div>
                <div className="text-2xl font-bold text-primary-700">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SEVEN-TRACK CHOOSER ===== */}
      <section id="learning-tracks" className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-3">
              The Trustner Learn Academy
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-700 mb-4">
              Seven Wealth-Management Tracks
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
              Trustner covers the complete Indian investment-product spectrum &mdash; from mutual funds
              to AIFs, GIFT IFSC, and insurance &mdash; with regulator-aligned, investor-focused content
              written from a third-person authoritative perspective.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {getAllTracks().map((t) => {
              const TrackIcon = ICON_MAP[t.icon] || BookOpen;
              const moduleCount = getModuleCountByTrack(t.id);
              return (
                <Link
                  key={t.id}
                  href={`/learn/track/${t.id}`}
                  className={cn(
                    'group rounded-xl p-5 text-white shadow-md hover:shadow-xl transition-all relative overflow-hidden bg-gradient-to-br',
                    t.gradient,
                  )}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                        <TrackIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                        {moduleCount} {moduleCount === 1 ? 'module' : 'modules'}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold mb-1">{t.name}</h3>
                    <p className="text-xs text-white/70 mb-1 font-mono uppercase tracking-wider">
                      {t.shortName}
                    </p>
                    <p className="text-xs text-white/85 leading-relaxed mb-3 line-clamp-3">
                      {t.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-white/80">
                      <span>{t.regulator}</span>
                      <span className="inline-flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                        Explore <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-slate-400">
              Foundation tracks are written for investor education. Advanced certification-grade
              tracks (NISM / APMI / IRDAI exam-style) coming soon for sub-broker onboarding.
            </p>
          </div>
        </div>
      </section>

      {/* ===== ALL MODULES GRID ===== */}
      <section id="all-modules" className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-700 mb-4">
              All Modules — Mutual Funds Curriculum
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              The flagship 12-module Mutual Funds curriculum. Each module is designed as a complete
              learning unit with structured topics, real-world examples, interactive quizzes, and
              summary notes. Browse other tracks (SIF, PMS, AIF, GIFT, International, Insurance) above.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {modules.filter((m) => (m.track ?? 'mutual-funds') === 'mutual-funds').map((module, index) => {
              const IconComponent = ICON_MAP[module.icon] || BookOpen;
              const totalMCQs = module.sections.reduce(
                (acc, s) => acc + s.content.mcqs.length,
                0
              );

              return (
                <Link
                  key={module.id}
                  href={`/learn/${module.slug}`}
                  className="card-interactive p-6 group relative overflow-hidden"
                >
                  {/* Module number watermark */}
                  <div className="absolute top-4 right-4 text-6xl font-extrabold text-surface-200/60 select-none">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4',
                        module.color
                      )}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>

                    {/* Level & Time */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={LEVEL_BADGE[module.level]}>
                        {module.level}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {module.estimatedTime}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-primary-700 mb-2 group-hover:text-brand transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">
                      {module.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {module.sections.length} Topics
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5" />
                        {totalMCQs} MCQs
                      </span>
                    </div>

                    {/* Topics Preview */}
                    <div className="space-y-1.5">
                      {module.sections.slice(0, 3).map((section) => (
                        <div
                          key={section.id}
                          className="flex items-center gap-2 text-xs text-slate-500"
                        >
                          <ChevronRight className="w-3 h-3 text-brand" />
                          <span className="truncate">{section.title}</span>
                        </div>
                      ))}
                      {module.sections.length > 3 && (
                        <div className="text-xs text-brand font-medium pl-5">
                          +{module.sections.length - 3} more topics
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="mt-5 pt-4 border-t border-surface-300/50 flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand group-hover:underline">
                        Start Learning
                      </span>
                      <ArrowRight className="w-4 h-4 text-brand group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-700 mb-4">
              How Our Learning System Works
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Every topic follows a proven pedagogical structure designed for maximum retention and understanding.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: Info,
                title: 'Clear Definitions',
                description:
                  'Every topic starts with a precise, jargon-free definition followed by a simple explanation anyone can understand.',
                color: 'bg-brand-50 text-brand',
              },
              {
                step: '02',
                icon: Lightbulb,
                title: 'Real-Life Examples',
                description:
                  'See how concepts apply in everyday Indian financial scenarios with relatable stories and calculations.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                step: '03',
                icon: Target,
                title: 'Key Points & Formulas',
                description:
                  'Important takeaways, formulas, and numerical examples are highlighted for quick revision and deep understanding.',
                color: 'bg-teal-50 text-teal-600',
              },
              {
                step: '04',
                icon: Brain,
                title: 'Quiz & Assessment',
                description:
                  'Test your knowledge with MCQ quizzes after every topic. Get instant feedback with detailed explanations.',
                color: 'bg-secondary-50 text-secondary-600',
              },
            ].map((item) => (
              <div key={item.step} className="card-base p-6 text-center relative">
                <div className="absolute top-3 right-3 text-xs font-bold text-surface-300">
                  STEP {item.step}
                </div>
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4',
                    item.color
                  )}
                >
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-primary-700 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Extra Detail */}
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="card-base p-6 sm:p-8 bg-gradient-to-r from-brand-50/50 to-brand-50/50">
              <h3 className="text-lg font-bold text-primary-700 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-brand" />
                What You Get in Each Topic
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  'Precise definition of the concept',
                  'Simple explanation in everyday language',
                  'Real-life Indian scenario example',
                  'Bullet-point key takeaways',
                  'Mathematical formula (where applicable)',
                  'Worked-out numerical example',
                  'FAQ section with common doubts',
                  'MCQ quiz with explanations',
                  'Summary notes for quick revision',
                  'Related topics for further reading',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="section-padding bg-gradient-to-r from-primary-700 via-brand to-brand-800 text-white">
        <div className="container-custom text-center">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-brand-200" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Begin Your Learning Journey?
          </h2>
          <p className="text-lg text-brand-100 mb-8 max-w-2xl mx-auto">
            Start from the very basics and progress to advanced SIP strategies at your own pace.
            Every topic is free, forever.
          </p>
          {firstModule && (
            <Link
              href={`/learn/${firstModule.slug}`}
              className="inline-flex items-center gap-2 bg-white text-brand px-8 py-3.5 rounded-md font-semibold hover:bg-slate-100 transition-colors shadow-lg"
            >
              <BookOpen className="w-5 h-5" />
              Start with {firstModule.title}
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
