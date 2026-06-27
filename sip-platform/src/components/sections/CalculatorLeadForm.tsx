'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle2, MessageCircle, Phone, Mail, User, Sparkles } from 'lucide-react';
import { TurnstileWidget } from '@/components/security/TurnstileWidget';

interface CalculatorLeadFormProps {
  /** The calculator name — sent as `source` + `goal` to the lead API */
  calculatorName: string;
  /** Headline shown above the form */
  heading?: string;
  /** Subtext below the headline */
  subtext?: string;
  /** Optional: the calculator's key output(s), included in the Remarks for the RM */
  resultContext?: string;
  /** Accent color theme */
  accent?: 'brand' | 'violet' | 'amber' | 'rose' | 'teal' | 'indigo';
}

const ACCENT_MAP = {
  brand: {
    bg: 'from-brand-50 via-teal-50 to-brand-50',
    border: 'border-brand-200/60',
    button: 'from-brand-600 to-teal-700 hover:from-brand-700 hover:to-teal-800',
    badge: 'bg-brand text-white',
    chip: 'bg-white border-brand-200/50 text-brand',
    accentBar: 'from-brand-500 to-teal-600',
  },
  violet: {
    bg: 'from-violet-50 via-fuchsia-50 to-violet-50',
    border: 'border-violet-200/60',
    button: 'from-violet-600 to-fuchsia-700 hover:from-violet-700 hover:to-fuchsia-800',
    badge: 'bg-violet-600 text-white',
    chip: 'bg-white border-violet-200/50 text-violet-700',
    accentBar: 'from-violet-500 to-fuchsia-600',
  },
  amber: {
    bg: 'from-amber-50 via-orange-50 to-amber-50',
    border: 'border-amber-200/60',
    button: 'from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800',
    badge: 'bg-amber-600 text-white',
    chip: 'bg-white border-amber-200/50 text-amber-700',
    accentBar: 'from-amber-500 to-orange-600',
  },
  rose: {
    bg: 'from-rose-50 via-pink-50 to-rose-50',
    border: 'border-rose-200/60',
    button: 'from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800',
    badge: 'bg-rose-600 text-white',
    chip: 'bg-white border-rose-200/50 text-rose-700',
    accentBar: 'from-rose-500 to-pink-600',
  },
  teal: {
    bg: 'from-teal-50 via-cyan-50 to-teal-50',
    border: 'border-teal-200/60',
    button: 'from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800',
    badge: 'bg-teal-600 text-white',
    chip: 'bg-white border-teal-200/50 text-teal-700',
    accentBar: 'from-teal-500 to-cyan-600',
  },
  indigo: {
    bg: 'from-indigo-50 via-blue-50 to-indigo-50',
    border: 'border-indigo-200/60',
    button: 'from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800',
    badge: 'bg-indigo-600 text-white',
    chip: 'bg-white border-indigo-200/50 text-indigo-700',
    accentBar: 'from-indigo-500 to-blue-600',
  },
};

/**
 * Inline lead-capture card for calculator pages.
 *
 * Captures name + phone (mandatory) + email (optional).
 * Posts to /api/lead with source="calc-<calculatorName>", goal=calculatorName,
 * and resultContext included in remarks so the RM sees the user's actual numbers.
 *
 * Shows a success state with a WhatsApp deep-link as the primary post-submit action.
 */
export function CalculatorLeadForm({
  calculatorName,
  heading = 'Want a personalised plan around these numbers?',
  subtext = 'Share your contact — your Relationship Manager will call back with a goal-based plan, zero obligation. We never spam.',
  resultContext,
  accent = 'brand',
}: CalculatorLeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // DPDP §6 — explicit, specific, unambiguous consent. Default UNCHECKED.
  const [consent, setConsent] = useState(false);
  // Turnstile CAPTCHA token (empty until the user solves it; stays empty — and
  // the widget renders nothing — until Turnstile keys are configured).
  const [turnstileToken, setTurnstileToken] = useState('');

  const theme = ACCENT_MAP[accent];

  const sanitizedPhone = phone.replace(/\D/g, '');
  const canSubmit =
    name.trim().length >= 2 &&
    sanitizedPhone.length === 10 &&
    consent &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const remarks = resultContext
        ? `[${calculatorName}] ${resultContext}`
        : `[${calculatorName}] — user reached out from the calculator.`;

      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: sanitizedPhone,
          email: email.trim() || undefined,
          goal: calculatorName,
          remarks,
          source: `calc-${calculatorName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          consent: {
            given: consent,
            version: '2026-05-28',
            timestamp: new Date().toISOString(),
          },
          turnstileToken,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Submission failed. Please try again.');
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappText = encodeURIComponent(
    `Hi Trustner, I just used the ${calculatorName} on MeraSIP${
      resultContext ? ` (${resultContext})` : ''
    }. I'd like a personalised plan. My name is ${name || '...'}.`
  );
  const whatsappLink = `https://wa.me/916003903737?text=${whatsappText}`;

  if (success) {
    return (
      <section className={`py-12 bg-gradient-to-r ${theme.bg}`} data-pdf-hide>
        <div className="container-custom">
          <div className={`max-w-2xl mx-auto rounded-2xl bg-white shadow-xl border ${theme.border} overflow-hidden`}>
            <div className={`h-1 bg-gradient-to-r ${theme.accentBar}`} />
            <div className="p-8 sm:p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-extrabold text-primary-700 mb-2">
                Thanks, {name.split(' ')[0]}! We have your details.
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-md mx-auto">
                Your Relationship Manager will reach out within 24 hours on +91 {sanitizedPhone}.
                For an instant chat, tap the button below.
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-lg px-6 py-3 text-sm font-bold transition-colors shadow-lg shadow-green-500/20"
              >
                <MessageCircle className="w-4 h-4" />
                Continue on WhatsApp
              </a>
              <p className="text-[10px] text-slate-400 mt-4">
                Trustner Asset Services Pvt. Ltd. · AMFI ARN-286886
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-12 bg-gradient-to-r ${theme.bg}`} data-pdf-hide>
      <div className="container-custom">
        <div className={`max-w-3xl mx-auto rounded-2xl bg-white shadow-xl border ${theme.border} overflow-hidden`}>
          <div className={`h-1 bg-gradient-to-r ${theme.accentBar}`} />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Left: Copy */}
              <div className="flex-1">
                <div className={`inline-flex items-center gap-2 ${theme.chip} rounded-full px-3 py-1 text-[11px] font-semibold border mb-3`}>
                  <Sparkles className="w-3 h-3" />
                  Personalised Plan
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-primary-700 mb-2 leading-tight">
                  {heading}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{subtext}</p>
                {resultContext && (
                  <div className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <span className="font-semibold text-slate-700">Your result: </span>
                    {resultContext}
                  </div>
                )}
              </div>

              {/* Right: Form */}
              <form onSubmit={handleSubmit} className="w-full sm:w-[320px] space-y-3 shrink-0">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-medium text-primary-700 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-medium text-primary-700 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full pl-9 pr-3 py-2.5 text-sm font-medium text-primary-700 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                {/* DPDP §6 — explicit consent */}
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-surface-300 text-brand focus:ring-2 focus:ring-brand/30 shrink-0"
                  />
                  <span className="text-[10px] leading-snug text-slate-500">
                    I am 18+ and consent to Trustner contacting me about MF
                    products and processing my data per the{' '}
                    <a href="/privacy" target="_blank" rel="noopener" className="underline hover:text-brand">
                      Privacy Policy
                    </a>.
                  </span>
                </label>

                {/* Bot defence — renders nothing until Turnstile keys are set. */}
                <TurnstileWidget onToken={setTurnstileToken} />

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${theme.button} text-white rounded-lg px-5 py-3 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Get My Plan
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  We call back within 24h · Zero spam · AMFI ARN-286886
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
