'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  GraduationCap,
  TrendingUp,
  IndianRupee,
  Home,
  Heart,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Sun,
  Clock,
  Sunset,
  User,
  Phone,
  Mail,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeadFunnelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  goal: string;
  riskAnswers: Record<string, string>;
  preferredCallTime: string;
}

type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOALS = [
  { key: 'Retirement Planning', label: 'Retirement Planning', Icon: Shield, color: 'text-blue-600 bg-blue-50' },
  { key: 'Child Education', label: 'Child Education', Icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
  { key: 'Wealth Building', label: 'Wealth Building', Icon: TrendingUp, color: 'text-brand-700 bg-brand-50' },
  { key: 'Tax Saving', label: 'Tax Saving', Icon: IndianRupee, color: 'text-amber-600 bg-amber-50' },
  { key: 'House Purchase', label: 'House Purchase', Icon: Home, color: 'text-rose-600 bg-rose-50' },
  { key: 'Emergency Fund', label: 'Emergency Fund', Icon: Heart, color: 'text-red-600 bg-red-50' },
] as const;

const RISK_QUESTIONS = [
  {
    id: 'horizon',
    question: 'What is your investment horizon?',
    options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
    scores: [1, 2, 3, 4, 5],
  },
  {
    id: 'drop_reaction',
    question: 'If your investments drop 20%, you would:',
    options: ['Sell everything', 'Sell some', 'Hold', 'Buy more'],
    scores: [1, 2, 3, 5],
  },
  {
    id: 'income_stability',
    question: 'Your monthly income stability:',
    options: ['Very stable', 'Mostly stable', 'Somewhat variable', 'Highly variable'],
    scores: [4, 3, 2, 1],
  },
  {
    id: 'experience',
    question: 'Your investment experience:',
    options: ['None', 'Basic (FDs, savings)', 'Moderate (MF, stocks)', 'Advanced (derivatives, alternatives)'],
    scores: [1, 2, 3, 5],
  },
  {
    id: 'age_group',
    question: 'Your age group:',
    options: ['Below 25', '25-35', '35-45', '45-55', 'Above 55'],
    scores: [5, 4, 3, 2, 1],
  },
] as const;

const TIME_SLOTS = [
  { key: 'Morning (9-12)', label: 'Morning', sub: '9 AM - 12 PM', Icon: Sun },
  { key: 'Afternoon (12-3)', label: 'Afternoon', sub: '12 PM - 3 PM', Icon: Clock },
  { key: 'Evening (3-7)', label: 'Evening', sub: '3 PM - 7 PM', Icon: Sunset },
] as const;

const STORAGE_KEY = 'leadFunnelData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeRiskProfile(answers: Record<string, string>): { profile: RiskProfile; score: number } {
  let total = 0;
  let count = 0;

  for (const q of RISK_QUESTIONS) {
    const answer = answers[q.id];
    if (answer) {
      const idx = q.options.indexOf(answer as never);
      if (idx !== -1) {
        total += q.scores[idx];
        count++;
      }
    }
  }

  if (count === 0) return { profile: 'Moderate', score: 0 };

  const avg = total / count;
  if (avg <= 2) return { profile: 'Conservative', score: total };
  if (avg <= 3.5) return { profile: 'Moderate', score: total };
  return { profile: 'Aggressive', score: total };
}

function getRecommendation(profile: RiskProfile): string {
  switch (profile) {
    case 'Conservative':
      return 'Based on your profile, we recommend debt-focused SIP strategies with stable returns and capital protection.';
    case 'Moderate':
      return 'Based on your profile, we recommend hybrid-focused SIP strategies balancing growth with stability.';
    case 'Aggressive':
      return 'Based on your profile, we recommend equity-focused SIP strategies for maximum long-term wealth creation.';
  }
}

function getProfileBadge(profile: RiskProfile): string {
  switch (profile) {
    case 'Conservative':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Moderate':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Aggressive':
      return 'bg-green-100 text-green-700 border-green-200';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeadFunnel({ isOpen, onClose }: LeadFunnelProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    goal: '',
    riskAnswers: {},
    preferredCallTime: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // If isOpen is explicitly false, don't render (modal usage)
  const isModal = typeof isOpen !== 'undefined';
  if (isModal && !isOpen) return null;

  // ---------------------------------------------------------------------------
  // LocalStorage persistence
  // ---------------------------------------------------------------------------
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { step: number; formData: FormData };
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.step && parsed.step >= 1 && parsed.step <= 4) setStep(parsed.step);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const persist = useCallback(
    (s: number, fd: FormData) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: s, formData: fd }));
      } catch {
        // ignore
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Partial save helper
  // ---------------------------------------------------------------------------
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const savePartial = useCallback(
    async (currentStep: number, data: FormData) => {
      try {
        const { profile, score } = computeRiskProfile(data.riskAnswers);
        await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim() || undefined,
            phone: data.phone.replace(/\D/g, '') || undefined,
            email: data.email.trim() || undefined,
            goal: data.goal || undefined,
            riskProfile: Object.keys(data.riskAnswers).length > 0 ? profile : undefined,
            riskScore: Object.keys(data.riskAnswers).length > 0 ? score : undefined,
            riskAnswers: Object.keys(data.riskAnswers).length > 0 ? data.riskAnswers : undefined,
            preferredCallTime: data.preferredCallTime || undefined,
            step: currentStep,
            source: 'lead-funnel',
          }),
        });
      } catch {
        // Silently fail — do not block funnel
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Validators
  // ---------------------------------------------------------------------------

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (!formData.goal) {
      setErrors({ goal: 'Please select an investment goal' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep3 = (): boolean => {
    const unanswered = RISK_QUESTIONS.filter((q) => !formData.riskAnswers[q.id]);
    if (unanswered.length > 0) {
      setErrors({ risk: 'Please answer all questions to determine your risk profile' });
      return false;
    }
    setErrors({});
    return true;
  };

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goNext = async () => {
    let valid = false;
    if (step === 1) valid = validateStep1();
    else if (step === 2) valid = validateStep2();
    else if (step === 3) valid = validateStep3();

    if (!valid) return;

    const nextStep = step + 1;
    setStep(nextStep);
    persist(nextStep, formData);
    savePartial(step, formData);
    setErrors({});
  };

  const goBack = () => {
    const prevStep = step - 1;
    if (prevStep < 1) return;
    setStep(prevStep);
    persist(prevStep, formData);
    setErrors({});
  };

  // ---------------------------------------------------------------------------
  // Final submit
  // ---------------------------------------------------------------------------

  const handleBookConsultation = async () => {
    if (!formData.preferredCallTime) {
      setErrors({ time: 'Please select a preferred time' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { profile, score } = computeRiskProfile(formData.riskAnswers);
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.replace(/\D/g, ''),
          email: formData.email.trim(),
          goal: formData.goal,
          riskProfile: profile,
          riskScore: score,
          riskAnswers: formData.riskAnswers,
          preferredCallTime: formData.preferredCallTime,
          step: 4,
          source: 'lead-funnel',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem('leadModalShown', 'true');
        } catch {
          // ignore
        }
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Update helpers
  // ---------------------------------------------------------------------------

  const updateField = (field: keyof FormData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const updateRiskAnswer = (questionId: string, answer: string) => {
    const updated = {
      ...formData,
      riskAnswers: { ...formData.riskAnswers, [questionId]: answer },
    };
    setFormData(updated);
    if (errors.risk) setErrors((e) => ({ ...e, risk: '' }));
  };

  // ---------------------------------------------------------------------------
  // Progress
  // ---------------------------------------------------------------------------

  const STEPS = [
    { num: 1, label: 'Your Details' },
    { num: 2, label: 'Investment Goal' },
    { num: 3, label: 'Risk Profile' },
    { num: 4, label: 'Book Call' },
  ];

  const progressPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

  // ---------------------------------------------------------------------------
  // Input style
  // ---------------------------------------------------------------------------

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg border bg-surface-100 text-primary-700 placeholder:text-slate-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
      errors[field] ? 'border-negative' : 'border-surface-300'
    }`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (success) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="card-base p-8 text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-positive-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-positive" />
          </div>
          <h3 className="text-2xl font-bold text-primary-700 mb-2">Consultation Booked!</h3>
          <p className="text-slate-500 mb-1">
            Thank you, {formData.name.split(' ')[0]}! Our expert advisor will call you during your preferred time slot.
          </p>
          <p className="text-xs text-slate-400 mt-4">
            We respect your privacy. No spam, ever.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 text-sm font-medium text-brand hover:text-brand-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className={isModal ? '' : 'card-base overflow-hidden'}>
        {/* ---- Progress Bar ---- */}
        <div className="px-6 pt-6 pb-4">
          {/* Step indicators */}
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s) => (
              <div key={s.num} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step >= s.num
                      ? 'bg-brand text-white shadow-glow-brand'
                      : 'bg-surface-200 text-slate-400'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors ${
                    step >= s.num ? 'text-brand' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          {/* Progress track */}
          <div className="w-full h-1.5 bg-surface-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500 ease-smooth"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ---- Step Content ---- */}
        <div className="px-6 pb-6">
          {/* ============== STEP 1 — Your Details ============== */}
          {step === 1 && (
            <div className="animate-fade-in space-y-5">
              <div>
                <h2 className="text-xl font-bold text-primary-700">Your Details</h2>
                <p className="text-sm text-slate-500 mt-0.5">Tell us a bit about yourself</p>
              </div>

              {/* Name */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <User className="w-3.5 h-3.5" />
                  Full Name <span className="text-negative">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={inputClass('name')}
                />
                {errors.name && <p className="mt-1 text-xs text-negative">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Phone Number <span className="text-negative">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={inputClass('phone')}
                />
                {errors.phone && <p className="mt-1 text-xs text-negative">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email Address <span className="text-negative">*</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={inputClass('email')}
                />
                {errors.email && <p className="mt-1 text-xs text-negative">{errors.email}</p>}
              </div>

              <button onClick={goNext} className="btn-primary w-full gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ============== STEP 2 — Investment Goal ============== */}
          {step === 2 && (
            <div className="animate-fade-in space-y-5">
              <div>
                <h2 className="text-xl font-bold text-primary-700">Your Investment Goal</h2>
                <p className="text-sm text-slate-500 mt-0.5">What are you saving for?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(({ key, label, Icon, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateField('goal', key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      formData.goal === key
                        ? 'border-brand bg-brand-50 shadow-glow-brand'
                        : 'border-surface-300 bg-white hover:border-brand-400 hover:bg-brand-50/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-primary-700">{label}</span>
                  </button>
                ))}
              </div>

              {errors.goal && <p className="text-xs text-negative text-center">{errors.goal}</p>}

              <div className="flex gap-3">
                <button onClick={goBack} className="btn-secondary flex-1 gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={goNext} className="btn-primary flex-1 gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============== STEP 3 — Risk Profile ============== */}
          {step === 3 && (
            <div className="animate-fade-in space-y-5">
              <div>
                <h2 className="text-xl font-bold text-primary-700">Risk Profile Assessment</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Answer 5 quick questions to understand your risk appetite
                </p>
              </div>

              <div className="space-y-5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {RISK_QUESTIONS.map((q, qi) => (
                  <div key={q.id}>
                    <p className="text-sm font-semibold text-primary-700 mb-2">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateRiskAnswer(q.id, opt)}
                          className={`text-left px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
                            formData.riskAnswers[q.id] === opt
                              ? 'border-brand bg-brand-50 text-brand-800 font-medium'
                              : 'border-surface-300 bg-white text-slate-600 hover:border-brand-400 hover:bg-brand-50/30'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {errors.risk && <p className="text-xs text-negative text-center">{errors.risk}</p>}

              <div className="flex gap-3">
                <button onClick={goBack} className="btn-secondary flex-1 gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={goNext} className="btn-primary flex-1 gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============== STEP 4 — Book Advisor Call ============== */}
          {step === 4 && (
            <div className="animate-fade-in space-y-5">
              <div>
                <h2 className="text-xl font-bold text-primary-700">Book Your Free Consultation</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Your risk profile is ready. Choose a convenient time.
                </p>
              </div>

              {/* Risk Profile Badge */}
              {(() => {
                const { profile, score } = computeRiskProfile(formData.riskAnswers);
                return (
                  <div className="card-base p-5 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">
                      Your Risk Profile
                    </p>
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold border ${getProfileBadge(
                        profile
                      )}`}
                    >
                      {profile} (Score: {score})
                    </span>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                      {getRecommendation(profile)}
                    </p>
                  </div>
                );
              })()}

              {/* Time Selection */}
              <div>
                <p className="text-sm font-semibold text-primary-700 mb-2">Preferred Call Time</p>
                <div className="grid grid-cols-3 gap-3">
                  {TIME_SLOTS.map(({ key, label, sub, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        updateField('preferredCallTime', key);
                        if (errors.time) setErrors((e) => ({ ...e, time: '' }));
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                        formData.preferredCallTime === key
                          ? 'border-brand bg-brand-50 shadow-glow-brand'
                          : 'border-surface-300 bg-white hover:border-brand-400'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${formData.preferredCallTime === key ? 'text-brand' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold text-primary-700">{label}</span>
                      <span className="text-[10px] text-slate-400">{sub}</span>
                    </button>
                  ))}
                </div>
                {errors.time && <p className="mt-1 text-xs text-negative text-center">{errors.time}</p>}
              </div>

              <div className="flex gap-3">
                <button onClick={goBack} className="btn-secondary flex-1 gap-1">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleBookConsultation}
                  disabled={loading}
                  className="flex-[2] inline-flex items-center justify-center gap-2 py-3 px-6 rounded-md text-sm font-semibold text-white transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #E8553A 0%, #C4381A 100%)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Book Free Consultation'
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                We respect your privacy. No spam, ever.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
