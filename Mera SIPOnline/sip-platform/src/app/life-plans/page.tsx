'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Code,
  Shield,
  Building2,
  Scale,
  GraduationCap,
  Store,
  Rocket,
  Home,
  BookOpen,
  Heart,
  Laptop,
  Globe,
  Sparkles,
  ArrowRight,
  Users,
  Brain,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import { getAllProfiles, getCategories } from '@/data/life-plans';
import type { LifePlanProfile, ProfileCategory } from '@/types/life-plans';

/* ─── Icon Map ─── */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  Code,
  Shield,
  Building2,
  Scale,
  GraduationCap,
  Store,
  Rocket,
  Home,
  BookOpen,
  Heart,
  Laptop,
  Globe,
  Sparkles,
};

/* ─── Category Tab Colors ─── */
const CATEGORY_STYLES: Record<string, string> = {
  All: 'bg-brand-700 text-white',
  'Salaried Professionals': 'bg-blue-600 text-white',
  'Business & Entrepreneurs': 'bg-orange-600 text-white',
  'Life Stage': 'bg-pink-600 text-white',
  'Special Segments': 'bg-indigo-600 text-white',
};

/* ─── Profile Card ─── */
function ProfileCard({ profile }: { profile: LifePlanProfile }) {
  const IconComponent = ICON_MAP[profile.icon] || BookOpen;

  return (
    <Link
      href={`/life-plans/${profile.slug}`}
      className="group card-interactive rounded-xl overflow-hidden"
    >
      {/* Gradient top band */}
      <div className={`h-2 bg-gradient-to-r ${profile.coverGradient}`} />

      <div className="p-6">
        {/* Icon + Category */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${profile.coverGradient} flex items-center justify-center shadow-md`}
          >
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {profile.category}
          </span>
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-lg font-bold text-primary-700 mb-1.5 group-hover:text-brand-700 transition-colors">
          {profile.title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          {profile.subtitle}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {profile.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block text-[11px] font-medium px-2.5 py-1 bg-surface-200 text-slate-600 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Arrow link */}
        <div className="flex items-center text-brand-700 text-sm font-semibold group-hover:gap-2 gap-1 transition-all">
          View Plan
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Life Plans Landing Page
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LifePlansPage() {
  const allProfiles = getAllProfiles();
  const categories = getCategories();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filteredProfiles = useMemo(() => {
    if (activeCategory === 'All') return allProfiles;
    return allProfiles.filter((p) => p.category === activeCategory);
  }, [activeCategory, allProfiles]);

  const tabs: string[] = ['All', ...categories];

  return (
    <main className="min-h-screen">
      {/* ─── Hero Section ─── */}
      <section className="relative bg-gradient-to-br from-brand-700 via-brand-800 to-primary-700 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-brand-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-secondary-500 blur-3xl" />
        </div>

        <div className="container-custom relative z-10 py-20 sm:py-24 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              Tailored Financial Guidance for Every Indian
            </div>

            <h1 className="text-display-sm sm:text-display lg:text-display-xl text-white mb-6">
              Your Life. Your Plan.{' '}
              <span className="text-brand-300">Your Way.</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              Financial guidance tailored for every stage and profession — because
              a doctor&apos;s financial journey looks different from an
              engineer&apos;s.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="bg-white border-b border-surface-300">
        <div className="container-custom py-6">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto text-center">
            {[
              { value: '15+', label: 'Life Profiles' },
              { value: '100+', label: 'Financial Considerations' },
              { value: '1000+', label: 'Families Trust Us' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-extrabold text-brand-700 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Category Filter ─── */}
      <section className="bg-surface-100 border-b border-surface-300 sticky top-0 z-20">
        <div className="container-custom py-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {tabs.map((tab) => {
              const isActive = activeCategory === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveCategory(tab)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? CATEGORY_STYLES[tab] || 'bg-brand-700 text-white'
                      : 'bg-white text-slate-600 hover:bg-surface-200 border border-surface-300'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Profile Grid ─── */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          {/* Section heading */}
          <div className="text-center mb-10">
            <h2 className="text-display-sm text-primary-700 mb-3">
              {activeCategory === 'All'
                ? 'All Life Profiles'
                : activeCategory}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {activeCategory === 'All'
                ? 'Explore financial guidance crafted for every profession, life stage, and situation.'
                : `Financial profiles tailored for ${activeCategory.toLowerCase()}.`}
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>

          {/* Empty state */}
          {filteredProfiles.length === 0 && (
            <div className="text-center py-16">
              <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                No profiles found in this category. More profiles coming soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="section-padding bg-gradient-to-br from-primary-700 via-primary-800 to-brand-900">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-display-sm text-white mb-4">
              Don&apos;t See Your Profession?
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Every financial journey is unique. Talk to a Certified Financial
              Planner who will understand your specific situation and create a
              plan that works for you.
            </p>

            <a
              href="https://wa.me/916003903737?text=Hi%20Trustner%2C%20I%20visited%20the%20Life%20Plans%20page%20on%20MeraSIP%20and%20would%20like%20to%20discuss%20a%20financial%20plan%20for%20my%20profession.%20Please%20connect%20me%20with%20a%20CFP."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              Talk to a Certified Financial Planner
            </a>

            <p className="text-white/50 text-sm mt-6">
              Free consultation. No obligations. Trusted by 1000+ families.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Disclaimer ─── */}
      <section className="bg-surface-200 border-t border-surface-300">
        <div className="container-custom py-6">
          <p className="text-[11px] text-slate-400 leading-relaxed text-center max-w-4xl mx-auto">
            This content is for educational and informational purposes only. It
            does not constitute personalized financial advice. Mutual fund
            investments are subject to market risks. Insurance is the subject
            matter of solicitation. Please consult your financial advisor before
            making any financial decisions. Trustner Asset Services (ARN-286886)
            | Trustner Insurance Brokers (IRDAI Code: 1067)
          </p>
        </div>
      </section>
    </main>
  );
}
