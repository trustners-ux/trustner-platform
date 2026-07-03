'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Gauge, ShieldAlert, CheckCircle2, AlertTriangle, Info, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DISCLAIMER } from '@/lib/constants/company';
import { CalculatorLeadForm } from '@/components/sections/CalculatorLeadForm';
import {
  QUESTIONS,
  computePortfolioHealthSignal,
  BAND_HEADLINE,
  type PortfolioCheckAnswers,
  type PortfolioHealthBand,
} from '@/lib/utils/portfolio-check';

const BAND_STYLE: Record<PortfolioHealthBand, { chip: string; ring: string; label: string; Icon: typeof CheckCircle2 }> = {
  green: {
    chip: 'bg-emerald-50 text-emerald-700',
    ring: 'text-emerald-600',
    label: 'Looks Healthy',
    Icon: CheckCircle2,
  },
  amber: {
    chip: 'bg-amber-50 text-amber-700',
    ring: 'text-amber-600',
    label: 'Worth A Closer Look',
    Icon: AlertTriangle,
  },
  red: {
    chip: 'bg-rose-50 text-rose-700',
    ring: 'text-rose-600',
    label: 'Several Flags',
    Icon: ShieldAlert,
  },
};

// Short, RM-facing summary of the top 1-2 flags, kept structural (never fund-specific).
function shortFlagSummary(flags: string[]): string {
  if (flags.length === 0) return 'no flags';
  return flags
    .slice(0, 2)
    .map((f) => f.split('.')[0].split(' — ')[0].trim())
    .join('; ');
}

export default function PortfolioCheckUpPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PortfolioCheckAnswers>({});
  const [showResults, setShowResults] = useState(false);

  const totalSteps = QUESTIONS.length;
  const currentQuestion = QUESTIONS[step];
  const isLastStep = step === totalSteps - 1;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const signal = useMemo(() => computePortfolioHealthSignal(answers), [answers]);

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const handleNext = () => {
    if (isLastStep) {
      setShowResults(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const handleRestart = () => {
    setAnswers({});
    setStep(0);
    setShowResults(false);
  };

  const bandStyle = BAND_STYLE[signal.band];
  const BandIcon = bandStyle.Icon;

  const resultContext = `Portfolio Check-Up: ${signal.band.charAt(0).toUpperCase()}${signal.band.slice(1)} (${signal.score}/100) — flags: ${shortFlagSummary(signal.flags)}`;

  return (
    <>
      {/* Hero */}
      <section className="bg-hero-pattern text-white py-10 lg:py-12">
        <div className="container-custom">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Gauge className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">Portfolio Check-Up</h1>
              <p className="text-slate-300 mt-1">
                A 2-minute self-check on your mutual fund portfolio — then get the real, data-based analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-surface-100">
        <div className="container-custom max-w-2xl">
          {!showResults ? (
            <div className="card-base p-6 sm:p-8">
              {/* Progress indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Question {step + 1} of {totalSteps}</span>
                  <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-teal-600 rounded-full transition-all duration-300"
                    style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <h2 className="text-lg sm:text-xl font-bold text-primary-700 mb-5 leading-snug">
                {currentQuestion.question}
              </h2>

              <div className="space-y-2.5 mb-8">
                {currentQuestion.options.map((option) => {
                  const selected = currentAnswer === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                        selected
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                          : 'border-surface-300 text-slate-600 hover:border-brand-300 hover:bg-surface-100'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Nav buttons */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!currentAnswer}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-teal-700 hover:from-brand-700 hover:to-teal-800 text-white rounded-lg px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLastStep ? 'See My Result' : 'Next'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Results card */}
              <div className="card-base p-6 sm:p-8 text-center">
                <div className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-4', bandStyle.chip)}>
                  <BandIcon className="w-3.5 h-3.5" />
                  {bandStyle.label}
                </div>
                <div className={cn('text-6xl font-extrabold mb-2', bandStyle.ring)}>
                  {signal.score}
                  <span className="text-2xl text-slate-400 font-semibold">/100</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto mb-6">
                  {BAND_HEADLINE[signal.band]}
                </p>

                {signal.flags.length > 0 && (
                  <div className="text-left bg-surface-100 rounded-xl p-5 mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      What came up
                    </h3>
                    <ul className="space-y-2">
                      {signal.flags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', bandStyle.ring.replace('text-', 'bg-'))} />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRestart}
                  className="mt-4 text-xs font-semibold text-slate-400 hover:text-brand-600 transition-colors underline"
                >
                  Retake the check-up
                </button>
              </div>

              {/* Mandatory compliance framing box */}
              <div className="border-2 border-brand-200 bg-brand-50 rounded-xl p-5 flex items-start gap-3">
                <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  This is a self-reported, directional check — not an analysis of your actual mutual fund
                  holdings, and it does NOT constitute investment advice as defined under the SEBI
                  (Investment Advisers) Regulations, 2013. For a complete, data-based review, get the real
                  analysis below — free, and based on your actual statement.
                </p>
              </div>

              {/* Primary next step — the real, data-based analysis */}
              <Link
                href="/portfolio-check"
                className="flex items-center justify-between gap-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl p-5 shadow-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <FileSearch className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Get the real analysis — free, 60 seconds</div>
                    <div className="text-xs text-teal-100 mt-0.5">Upload your CAS, or fetch it via PAN + OTP — fund-by-fund verdicts on your actual holdings</div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Lead capture — only after results are shown; secondary path for those who'd rather talk to someone first */}
      {showResults && (
        <>
          <div className="container-custom max-w-2xl">
            <p className="text-center text-xs text-slate-400 -mb-2">Prefer to talk to someone first?</p>
          </div>
          <CalculatorLeadForm
            calculatorName="Portfolio Check-Up"
            heading="Want the full picture?"
            subtext="Get a complimentary Portfolio Diagnostic from your Relationship Manager — based on your actual statement, not just these answers."
            resultContext={resultContext}
            accent="teal"
          />
        </>
      )}

      {/* Disclaimer */}
      <section className="py-8 bg-surface-200">
        <div className="container-custom">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {DISCLAIMER.calculator} {DISCLAIMER.mutual_fund}
          </p>
        </div>
      </section>
    </>
  );
}
