'use client';

import { useState, useCallback } from 'react';
import {
  CheckCircle2,
  Loader2,
  User,
  Phone,
  Mail,
  MessageSquare,
  Shield,
  ArrowRight,
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
  remarks: string;
}

const STORAGE_KEY = 'leadFunnelData';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeadFunnel({ isOpen, onClose }: LeadFunnelProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    remarks: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Modal visibility (checked in render, not as early return — avoids conditional hooks)
  const isModal = typeof isOpen !== 'undefined';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg border bg-surface-100 text-primary-700 placeholder:text-slate-400 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand ${
      errors[field] ? 'border-negative' : 'border-surface-300'
    }`;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
    // Reset OTP state if phone changes
    if (field === 'phone' && otpSent) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtp('');
    }
  };

  // ---------------------------------------------------------------------------
  // OTP Flow
  // ---------------------------------------------------------------------------

  const sendOtp = async () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrors((e) => ({ ...e, phone: 'Enter a valid 10-digit mobile number' }));
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          email: formData.email.trim() || undefined,
        }),
      });
      if (res.ok) {
        setOtpSent(true);
      } else {
        setOtpError('Could not send OTP. Please try again.');
      }
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 4) {
      setOtpError('Enter the OTP sent to your phone');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp }),
      });
      if (res.ok) {
        setOtpVerified(true);
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Validate & Submit
  // ---------------------------------------------------------------------------

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit mobile number';
    }
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.replace(/\D/g, ''),
          email: formData.email.trim(),
          remarks: formData.remarks.trim() || undefined,
          phoneVerified: otpVerified,
          step: 1,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, otpVerified]);

  // ---------------------------------------------------------------------------
  // Early return for modal closed state
  // ---------------------------------------------------------------------------

  if (isModal && !isOpen) return null;

  // ---------------------------------------------------------------------------
  // Success State
  // ---------------------------------------------------------------------------

  if (success) {
    return (
      <div className="w-full max-w-lg mx-auto">
        <div className="card-base p-8 text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-positive-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-positive" />
          </div>
          <h3 className="text-2xl font-bold text-primary-700 mb-2">Thank You!</h3>
          <p className="text-slate-500 mb-1">
            {formData.name.split(' ')[0]}, our team will reach out to you shortly.
          </p>
          <p className="text-xs text-slate-400 mt-4">
            Trustner Asset Services &middot; AMFI ARN-286886 &middot; We respect your privacy.
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

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className={isModal ? '' : 'card-base overflow-hidden'}>
        <div className="px-6 pt-6 pb-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-primary-700">
              Get Your Personalized Investment Guidance
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Share your details — our team will connect with you on WhatsApp or call
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Full Name <span className="text-negative">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter your full name"
                className={inputClass('name')}
              />
              {errors.name && <p className="text-xs text-negative mt-1">{errors.name}</p>}
            </div>

            {/* Phone with OTP */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Mobile Number <span className="text-negative">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={`${inputClass('phone')} flex-1`}
                />
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={otpLoading || formData.phone.replace(/\D/g, '').length < 10}
                    className="px-4 py-3 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200/50 hover:bg-brand-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : otpSent ? 'Resend' : 'Verify'}
                  </button>
                )}
                {otpVerified && (
                  <div className="flex items-center px-3 text-positive">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
              {errors.phone && <p className="text-xs text-negative mt-1">{errors.phone}</p>}

              {/* OTP Input */}
              {otpSent && !otpVerified && (
                <div className="mt-2 flex gap-2 animate-fade-in">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6)); setOtpError(''); }}
                    placeholder="Enter OTP"
                    maxLength={6}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-brand-200 bg-brand-50/30 text-primary-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={otpLoading || otp.length < 4}
                    className="px-4 py-2.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                  </button>
                </div>
              )}
              {otpError && <p className="text-xs text-negative mt-1">{otpError}</p>}
              {otpSent && !otpVerified && !otpError && (
                <p className="text-xs text-brand mt-1">OTP sent to your mobile number</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address <span className="text-negative">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@example.com"
                className={inputClass('email')}
              />
              {errors.email && <p className="text-xs text-negative mt-1">{errors.email}</p>}
            </div>

            {/* Remarks */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Remarks <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => updateField('remarks', e.target.value)}
                placeholder="Tell us about your investment goals, questions, or anything you'd like to discuss..."
                rows={3}
                className={`${inputClass('remarks')} resize-none`}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 btn-primary py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Get Personalized Guidance
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Shield className="w-3 h-3" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Shield className="w-3 h-3" />
              <span>No Spam</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Shield className="w-3 h-3" />
              <span>AMFI Registered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
