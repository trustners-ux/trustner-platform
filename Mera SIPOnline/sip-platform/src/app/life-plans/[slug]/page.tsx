import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CircleDot,
  MessageCircle,
  Clock,
  Target,
  ShieldAlert,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import {
  getAllProfiles,
  getProfileBySlug,
  getRelatedProfiles,
} from '@/data/life-plans';
import type { LifePlanProfile } from '@/types/life-plans';

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

/* ─── Consideration Category Icons & Colors ─── */
const CONSIDERATION_STYLES: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }
> = {
  Protection: {
    icon: ShieldAlert,
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  Savings: {
    icon: Target,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  Investment: {
    icon: TrendingUp,
    bg: 'bg-brand-50',
    text: 'text-brand-700',
    border: 'border-brand-200',
  },
  Tax: {
    icon: Lightbulb,
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
};

/* ─── Static Params ─── */
export async function generateStaticParams() {
  const profiles = getAllProfiles();
  return profiles.map((p) => ({ slug: p.slug }));
}

/* ─── Metadata ─── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);
  if (!profile) {
    return { title: 'Profile Not Found' };
  }
  return {
    title: profile.metaTitle,
    description: profile.metaDescription,
    openGraph: {
      title: profile.metaTitle,
      description: profile.metaDescription,
      type: 'article',
      url: `https://www.merasip.com/life-plans/${profile.slug}`,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Detail Page Component
   ═══════════════════════════════════════════════════════════════════════════ */
export default async function LifePlanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = getProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const related = getRelatedProfiles(profile, 3);
  const IconComponent = ICON_MAP[profile.icon] || BookOpen;
  const whatsappUrl = `https://wa.me/916003903737?text=${encodeURIComponent(profile.ctaWhatsApp)}`;

  return (
    <main className="min-h-screen bg-surface-100">
      {/* ─── Breadcrumbs ─── */}
      <nav className="bg-white border-b border-surface-300">
        <div className="container-custom py-3">
          <ol className="flex items-center gap-1.5 text-sm text-slate-500">
            <li>
              <Link href="/" className="hover:text-brand-700 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li>
              <Link
                href="/life-plans"
                className="hover:text-brand-700 transition-colors"
              >
                Life Plans
              </Link>
            </li>
            <li>
              <ChevronRight className="w-3.5 h-3.5" />
            </li>
            <li className="text-primary-700 font-medium truncate max-w-[200px]">
              {profile.title}
            </li>
          </ol>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section
        className={`relative bg-gradient-to-br ${profile.coverGradient} overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container-custom relative z-10 py-16 sm:py-20 lg:py-24">
          <div className="max-w-4xl">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
              <IconComponent className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h1 className="text-display-sm sm:text-display text-white mb-3">
              {profile.title}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-4 max-w-2xl">
              {profile.subtitle}
            </p>

            {/* Income pattern badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 px-4 py-2 rounded-full text-sm">
              <Clock className="w-4 h-4" />
              {profile.incomePattern}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Key Numbers Strip ─── */}
      <section className="bg-white border-b border-surface-300 shadow-sm">
        <div className="container-custom py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {profile.keyNumbers.map((item) => (
              <div
                key={item.label}
                className="text-center p-4 rounded-xl bg-surface-100"
              >
                <div className="text-xl sm:text-2xl font-extrabold text-brand-700 tabular-nums">
                  {item.value}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Overview ─── */}
      <section className="section-padding-sm">
        <div className="container-custom">
          <div className="max-w-3xl">
            <p className="text-lg text-slate-600 leading-relaxed">
              {profile.overview}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Key Financial Challenges ─── */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="text-display-sm text-primary-700 mb-2">
            Key Financial Challenges
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl">
            Understanding these challenges is the first step to overcoming them.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.challenges.map((challenge, i) => (
              <div
                key={i}
                className="card-base rounded-xl p-6 hover:shadow-card-hover transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary-50 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-5 h-5 text-secondary-500" />
                </div>
                <h3 className="text-base font-bold text-primary-700 mb-2">
                  {challenge.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {challenge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Financial Considerations ─── */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <h2 className="text-display-sm text-primary-700 mb-2">
            Financial Considerations
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl">
            Key areas to focus on for a comprehensive financial plan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.considerations.map((group) => {
              const style = CONSIDERATION_STYLES[group.category] || {
                icon: Target,
                bg: 'bg-slate-50',
                text: 'text-slate-700',
                border: 'border-slate-200',
              };
              const CategoryIcon = style.icon;

              return (
                <div
                  key={group.category}
                  className={`rounded-xl border ${style.border} ${style.bg} p-6`}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`w-10 h-10 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center`}
                    >
                      <CategoryIcon className={`w-5 h-5 ${style.text}`} />
                    </div>
                    <h3 className={`text-lg font-bold ${style.text}`}>
                      {group.category}
                    </h3>
                  </div>

                  <ul className="space-y-3">
                    {group.items.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <CircleDot
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.text} opacity-60`}
                        />
                        <span className="text-slate-700 leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Common Mistakes to Avoid ─── */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="text-display-sm text-primary-700 mb-2">
            Common Mistakes to Avoid
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl">
            Learn from the most frequent financial missteps in your profession.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {profile.commonMistakes.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-surface-300 bg-white overflow-hidden shadow-card"
              >
                {/* Mistake (red) */}
                <div className="bg-red-50 border-b border-red-100 p-5">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-1">
                        Mistake
                      </div>
                      <p className="text-sm font-semibold text-red-800">
                        {item.mistake}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Impact */}
                <div className="p-5 border-b border-surface-300">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Impact
                  </div>
                  <p className="text-sm text-slate-600">{item.impact}</p>
                </div>

                {/* Fix (green) */}
                <div className="bg-positive-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-positive mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[11px] font-semibold text-positive uppercase tracking-wider mb-1">
                        Fix
                      </div>
                      <p className="text-sm text-emerald-800">{item.fix}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Life Stage Roadmap ─── */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <h2 className="text-display-sm text-primary-700 mb-2">
            Life Stage Roadmap
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl">
            Your financial priorities evolve with each stage of your career and
            life.
          </p>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-brand-200 hidden sm:block" />

              <div className="space-y-8">
                {profile.lifeStages.map((stage, i) => (
                  <div key={i} className="relative flex gap-6">
                    {/* Timeline dot */}
                    <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-full bg-brand-700 items-center justify-center z-10 shadow-md">
                      <span className="text-white font-bold text-sm">
                        {i + 1}
                      </span>
                    </div>

                    {/* Content card */}
                    <div className="flex-1 card-base rounded-xl p-6 hover:shadow-card-hover transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                        {/* Mobile step number */}
                        <span className="sm:hidden inline-flex w-8 h-8 rounded-full bg-brand-700 items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {i + 1}
                        </span>
                        <h3 className="text-base font-bold text-primary-700">
                          {stage.stage}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-sm text-brand-700 font-semibold bg-brand-50 px-3 py-1 rounded-full w-fit">
                          <Clock className="w-3.5 h-3.5" />
                          {stage.age}
                        </span>
                      </div>

                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {stage.priorities.map((priority, j) => (
                          <li
                            key={j}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                            {priority}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Action Checklist ─── */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="text-display-sm text-primary-700 mb-2">
            Your Action Checklist
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl">
            Start ticking these off today. Each step moves you closer to
            financial security.
          </p>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              {profile.checklist.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl bg-surface-100 border border-surface-300 hover:border-brand-200 hover:bg-brand-50/30 transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed pt-1">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="section-padding">
        <div className="container-custom">
          <div
            className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${profile.coverGradient} p-8 sm:p-12 lg:p-16`}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white blur-3xl" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                <IconComponent className="w-7 h-7 text-white" />
              </div>

              <h2 className="text-display-sm text-white mb-4">
                {profile.ctaText}
              </h2>
              <p className="text-white/80 text-lg mb-8 leading-relaxed">
                Get a personalized financial roadmap from a Certified Financial
                Planner who understands your profession and life stage.
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                Talk to a Certified Financial Planner
              </a>

              <p className="text-white/50 text-sm mt-6">
                Free consultation. No obligations. Your details are
                confidential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Related Profiles ─── */}
      {related.length > 0 && (
        <section className="section-padding bg-white border-t border-surface-300">
          <div className="container-custom">
            <h2 className="text-display-sm text-primary-700 mb-2">
              Related Profiles
            </h2>
            <p className="text-slate-500 mb-10">
              Explore financial guidance for similar professions and life stages.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rp) => {
                const RpIcon = ICON_MAP[rp.icon] || BookOpen;
                return (
                  <Link
                    key={rp.id}
                    href={`/life-plans/${rp.slug}`}
                    className="group card-interactive rounded-xl overflow-hidden"
                  >
                    <div
                      className={`h-2 bg-gradient-to-r ${rp.coverGradient}`}
                    />
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${rp.coverGradient} flex items-center justify-center`}
                        >
                          <RpIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-primary-700 group-hover:text-brand-700 transition-colors">
                            {rp.title}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {rp.category}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-3">
                        {rp.subtitle}
                      </p>
                      <div className="flex items-center text-brand-700 text-sm font-semibold group-hover:gap-2 gap-1 transition-all">
                        View Plan
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
