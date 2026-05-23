'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { PhoneCall, X, CheckCircle2, Send, MapPin, User, Mail, MessageSquareText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ── Page-context helper (auto-detects what page the visitor is on) ── */
function getPageContext(pathname: string): string {
  if (pathname.startsWith('/life-plans/'))
    return `Life Plans – ${pathname.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
  if (pathname === '/life-plans') return 'Life Plans';
  if (pathname.startsWith('/blog/')) return 'Blog Article';
  if (pathname === '/blog') return 'Blog';
  if (pathname.startsWith('/calculators')) return 'Calculators';
  if (pathname.startsWith('/funds')) return 'Fund Explorer';
  if (pathname.startsWith('/financial-planning')) return 'Financial Planning';
  if (pathname.startsWith('/learn')) return 'Learning Academy';
  if (pathname.startsWith('/research')) return 'Research';
  if (pathname === '/market-pulse') return 'Market Pulse';
  if (pathname === '/glossary') return 'SIP Glossary';
  if (pathname === '/resources/taxation') return 'Taxation Guide';
  if (pathname === '/') return 'Homepage';
  return 'General';
}

/* ── Simple field validation ── */
function validateForm(f: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!f.name.trim()) errors.name = 'Name is required';
  if (!f.phone.trim()) errors.phone = 'Mobile number is required';
  else if (!/^\d{10}$/.test(f.phone.replace(/\D/g, '')))
    errors.phone = 'Enter a valid 10-digit number';
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    errors.email = 'Enter a valid email address';
  return errors;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  city: string;
  remarks: string;
}

const INITIAL_FORM: FormState = { name: '', phone: '', email: '', city: '', remarks: '' };

export function CallbackCTA() {
  const pathname = usePathname();
  const [showButton, setShowButton] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* Fade in after 2 seconds */
  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(t);
  }, []);

  /* Lock body scroll when modal is open */
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const handleChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    },
    [errors],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const pageContext = getPageContext(pathname);
      const goalParts = [`Page: ${pageContext}`];
      if (form.city.trim()) goalParts.push(`City: ${form.city.trim()}`);
      if (form.remarks.trim()) goalParts.push(`Note: ${form.remarks.trim()}`);

      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, ''),
          email: form.email.trim() || undefined,
          goal: goalParts.join(' | '),
          source: 'callback-cta',
          step: 4,
        }),
      });
      setSubmitted(true);
    } catch {
      // Silently handle — the form showed intent
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Reset form after animation
    setTimeout(() => {
      setForm(INITIAL_FORM);
      setErrors({});
      setSubmitted(false);
    }, 300);
  };

  /* ─── Floating Button ─── */
  const FloatingButton = (
    <button
      onClick={() => setShowModal(true)}
      aria-label="Request a callback"
      className={cn(
        'fixed z-50 flex items-center gap-2 rounded-full shadow-lg transition-all duration-500',
        'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800',
        'text-white font-medium',
        'hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]',
        // Position — bottom-left, above mobile bar
        'bottom-[76px] left-4 lg:bottom-8 lg:left-6',
        // Size — compact on mobile, pill on desktop
        'h-12 w-12 justify-center lg:h-11 lg:w-auto lg:px-5 lg:py-2.5',
        showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      )}
    >
      <PhoneCall className="w-5 h-5 shrink-0" />
      <span className="hidden lg:inline text-sm">Request Callback</span>
    </button>
  );

  /* ─── Modal ─── */
  const Modal = showModal ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closeModal}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Request a Callback</h3>
              <p className="text-teal-100 text-sm mt-0.5">
                We&apos;ll get back to you within 24 hours
              </p>
            </div>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {submitted ? (
          /* ── Success State ── */
          <div className="px-6 py-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-xl font-semibold text-slate-800">Thank You!</h4>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
              Our team will call you shortly. Meanwhile, feel free to explore our resources.
            </p>
            <button
              onClick={closeModal}
              className="mt-6 px-8 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Continue Browsing
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Ram Shah"
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors',
                  'focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500',
                  errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                )}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                Mobile Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="9876543210"
                  className={cn(
                    'w-full pl-12 pr-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors',
                    'focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500',
                    errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                  )}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Email + City — side by side on wider screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="you@email.com"
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors',
                    'focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500',
                    errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                  )}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={handleChange('city')}
                  placeholder="Mumbai"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none transition-colors focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <MessageSquareText className="w-3.5 h-3.5 text-slate-400" />
                How can we help? <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.remarks}
                onChange={handleChange('remarks')}
                placeholder="e.g., I want to start SIP for my child's education..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none transition-colors resize-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200',
                'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800',
                'shadow-sm hover:shadow-md active:scale-[0.98]',
                loading && 'opacity-80 cursor-not-allowed',
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Request Callback
                </>
              )}
            </button>

            {/* Trust signals */}
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Your information is safe with us. We respect your privacy and will only use your details to assist you.
            </p>
          </form>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      {FloatingButton}
      {Modal}
    </>
  );
}
