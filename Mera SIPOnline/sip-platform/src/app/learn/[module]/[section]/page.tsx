'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Target,
  Info,
  Clock,
  Award,
  Brain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getModuleBySlug, getSectionBySlug, resolveTopicPath } from '@/data/modules';
import type { MCQ, FAQ } from '@/types/learning';
import { useLearningProgress } from '@/lib/hooks/useLearningProgress';

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════ */

/** Accordion FAQ Item */
function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-surface-300/70 rounded-xl overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-start gap-3 p-4 text-left hover:bg-surface-100/50 transition-colors',
          isOpen && 'bg-surface-100/50'
        )}
      >
        <span className="w-6 h-6 rounded-full bg-brand-50 text-brand flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
          Q{index + 1}
        </span>
        <span className="flex-1 text-sm font-semibold text-primary-700 leading-relaxed">
          {faq.question}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pl-[52px]">
          <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

/** Interactive MCQ Quiz */
function MCQQuiz({ mcqs }: { mcqs: MCQ[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentMCQ = mcqs[currentIndex];

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (selectedAnswer !== null) return; // already answered
      setSelectedAnswer(optionIndex);
      setShowExplanation(true);
      setAnsweredCount((prev) => prev + 1);
      if (optionIndex === currentMCQ.correctAnswer) {
        setScore((prev) => prev + 1);
      }
    },
    [selectedAnswer, currentMCQ]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= mcqs.length) {
      setIsFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
  }, [currentIndex, mcqs.length]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredCount(0);
    setIsFinished(false);
  }, []);

  if (mcqs.length === 0) return null;

  // Finished state
  if (isFinished) {
    const percentage = Math.round((score / mcqs.length) * 100);
    const isExcellent = percentage >= 80;
    const isGood = percentage >= 50 && percentage < 80;

    return (
      <div className="text-center py-8">
        <div
          className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4',
            isExcellent
              ? 'bg-emerald-50'
              : isGood
              ? 'bg-amber-50'
              : 'bg-red-50'
          )}
        >
          {isExcellent ? (
            <Award className="w-10 h-10 text-emerald-500" />
          ) : isGood ? (
            <Brain className="w-10 h-10 text-amber-500" />
          ) : (
            <BookOpen className="w-10 h-10 text-red-500" />
          )}
        </div>

        <h3 className="text-2xl font-extrabold text-primary-700 mb-2">
          {isExcellent ? 'Excellent!' : isGood ? 'Good Effort!' : 'Keep Learning!'}
        </h3>

        <div className="text-4xl font-extrabold gradient-text mb-2">
          {score}/{mcqs.length}
        </div>
        <p className="text-sm text-slate-500 mb-6">
          You scored {percentage}% on this quiz
        </p>

        <div className="w-full max-w-xs mx-auto bg-surface-200 rounded-full h-3 mb-6">
          <div
            className={cn(
              'h-3 rounded-full transition-all duration-500',
              isExcellent
                ? 'bg-emerald-500'
                : isGood
                ? 'bg-amber-500'
                : 'bg-red-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <button onClick={handleRestart} className="btn-primary">
          <Brain className="w-4 h-4 mr-2" />
          Retry Quiz
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-slate-500">
          Question {currentIndex + 1} of {mcqs.length}
        </span>
        <span className="text-xs font-medium text-positive">
          Score: {score}/{answeredCount}
        </span>
      </div>
      <div className="w-full bg-surface-200 rounded-full h-1.5 mb-6">
        <div
          className="bg-brand h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h4 className="text-base font-bold text-primary-700 mb-5 leading-relaxed">
        {currentMCQ.question}
      </h4>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentMCQ.options.map((option, optIndex) => {
          const isSelected = selectedAnswer === optIndex;
          const isCorrect = optIndex === currentMCQ.correctAnswer;
          const hasAnswered = selectedAnswer !== null;

          let optionStyles = 'border-surface-300 hover:border-brand hover:bg-brand-50/30';
          if (hasAnswered) {
            if (isCorrect) {
              optionStyles = 'border-emerald-500 bg-emerald-50';
            } else if (isSelected && !isCorrect) {
              optionStyles = 'border-red-500 bg-red-50';
            } else {
              optionStyles = 'border-surface-300 opacity-60';
            }
          }

          return (
            <button
              key={optIndex}
              onClick={() => handleAnswer(optIndex)}
              disabled={hasAnswered}
              className={cn(
                'w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                optionStyles,
                !hasAnswered && 'cursor-pointer',
                hasAnswered && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  hasAnswered && isCorrect
                    ? 'bg-emerald-500 text-white'
                    : hasAnswered && isSelected && !isCorrect
                    ? 'bg-red-500 text-white'
                    : 'bg-surface-200 text-slate-500'
                )}
              >
                {hasAnswered && isCorrect ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : hasAnswered && isSelected && !isCorrect ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  String.fromCharCode(65 + optIndex)
                )}
              </span>
              <span
                className={cn(
                  'text-sm leading-relaxed pt-0.5',
                  hasAnswered && isCorrect
                    ? 'text-emerald-700 font-semibold'
                    : hasAnswered && isSelected && !isCorrect
                    ? 'text-red-700'
                    : 'text-primary-700'
                )}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div
          className={cn(
            'rounded-xl p-4 mb-6 border',
            selectedAnswer === currentMCQ.correctAnswer
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          )}
        >
          <div className="flex items-start gap-2">
            <Lightbulb
              className={cn(
                'w-4 h-4 shrink-0 mt-0.5',
                selectedAnswer === currentMCQ.correctAnswer
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              )}
            />
            <div>
              <div
                className={cn(
                  'text-xs font-bold mb-1',
                  selectedAnswer === currentMCQ.correctAnswer
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                )}
              >
                {selectedAnswer === currentMCQ.correctAnswer
                  ? 'Correct!'
                  : 'Incorrect'}
              </div>
              <p
                className={cn(
                  'text-sm leading-relaxed',
                  selectedAnswer === currentMCQ.correctAnswer
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                )}
              >
                {currentMCQ.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      {showExplanation && (
        <div className="flex justify-end">
          <button onClick={handleNext} className="btn-primary text-sm">
            {currentIndex + 1 >= mcqs.length ? 'See Results' : 'Next Question'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN SECTION PAGE
   ═══════════════════════════════════════════════════════ */

export default function SectionPage() {
  const params = useParams();
  const moduleSlug = params.module as string;
  const sectionSlug = params.section as string;

  const learningModule = getModuleBySlug(moduleSlug);
  const section = getSectionBySlug(moduleSlug, sectionSlug);

  const sectionIndex = useMemo(() => {
    if (!learningModule) return -1;
    return learningModule.sections.findIndex((s) => s.slug === sectionSlug);
  }, [learningModule, sectionSlug]);

  const prevSection = learningModule && sectionIndex > 0 ? learningModule.sections[sectionIndex - 1] : null;
  const nextSection =
    learningModule && sectionIndex < learningModule.sections.length - 1
      ? learningModule.sections[sectionIndex + 1]
      : null;

  const { markSectionComplete, markSectionVisited, isSectionComplete, isLoaded } = useLearningProgress();
  const sectionSlugParam = params.section as string;

  useEffect(() => {
    if (moduleSlug && sectionSlugParam) {
      markSectionVisited(moduleSlug, sectionSlugParam);
    }
  }, [moduleSlug, sectionSlugParam, markSectionVisited]);

  // ---- NOT FOUND ----
  if (!learningModule || !section) {
    return (
      <section className="section-padding bg-surface-100">
        <div className="container-custom text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-primary-700 mb-2">Topic Not Found</h1>
            <p className="text-slate-500 mb-6">
              The topic you are looking for does not exist in this module.
            </p>
            <Link href={`/learn/${moduleSlug}`} className="btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Module
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { content } = section;

  return (
    <>
      {/* ===== BREADCRUMB ===== */}
      <div className="bg-white border-b border-surface-300/50">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
            <Link href="/" className="hover:text-brand transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/learn" className="hover:text-brand transition-colors">
              Learn
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/learn/${learningModule.slug}`}
              className="hover:text-brand transition-colors"
            >
              {learningModule.title}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-700 font-medium">{section.title}</span>
          </nav>
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <section className="bg-surface-100 min-h-screen">
        <div className="container-custom py-8">
          <div className="grid lg:grid-cols-12 gap-8">
            {/* ═══ LEFT SIDEBAR ═══ */}
            <aside className="lg:col-span-3 hidden lg:block">
              <div className="card-base p-4 sticky top-24">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-300/50">
                  <GraduationCap className="w-4 h-4 text-brand" />
                  <h3 className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                    {learningModule.title}
                  </h3>
                </div>

                <div className="space-y-0.5 custom-scrollbar max-h-[65vh] overflow-y-auto pr-1">
                  {learningModule.sections.map((s, index) => {
                    const isActive = s.slug === sectionSlug;
                    return (
                      <Link
                        key={s.id}
                        href={`/learn/${learningModule.slug}/${s.slug}`}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all',
                          isActive
                            ? 'bg-brand text-white font-semibold shadow-sm'
                            : 'text-slate-500 hover:bg-surface-100 hover:text-primary-700'
                        )}
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-200 text-slate-400'
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="truncate">{s.title}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Back to module link */}
                <div className="mt-4 pt-3 border-t border-surface-300/50">
                  <Link
                    href={`/learn/${learningModule.slug}`}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-brand transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Module Overview
                  </Link>
                </div>
              </div>
            </aside>

            {/* ═══ RIGHT CONTENT ═══ */}
            <div className="lg:col-span-9">
              {/* Mobile Section Navigator */}
              <div className="lg:hidden mb-6">
                <Link
                  href={`/learn/${learningModule.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs text-brand font-medium mb-3"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {learningModule.title} ({sectionIndex + 1}/{learningModule.sections.length})
                </Link>
              </div>

              {/* Section Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-brand bg-brand-50 px-2.5 py-1 rounded-full">
                    Topic {sectionIndex + 1} of {learningModule.sections.length}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~5 min read
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary-700 leading-tight">
                  {section.title}
                </h1>
              </div>

              {/* ═══════════════════════════════════════
                  1. DEFINITION BOX
                  ═══════════════════════════════════════ */}
              <div className="mb-8">
                <div className="relative rounded-2xl border-2 border-brand-200 bg-gradient-to-r from-brand-50/60 via-brand-50/40 to-brand-50/30 p-6 sm:p-8">
                  <div className="absolute top-4 right-4">
                    <BookOpen className="w-8 h-8 text-brand-200" />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-sm font-bold text-brand-700 uppercase tracking-wider">
                      Definition
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg text-primary-700 leading-relaxed font-medium prose-sip">
                    {content.definition}
                  </p>
                </div>
              </div>

              {/* ═══════════════════════════════════════
                  2. SIMPLE EXPLANATION
                  ═══════════════════════════════════════ */}
              <div className="mb-8">
                <div className="card-base p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-primary-700">In Simple Words</h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed prose-sip">
                    {content.explanation}
                  </p>
                </div>
              </div>

              {/* ═══════════════════════════════════════
                  3. REAL-LIFE EXAMPLE
                  ═══════════════════════════════════════ */}
              <div className="mb-8">
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-amber-800">Real-Life Scenario</h2>
                  </div>
                  <p className="text-sm sm:text-base text-amber-900/80 leading-relaxed prose-sip">
                    {content.realLifeExample}
                  </p>
                </div>
              </div>

              {/* ═══════════════════════════════════════
                  4. KEY POINTS
                  ═══════════════════════════════════════ */}
              <div className="mb-8">
                <div className="card-base p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-primary-700">Key Points to Remember</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {content.keyPoints.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-xl bg-teal-50/50 border border-teal-100"
                      >
                        <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════
                  5. FORMULA (if exists)
                  ═══════════════════════════════════════ */}
              {content.formula && (
                <div className="mb-8">
                  <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8 text-white">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold">Formula</h2>
                    </div>
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                      <pre className="font-mono text-sm sm:text-base text-emerald-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {content.formula}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════
                  6. NUMERICAL EXAMPLE (if exists)
                  ═══════════════════════════════════════ */}
              {content.numericalExample && (
                <div className="mb-8">
                  <div className="card-base p-6 sm:p-8 border-l-4 border-brand-600">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-primary-700">Numerical Example</h2>
                    </div>
                    <div className="bg-surface-100 rounded-xl p-5 border border-surface-300/70">
                      <pre className="font-mono text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {content.numericalExample}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════
                  7. FAQ SECTION
                  ═══════════════════════════════════════ */}
              {content.faq.length > 0 && (
                <div className="mb-8">
                  <div className="card-base p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-secondary-500 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-primary-700">
                        Frequently Asked Questions
                      </h2>
                    </div>
                    <div className="space-y-3">
                      {content.faq.map((faq, index) => (
                        <FAQItem key={index} faq={faq} index={index} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════
                  8. MCQ QUIZ SECTION
                  ═══════════════════════════════════════ */}
              {content.mcqs.length > 0 && (
                <div className="mb-8">
                  <div className="card-base p-6 sm:p-8 border-2 border-brand-100">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-primary-700">
                          Test Your Knowledge
                        </h2>
                        <p className="text-xs text-slate-500">
                          {content.mcqs.length} questions to check your understanding
                        </p>
                      </div>
                    </div>
                    <MCQQuiz mcqs={content.mcqs} />
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════
                  9. SUMMARY NOTES
                  ═══════════════════════════════════════ */}
              {content.summaryNotes.length > 0 && (
                <div className="mb-8">
                  <div className="rounded-2xl bg-gradient-to-br from-brand-50/60 to-brand-50/60 border border-brand-100 p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-primary-700">Summary Notes</h2>
                    </div>
                    <div className="space-y-3">
                      {content.summaryNotes.map((note, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded bg-brand/10 flex items-center justify-center shrink-0 mt-0.5">
                            <BookOpen className="w-3 h-3 text-brand" />
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════
                  10. RELATED TOPICS
                  ═══════════════════════════════════════ */}
              {content.relatedTopics.length > 0 && (
                <div className="mb-8">
                  <div className="card-base p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-primary-700">Related Topics</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {content.relatedTopics.map((topic) => {
                        const resolved = resolveTopicPath(topic, learningModule.slug);
                        if (!resolved) return null;
                        return (
                          <Link
                            key={topic}
                            href={`/learn/${resolved.moduleSlug}/${resolved.sectionSlug}`}
                            className="inline-flex items-center gap-1.5 bg-surface-100 hover:bg-brand-50 text-slate-600 hover:text-brand text-sm font-medium px-4 py-2 rounded-full border border-surface-300/70 hover:border-brand-200 transition-all"
                          >
                            <ChevronRight className="w-3 h-3" />
                            {resolved.title}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════
                  MARK AS COMPLETE
                  ═══════════════════════════════════════ */}
              {isLoaded && (
                <div className="mt-8 text-center">
                  {isSectionComplete(moduleSlug, sectionSlugParam) ? (
                    <div className="inline-flex items-center gap-2 bg-positive-50 text-positive px-6 py-3 rounded-lg font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      Topic Completed
                    </div>
                  ) : (
                    <button
                      onClick={() => markSectionComplete(moduleSlug, sectionSlugParam)}
                      className="btn-primary px-8 py-3 text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark Topic as Complete
                    </button>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════
                  NAVIGATION: Prev / Next Section
                  ═══════════════════════════════════════ */}
              <div className="mt-12 pt-8 border-t-2 border-surface-300/50">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Previous */}
                  {prevSection ? (
                    <Link
                      href={`/learn/${learningModule.slug}/${prevSection.slug}`}
                      className="card-interactive p-5 group flex items-center gap-4"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-brand group-hover:-translate-x-1 transition-all shrink-0" />
                      <div className="text-right flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                          Previous Topic
                        </div>
                        <div className="text-sm font-semibold text-primary-700 group-hover:text-brand transition-colors truncate">
                          {prevSection.title}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href={`/learn/${learningModule.slug}`}
                      className="card-interactive p-5 group flex items-center gap-4"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-brand group-hover:-translate-x-1 transition-all shrink-0" />
                      <div className="text-right flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                          Back to
                        </div>
                        <div className="text-sm font-semibold text-primary-700 group-hover:text-brand transition-colors">
                          Module Overview
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Next */}
                  {nextSection ? (
                    <Link
                      href={`/learn/${learningModule.slug}/${nextSection.slug}`}
                      className="card-interactive p-5 group flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                          Next Topic
                        </div>
                        <div className="text-sm font-semibold text-primary-700 group-hover:text-brand transition-colors truncate">
                          {nextSection.title}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  ) : (
                    <Link
                      href="/learn"
                      className="card-interactive p-5 group flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                          Completed Module
                        </div>
                        <div className="text-sm font-semibold text-primary-700 group-hover:text-brand transition-colors">
                          Explore More Modules
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
