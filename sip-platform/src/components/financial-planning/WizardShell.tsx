'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WizardStepConfig {
  id: number;
  title: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface WizardShellProps {
  steps: WizardStepConfig[];
  onComplete: (data: unknown) => void;
  storageKey?: string;
  /** Optional per-step validator. Returns error message string if invalid, or empty string/null if valid. */
  validateStep?: (stepIndex: number) => string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WizardShell({ steps, onComplete, storageKey = 'wizardData', validateStep }: WizardShellProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<Record<string, unknown>>({});
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [validationError, setValidationError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // ---------------------------------------------------------------------------
  // localStorage persistence
  // ---------------------------------------------------------------------------

  // Load saved state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { currentStep?: number; wizardData?: Record<string, unknown> };
        if (parsed.wizardData) setWizardData(parsed.wizardData);
        if (typeof parsed.currentStep === 'number' && parsed.currentStep >= 0 && parsed.currentStep < totalSteps) {
          setCurrentStep(parsed.currentStep);
        }
      }
    } catch {
      // Ignore parse errors from corrupted/old data
    }
  }, [storageKey, totalSteps]);

  // Scroll validation error into view on mobile
  useEffect(() => {
    if (validationError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [validationError]);

  // Persist on every change
  const persist = useCallback(
    (step: number, data: Record<string, unknown>) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ currentStep: step, wizardData: data }));
      } catch {
        // Ignore storage quota errors
      }
    },
    [storageKey]
  );

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goNext = useCallback(() => {
    // Validate current step before proceeding
    if (validateStep) {
      const error = validateStep(currentStep);
      if (error) {
        setValidationError(error);
        return;
      }
    }
    setValidationError(null);

    if (isLastStep) {
      // Final step — trigger completion
      onComplete(wizardData);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
      return;
    }

    const nextStep = currentStep + 1;
    setDirection('forward');
    setCurrentStep(nextStep);
    persist(nextStep, wizardData);
  }, [currentStep, isLastStep, wizardData, onComplete, persist, storageKey, validateStep]);

  const goBack = useCallback(() => {
    if (isFirstStep) return;
    setValidationError(null);
    const prevStep = currentStep - 1;
    setDirection('backward');
    setCurrentStep(prevStep);
    persist(prevStep, wizardData);
  }, [currentStep, isFirstStep, persist, wizardData]);

  // ---------------------------------------------------------------------------
  // Progress calculation
  // ---------------------------------------------------------------------------

  const progressPercent = useMemo(() => {
    if (totalSteps <= 1) return 100;
    return ((currentStep + 1) / totalSteps) * 100;
  }, [currentStep, totalSteps]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="card-base overflow-hidden">
        {/* ---- Progress Indicator ---- */}
        <div className="px-4 sm:px-6 pt-6 pb-4">
          {/* Step circles connected by lines */}
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isUpcoming = idx > currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  {/* Step circle + label */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-positive text-white'
                          : isCurrent
                            ? 'bg-brand text-white shadow-glow-brand'
                            : 'bg-surface-200 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-1.5 font-medium transition-colors text-center leading-tight max-w-[72px] ${
                        isCompleted
                          ? 'text-positive'
                          : isCurrent
                            ? 'text-brand'
                            : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>

                  {/* Connecting line (not after last step) */}
                  {idx < totalSteps - 1 && (
                    <div className="flex-1 mx-2 mt-[-18px]">
                      <div className="h-[2px] rounded-full bg-surface-200 relative overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-smooth ${
                            isCompleted ? 'bg-positive w-full' : isCurrent ? 'bg-brand w-1/2' : 'w-0'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar track */}
          <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500 ease-smooth"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step counter */}
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>

        {/* ---- Validation Error ---- */}
        {validationError && (
          <div ref={errorRef} className="mx-4 sm:mx-6 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <span className="text-red-500 mt-0.5 shrink-0">!</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* ---- Step Content + Navigation (form for Enter key support) ---- */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goNext();
          }}
        >
          <div className="px-4 sm:px-6 pb-2">
            <div
              key={currentStep}
              className={direction === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}
            >
              {steps[currentStep]?.component}
            </div>
          </div>

          {/* ---- Navigation Bar ---- */}
          <div className="px-4 sm:px-6 pb-6 pt-4">
            <div className="flex gap-3">
              {/* Back button (invisible placeholder on first step to keep layout stable) */}
              <button
                type="button"
                onClick={goBack}
                className={`btn-secondary flex-1 gap-1 ${isFirstStep ? 'invisible' : ''}`}
                tabIndex={isFirstStep ? -1 : 0}
                aria-hidden={isFirstStep}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {/* Next / Complete button */}
              <button
                type="submit"
                className={`gap-1 flex-[2] inline-flex items-center justify-center py-3 px-6 rounded-md text-sm font-semibold text-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] ${
                  isLastStep
                    ? 'bg-gradient-to-br from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-600'
                    : 'bg-brand hover:bg-brand-800'
                }`}
              >
                {isLastStep ? (
                  'Get My Score'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
