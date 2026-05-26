/**
 * Forgot Password — request a reset link by email.
 *
 * Route: /auth/forgot
 *
 * Public page. User enters email, POSTs to /api/auth/request-reset,
 * gets a generic success message regardless of whether the email is
 * registered (no enumeration).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function ForgotPasswordPageInner() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // Always show success (no enumeration)
      setSubmitted(true);
      if (!res.ok) {
        // Log silently — show success UI either way
        console.warn('[forgot] request-reset returned', res.status);
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            If <strong>{email}</strong> is registered, we&rsquo;ve sent a password reset link. The link is valid for <strong>60 minutes</strong>.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            Didn&rsquo;t get the email? Check spam, or try again in a few minutes.
          </p>
          <Link
            href="/admin/login"
            className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
            <p className="text-xs text-slate-500">Trustner Advisory Workbench</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Enter the email address you use to sign in. We&rsquo;ll send you a link to reset your password — valid for 60 minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-rose-600">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@trustner.in"
              required
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {submitting ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <Link href="/admin/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-700">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          Trustner Asset Services Pvt. Ltd. &middot; AMFI ARN-286886
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>}>
      <ForgotPasswordPageInner />
    </Suspense>
  );
}
