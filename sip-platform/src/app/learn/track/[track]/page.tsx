'use client';

import { useMemo, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, BookOpen, GraduationCap, Clock, Award,
  CheckCircle2, Lock, Layers, Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getAllTracks, getTrackInfo } from '@/data/learn-tracks';
import { getModulesByTrack } from '@/data/modules';
import type { LearnTrack } from '@/types/learning';

interface PageProps {
  params: Promise<{ track: string }>;
}

export default function TrackPage({ params }: PageProps) {
  const { track } = use(params);
  const trackInfo = getTrackInfo(track as LearnTrack);

  if (!trackInfo) notFound();

  const modules = useMemo(() => getModulesByTrack(track as LearnTrack), [track]);
  const tracks = useMemo(() => getAllTracks(), []);

  const foundationModules = useMemo(() => modules.filter((m) => m.level === 'beginner'), [modules]);
  const intermediateModules = useMemo(() => modules.filter((m) => m.level === 'intermediate'), [modules]);
  const advancedModules = useMemo(() => modules.filter((m) => m.level === 'advanced'), [modules]);

  const hasAdvanced = advancedModules.length > 0;

  const totalSections = modules.reduce((s, m) => s + m.sections.length, 0);
  const totalMCQs = modules.reduce(
    (s, m) => s + m.sections.reduce((ss, sec) => ss + sec.content.mcqs.length, 0),
    0,
  );
  const totalFAQs = modules.reduce(
    (s, m) => s + m.sections.reduce((ss, sec) => ss + sec.content.faq.length, 0),
    0,
  );

  return (
    <>
      {/* Hero */}
      <section className={cn('relative overflow-hidden text-white bg-gradient-to-br', trackInfo.gradient)}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="container-custom relative z-10 py-12 lg:py-20">
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> All Learning Tracks
          </Link>

          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
              <GraduationCap className="w-3.5 h-3.5" /> {trackInfo.shortName} Foundation Track
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">
              Learn About {trackInfo.name}
            </h1>
            <p className="text-base sm:text-lg text-white/85 leading-relaxed mb-6 max-w-3xl">
              {trackInfo.description}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                Regulator: {trackInfo.regulator}
              </span>
              {trackInfo.minimumInvestment && (
                <span className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  Min: {trackInfo.minimumInvestment}
                </span>
              )}
              {trackInfo.trustnerEmpanelled && (
                <span className="bg-white/25 backdrop-blur-sm px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Trustner Empanelled
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Audience banner */}
      <section className="py-6 bg-surface-100 border-b border-surface-200">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card-base p-4 bg-white">
              <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br', trackInfo.gradient)}>
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                    Foundation Track — Available Now
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {trackInfo.audienceFoundation}
                  </p>
                </div>
              </div>
            </div>
            <div className={cn(
              'card-base p-4',
              hasAdvanced ? 'bg-white' : 'bg-slate-50 border-dashed',
            )}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  hasAdvanced ? 'bg-gradient-to-br ' + trackInfo.gradient : 'bg-slate-300',
                )}>
                  {hasAdvanced ? (
                    <Trophy className="w-5 h-5 text-white" />
                  ) : (
                    <Lock className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-[10px] font-bold uppercase tracking-wider mb-1',
                    hasAdvanced ? 'text-rose-600' : 'text-slate-500',
                  )}>
                    {hasAdvanced ? 'Advanced Track — Available Now' : 'Advanced Track — Coming Soon'}
                  </p>
                  <p className={cn(
                    'text-sm leading-relaxed',
                    hasAdvanced ? 'text-slate-700' : 'text-slate-600',
                  )}>
                    {trackInfo.audienceAdvanced}
                  </p>
                  {!hasAdvanced && (
                    <p className="text-[11px] text-slate-400 mt-2">
                      Trustner is building certification-grade material for sub-broker onboarding and
                      NISM/APMI/IRDAI exam prep. Email <a href="mailto:wecare@trustner.in" className="underline">wecare@trustner.in</a> to be notified when this releases.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Module list — grouped by level */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-display-sm text-primary-700 mb-1">Curriculum</h2>
              <p className="text-sm text-slate-500">
                {modules.length} module{modules.length === 1 ? '' : 's'} &middot; {totalSections} sections
                &middot; {totalMCQs} MCQs &middot; {totalFAQs} FAQs
              </p>
            </div>
          </div>

          {modules.length === 0 ? (
            <div className="card-base p-8 text-center text-slate-500">
              Foundation content for this track is launching soon.
            </div>
          ) : (
            <div className="space-y-10">
              {[
                { label: 'Foundation', items: foundationModules, badgeClass: 'bg-emerald-50 text-emerald-700', tagline: 'Start here. Investor-friendly conceptual grounding.', icon: BookOpen },
                { label: 'Deep Dive', items: intermediateModules, badgeClass: 'bg-amber-50 text-amber-700', tagline: 'Mechanics, strategy, taxation — for engaged investors and trainee distributors.', icon: Layers },
                { label: 'Advanced', items: advancedModules, badgeClass: 'bg-rose-50 text-rose-700', tagline: 'Practitioner / certification-grade. Sub-broker, NISM, APMI, IRDAI exam prep.', icon: Trophy },
              ].filter((g) => g.items.length > 0).map((group) => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.label}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br', trackInfo.gradient)}>
                        <GroupIcon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-primary-700 leading-tight">
                          {group.label}
                          <span className="text-xs font-normal text-slate-400 ml-2">({group.items.length})</span>
                        </h3>
                        <p className="text-xs text-slate-500">{group.tagline}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.items.map((m) => {
                        const sectionCount = m.sections.length;
                        const mcqCount = m.sections.reduce((s, sec) => s + sec.content.mcqs.length, 0);
                        return (
                          <Link
                            key={m.id}
                            href={`/learn/${m.slug}`}
                            className="group card-base p-5 hover:shadow-lg hover:border-brand-300 transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <span className={cn(
                                'text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full',
                                group.badgeClass,
                              )}>
                                {m.level}
                              </span>
                              <Clock className="w-4 h-4 text-slate-300" />
                            </div>
                            <h3 className="text-base font-bold text-primary-700 mb-2 group-hover:text-brand-700 transition-colors">
                              {m.title}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                              {m.description}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-surface-200">
                              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" /> {sectionCount}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Award className="w-3 h-3" /> {mcqCount} MCQ
                                </span>
                                <span>{m.estimatedTime}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Cross-link to other tracks */}
      <section className="py-12 bg-surface-100 border-t border-surface-200">
        <div className="container-custom">
          <h2 className="text-lg font-bold text-primary-700 mb-1">Explore Other Learning Tracks</h2>
          <p className="text-sm text-slate-500 mb-5">
            Trustner covers the complete Indian wealth-management product spectrum. Every track is
            written from a third-person investor-education perspective with regulator-aligned content.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {tracks.filter((t) => t.id !== track).map((t) => (
              <Link
                key={t.id}
                href={`/learn/track/${t.id}`}
                className="text-center px-3 py-2.5 rounded-lg border border-surface-300 bg-white text-xs font-semibold text-primary-700 hover:border-brand-300 hover:bg-brand-50/30 transition-all"
              >
                {t.shortName}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
