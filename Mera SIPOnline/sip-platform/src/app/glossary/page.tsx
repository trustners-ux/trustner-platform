'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Target,
  Info,
  Clock,
  Award,
  Brain,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { GLOSSARY, getGlossaryByLetter, searchGlossary } from '@/data/glossary';
import { ALL_MODULES } from '@/data/modules';
import type { GlossaryTerm } from '@/types/learning';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const CATEGORY_COLORS: Record<string, string> = {
  'Fund Management': 'bg-brand-50 text-brand-700 border-brand-200',
  'Regulatory': 'bg-secondary-50 text-secondary-700 border-secondary-200',
  'Fund Types': 'bg-teal-50 text-teal-700 border-teal-200',
  'Performance': 'bg-amber-50 text-amber-700 border-amber-200',
  'Fees': 'bg-red-50 text-red-700 border-red-200',
  'Fund Options': 'bg-brand-50 text-brand-700 border-brand-200',
  'Taxation': 'bg-orange-50 text-orange-700 border-orange-200',
  'Investment': 'bg-teal-50 text-teal-700 border-teal-200',
  'Strategy': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Process': 'bg-slate-50 text-slate-700 border-slate-200',
  'Account': 'bg-violet-50 text-violet-700 border-violet-200',
  'Markets': 'bg-rose-50 text-rose-700 border-rose-200',
};

/**
 * Find a learning module section that matches the glossary term slug.
 * Returns { moduleSlug, sectionSlug, sectionTitle } or null.
 */
function findLearningSection(termSlug: string): { moduleSlug: string; sectionSlug: string; sectionTitle: string } | null {
  for (const mod of ALL_MODULES) {
    const section = mod.sections.find((s) => s.slug === termSlug);
    if (section) {
      return { moduleSlug: mod.slug, sectionSlug: section.slug, sectionTitle: section.title };
    }
  }
  return null;
}

function GlossaryCard({ term }: { term: GlossaryTerm }) {
  const [isOpen, setIsOpen] = useState(false);
  const categoryStyle = CATEGORY_COLORS[term.category] || 'bg-surface-100 text-slate-600 border-surface-300';

  // Truncate definition to roughly one line (~80 chars) for collapsed preview
  const previewDefinition = term.definition.length > 90
    ? term.definition.slice(0, 87).trimEnd() + '...'
    : term.definition;

  const learningLink = findLearningSection(term.slug);

  return (
    <div
      className={cn(
        'card-base transition-all duration-300',
        isOpen ? 'shadow-md ring-1 ring-brand-200/50' : 'hover:shadow-md'
      )}
    >
      {/* Clickable Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full text-left p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset rounded-xl"
        aria-expanded={isOpen}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-base font-bold text-primary-700">{term.term}</h3>
              <span
                className={cn(
                  'text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 uppercase tracking-wider',
                  categoryStyle
                )}
              >
                {term.category}
              </span>
            </div>
            {/* Collapsed: short preview | Expanded: hidden (full def shown below) */}
            {!isOpen && (
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-1">{previewDefinition}</p>
            )}
          </div>
          <div className="shrink-0 mt-0.5 text-slate-400">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expandable Detail Panel */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-5 pb-5 space-y-4">
          {/* Full Definition */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Definition</div>
            <p className="text-sm text-slate-600 leading-relaxed">{term.definition}</p>
          </div>

          {/* Related Terms */}
          {term.relatedTerms.length > 0 && (
            <div className="pt-3 border-t border-surface-300/50">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                Related Terms
              </div>
              <div className="flex flex-wrap gap-1.5">
                {term.relatedTerms.map((related) => {
                  const relatedTerm = GLOSSARY.find((g) => g.slug === related);
                  return (
                    <a
                      key={related}
                      href={`#term-${related}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const el = document.getElementById(`term-${related}`);
                        if (el) {
                          const offset = 120;
                          const pos = el.getBoundingClientRect().top + window.scrollY - offset;
                          window.scrollTo({ top: pos, behavior: 'smooth' });
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs bg-surface-100 hover:bg-brand-50 text-slate-500 hover:text-brand px-2.5 py-1 rounded-full border border-surface-300/70 hover:border-brand-200 transition-all"
                    >
                      <ChevronRight className="w-2.5 h-2.5" />
                      {relatedTerm?.term || related}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Learn More Link — shown if this term maps to a learning module section */}
          {learningLink && (
            <div className="pt-3 border-t border-surface-300/50">
              <Link
                href={`/learn/${learningLink.moduleSlug}/${learningLink.sectionSlug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-700 transition-colors group"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Learn more: {learningLink.sectionTitle}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const groupedTerms = useMemo(() => getGlossaryByLetter(), []);
  const availableLetters = useMemo(() => Object.keys(groupedTerms).sort(), [groupedTerms]);

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchGlossary(searchQuery);
  }, [searchQuery]);

  const scrollToLetter = useCallback((letter: string) => {
    setSearchQuery('');
    setActiveLetter(letter);
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      const offset = 100; // account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, []);

  const totalTerms = GLOSSARY.length;
  const categories = useMemo(() => {
    const cats = new Set(GLOSSARY.map((t) => t.category));
    return Array.from(cats);
  }, []);

  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-brand to-brand-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="container-custom relative z-10 py-12 lg:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium mb-5 backdrop-blur-sm">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              Reference Guide
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              SIP Glossary:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-200 via-blue-200 to-accent">
                A-Z Financial Terms
              </span>
            </h1>

            <p className="text-base text-slate-300 leading-relaxed mb-6 max-w-2xl mx-auto">
              A comprehensive dictionary of {totalTerms} financial terms every mutual fund and SIP
              investor should know. From AMC to XIRR, find clear definitions with related concepts.
            </p>

            {/* Quick Stats */}
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
                <BookOpen className="w-4 h-4" />
                {totalTerms} Terms
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
                <Target className="w-4 h-4" />
                {categories.length} Categories
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STICKY NAVIGATION ===== */}
      <div className="sticky top-16 z-20 bg-white border-b border-surface-300/50 shadow-sm">
        <div className="container-custom py-3">
          {/* Search Box */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms... (e.g., SIP, NAV, ELSS, expense ratio)"
              className="w-full bg-surface-100 border border-surface-300 rounded-xl px-4 py-2.5 text-sm text-primary-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Alphabet Bar */}
          <div className="flex items-center gap-0.5 overflow-x-auto custom-scrollbar pb-1">
            {ALPHABET.map((letter) => {
              const hasTerms = availableLetters.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => hasTerms && scrollToLetter(letter)}
                  disabled={!hasTerms}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-all',
                    hasTerms
                      ? activeLetter === letter
                        ? 'bg-brand text-white shadow-sm'
                        : 'bg-surface-100 text-primary-700 hover:bg-brand-50 hover:text-brand'
                      : 'text-slate-300 cursor-not-allowed'
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <section className="section-padding bg-surface-100" ref={contentRef}>
        <div className="container-custom">
          {/* Search Results */}
          {filteredTerms !== null ? (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-primary-700">
                  {filteredTerms.length} result{filteredTerms.length !== 1 ? 's' : ''} for{' '}
                  &ldquo;{searchQuery}&rdquo;
                </h2>
              </div>

              {filteredTerms.length === 0 ? (
                <div className="card-base p-8 text-center">
                  <Info className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-primary-700 mb-2">No terms found</h3>
                  <p className="text-sm text-slate-500">
                    Try a different search term or browse alphabetically above.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredTerms.map((term) => (
                    <div key={term.slug} id={`term-${term.slug}`}>
                      <GlossaryCard term={term} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Alphabetical Listing */
            <div className="space-y-10">
              {availableLetters.map((letter) => (
                <div key={letter} id={`letter-${letter}`}>
                  {/* Letter Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-brand-700 flex items-center justify-center text-white text-xl font-extrabold shadow-sm">
                      {letter}
                    </div>
                    <div className="flex-1 h-px bg-surface-300/70" />
                    <span className="text-xs text-slate-400 font-medium">
                      {groupedTerms[letter].length} term{groupedTerms[letter].length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Terms Grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {groupedTerms[letter].map((term) => (
                      <div key={term.slug} id={`term-${term.slug}`}>
                        <GlossaryCard term={term} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== BOTTOM CTA ===== */}
          <div className="mt-16 card-base p-6 sm:p-8 bg-gradient-to-r from-brand-50/50 to-brand-50/50 text-center">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 text-brand" />
            <h3 className="text-xl font-extrabold text-primary-700 mb-2">
              Want to Learn These Concepts in Depth?
            </h3>
            <p className="text-sm text-slate-500 mb-5 max-w-xl mx-auto">
              Our SIP Knowledge Academy explains each concept with definitions, real-life examples,
              formulas, quizzes, and summary notes.
            </p>
            <Link href="/learn" className="btn-primary">
              <BookOpen className="w-4 h-4 mr-2" />
              Explore Learning Modules
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
