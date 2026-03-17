'use client';

import { useState, useRef, useCallback, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Shield, ArrowLeft, Loader2, Mail, Phone, RefreshCw } from 'lucide-react';

interface OTPGateProps {
  onVerified: (token: string, phone: string, email: string) => void;
}

type Step = 'input' | 'verify';

export function OTPGate({ onVerified }: OTPGateProps) {
  // ── Form State ──
  const [step, setStep] = useState<Step>('input');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpChannel, setOtpChannel] = useState<'email' | 'sms+email'>('email');

  // ── Refs ──
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Countdown Timer for Resend ──
  const startCountdown = useCallback(() => {
    setResendCountdown(30);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── Phone Input Handler ──
  const handlePhoneChange = (value: string) => {
    // Strip non-digits, limit to 10
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    setError('');
  };

  // ── Validate Inputs ──
  const validateInputs = (): boolean => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  // ── Send OTP ──
  const handleSendOTP = async () => {
    if (!validateInputs()) return;

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/financial-planning/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      // Track delivery channel (SMS or email-only)
      if (data.channel === 'sms+email') setOtpChannel('sms+email');

      setStep('verify');
      setOtp(['', '', '', '', '', '']);
      startCountdown();

      // Focus first OTP input after transition
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    if (resendCountdown > 0) return;

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/financial-planning/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to resend OTP');
        return;
      }

      setOtp(['', '', '', '', '', '']);
      startCountdown();
      otpRefs.current[0]?.focus();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ── OTP Input Handlers ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Backspace: clear current then move back
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1]?.focus();
      }
    }
    // Arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);

    // Focus last filled input or submit
    const lastIndex = Math.min(pasted.length - 1, 5);
    otpRefs.current[lastIndex]?.focus();

    // Auto-submit if all 6 pasted
    if (pasted.length === 6) {
      handleVerifyOTP(pasted);
    }
  };

  // ── Verify OTP ──
  const handleVerifyOTP = async (otpValue?: string) => {
    const code = otpValue || otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/financial-planning/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email, otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        return;
      }

      onVerified(data.token, phone, email);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // ── Go Back ──
  const handleBack = () => {
    setStep('input');
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 px-6 py-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl mb-3">
            <Shield className="w-6 h-6 text-teal-100" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Financial Wellness Assessment
          </h2>
          <p className="text-teal-200 text-sm mt-1">
            Verify your identity to get your personalized report
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 'input' ? (
            /* ── Step 1: Phone & Email ── */
            <div className="space-y-4">
              {/* Phone */}
              <div>
                <label htmlFor="fp-phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 text-sm font-medium select-none">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    +91
                  </span>
                  <input
                    id="fp-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && phone.length === 10) handleSendOTP();
                    }}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-r-lg text-slate-900 text-base tracking-wide
                      placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                      transition-colors"
                    maxLength={10}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {phone.length}/10 digits
                </p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="fp-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendOTP();
                    }}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-slate-900 text-base
                      placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                      transition-colors"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  OTP will be sent to this email
                </p>
              </div>

              {/* Send OTP Button */}
              <button
                onClick={handleSendOTP}
                disabled={sending || phone.length !== 10 || !email}
                className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed
                  text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>

              <p className="text-xs text-slate-400 text-center leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="/privacy" className="text-teal-600 hover:underline">Privacy Policy</a>{' '}
                and{' '}
                <a href="/terms" className="text-teal-600 hover:underline">Terms of Service</a>
              </p>
            </div>
          ) : (
            /* ── Step 2: OTP Verification ── */
            <div className="space-y-5">
              {/* Info */}
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  {otpChannel === 'sms+email'
                    ? 'We sent a 6-digit code to your phone and email'
                    : 'We sent a 6-digit code to'}
                </p>
                <p className="font-semibold text-slate-800 mt-1">
                  {otpChannel === 'sms+email'
                    ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)} & ${email}`
                    : email}
                </p>
                {otpChannel !== 'sms+email' && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    +91 {phone.slice(0, 5)} {phone.slice(5)}
                  </p>
                )}
              </div>

              {/* OTP Inputs */}
              <div className="flex justify-center gap-1.5 sm:gap-2.5">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    onFocus={(e) => e.target.select()}
                    className={`w-10 h-12 sm:w-11 sm:h-13 text-center text-xl font-bold border-2 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
                      transition-all
                      ${digit
                        ? 'border-teal-500 bg-teal-50 text-teal-800'
                        : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                onClick={() => handleVerifyOTP()}
                disabled={verifying || otp.join('').length !== 6}
                className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed
                  text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>

              {/* Resend & Back */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change number
                </button>

                <button
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || sending}
                  className={`text-sm flex items-center gap-1 transition-colors
                    ${resendCountdown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-teal-600 hover:text-teal-800'
                    }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                  {resendCountdown > 0
                    ? `Resend in ${resendCountdown}s`
                    : 'Resend OTP'
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-4">
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Trustner Asset Services Pvt. Ltd. | ARN-286886 | AMFI Registered MFD
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
