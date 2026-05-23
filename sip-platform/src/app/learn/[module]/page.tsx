'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Target,
  Clock,
  Award,
  Brain,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getModuleBySlug, getAllModules } from '@/data/modules';
import { useLearningProgress } from '@/lib/hooks/useLearningProgress';
import { ProgressBar } from '@/components/ui/ProgressBar';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  GraduationCap,
  Lightbulb,
  Target,
  Brain,
  Award,
  Info,
  Clock,
};

const LEVEL_BADGE: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

const LEVEL_DESCRIPTION: Record<string, string> = {
  beginner: 'Perfect for those starting their investment journey. No prior knowledge required.',
  intermediate: 'Build on the basics with deeper concepts and practical strategies.',
  advanced: 'Expert-level topics for experienced investors looking to optimize.',
};

export default function ModulePage() {
  const params = useParams();
  const moduleSlug = params.module as string;
  const learningModule = getModuleBySlug(moduleSlug);
  const allModules = getAllModules();

  const currentModuleIndex = useMemo(
    () => allModules.findIndex((m) => m.slug === moduleSlug),
    [allModules, moduleSlug]
  );
  const nextModule = allModules[currentModuleIndex + 1];
  const prevModule = currentModuleIndex > 0 ? allModules[currentModuleIndex - 1] : null;

  const { getModuleProgress, isSectionComplete, isLoaded } = useLearningProgress();
  const moduleProgress = getModuleProgress(moduleSlug, learningModule?.sections.length || 0);

  if (!learningModule) {
    return (
      <section className="section-padding bg-surface-100">
        <div className="container-custom text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-primary-700 mb-2">Module Not Found</h1>
            <p className="text-slate-500 mb-6">
              The learning module you are looking for does not exist or has been moved.
            </p>
            <Link href="/learn" className="btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning Hub
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const IconComponent = ICON_MAP[learningModule.icon] || BookOpen;
  const totalMCQs = learningModule.sections.reduce((acc, s) => acc + s.content.mcqs.length, 0);
  const totalFAQs = learningModule.sections.reduce((acc, s) => acc + s.content.faq.length, 0);

  return (
    <>
      {/* ===== BREADCRUMB ===== */}
      <div className="bg-white border-b border-surface-300/50">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <Link href="/" className="hover:text-brand transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/learn" className="hover:text-brand transition-colors">
              Learn
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-700 font-medium">{learningModule.title}</span>
          </nav>
        </div>
      </div>

      {/* ===== MODULE HEADER ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-brand to-brand-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="container-custom relative z-10 py-12 lg:py-16">
          <div className="max-w-3xl">
            {/* Icon & Level */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={cn(
                  'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center',
                  learningModule.color
                )}
              >
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className={cn(LEVEL_BADGE[learningModule.level], 'text-xs')}>
                  {learningModule.level}
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              {learningModule.title}
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-6 max-w-2xl">
              {learningModule.description}
            </p>

            {/* Meta Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
                <BookOpen className="w-4 h-4" />
                {learningModule.sections.length} Topics
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
                <Clock className="w-4 h-4" />
                {learningModule.estimatedTime}
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
                <Brain className="w-4 h-4" />
                {totalMCQs} MCQs
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
                <Lightbulb className="w-4 h-4" />
                {totalFAQs} FAQs
              </div>
            </div>

            {isLoaded && moduleProgress.completed > 0 && (
              <div className="mt-6 max-w-md">
                <ProgressBar
                  percentage={moduleProgress.percentage}
                  completed={moduleProgress.completed}
                  total={moduleProgress.total}
                  size="md"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="section-padding bg-surface-100">
        <div className="container-custom">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* LEFT SIDEBAR - Section Navigation */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="card-base p-5 sticky top-24">
                <h3 className="text-sm font-bold text-primary-700 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-brand" />
                  Topics in This Module
                </h3>

                <div className="space-y-1 custom-scrollbar max-h-[60vh] overflow-y-auto pr-1">
                  {learningModule.sections.map((section, index) => (
                    <Link
                      key={section.id}
                      href={`/learn/${learningModule.slug}/${section.slug}`}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-brand-50 transition-colors group"
                    >
                      {isLoaded && isSectionComplete(moduleSlug, section.slug) ? (
                        <div className="w-6 h-6 rounded-full bg-positive flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-surface-200 flex items-center justify-center shrink-0 text-xs font-bold text-slate-400 group-hover:bg-brand group-hover:text-white transition-colors">
                          {index + 1}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary-700 group-hover:text-brand transition-colors truncate">
                          {section.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {section.content.mcqs.length} MCQs &middot;{' '}
                          {section.content.faq.length} FAQs
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>

                {/* Level Info */}
                <div className="mt-4 pt-4 border-t border-surface-300/50">
                  <div className="flex items-start gap-2 text-xs text-slate-400">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{LEVEL_DESCRIPTION[learningModule.level]}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* RIGHT CONTENT - Section Cards Grid */}
            <div className="lg:col-span-8 xl:col-span-9">
              {/* Section Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {learningModule.sections.map((section, index) => (
                  <Link
                    key={section.id}
                    href={`/learn/${learningModule.slug}/${section.slug}`}
                    className="card-interactive p-5 group"
                  >
                    {/* Number & Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 text-xs font-bold text-white',
                          learningModule.color
                        )}
                      >
                        {index + 1}
                      </div>
                      <h3 className="text-sm font-bold text-primary-700 group-hover:text-brand transition-colors leading-snug pt-1">
                        {section.title}
                      </h3>
                    </div>

                    {/* Definition preview */}
                    <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-3">
                      {section.content.definition.slice(0, 150)}
                      {section.content.definition.length > 150 ? '...' : ''}
                    </p>

                    {/* Content indicators */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {section.content.formula && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-brand-50 text-brand px-2 py-0.5 rounded-full font-medium">
                          <Target className="w-2.5 h-2.5" />
                          Formula
                        </span>
                      )}
                      {section.content.numericalExample && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Numerical
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] bg-secondary-50 text-secondary-600 px-2 py-0.5 rounded-full font-medium">
                        <Brain className="w-2.5 h-2.5" />
                        {section.content.mcqs.length} MCQs
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-surface-300/50">
                      <span className="text-xs font-semibold text-brand">
                        Read Topic
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Start Learning CTA */}
              <div className="mt-8 card-base p-6 sm:p-8 bg-gradient-to-r from-brand-50/50 to-brand-50/50">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0',
                      learningModule.color
                    )}
                  >
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-primary-700 mb-1">
                      Ready to start {learningModule.title}?
                    </h3>
                    <p className="text-sm text-slate-500">
                      Begin with the first topic and work through all{' '}
                      {learningModule.sections.length} topics at your own pace.
                    </p>
                  </div>
                  <Link
                    href={`/learn/${learningModule.slug}/${learningModule.sections[0].slug}`}
                    className="btn-primary shrink-0"
                  >
                    Start Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>

              {/* Module Navigation */}
              <div className="mt-6 flex items-center justify-between gap-4">
                {prevModule ? (
                  <Link
                    href={`/learn/${prevModule.slug}`}
                    className="btn-outline text-xs flex items-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {prevModule.title}
                  </Link>
                ) : (
                  <Link href="/learn" className="btn-outline text-xs flex items-center gap-2">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    All Modules
                  </Link>
                )}
                {nextModule && (
                  <Link
                    href={`/learn/${nextModule.slug}`}
                    className="btn-primary text-xs flex items-center gap-2"
                  >
                    {nextModule.title}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
