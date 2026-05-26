/**
 * Password Reset Page
 *
 * Route: /auth/reset?token=<jwt>
 *
 * User lands here from the email link. Shows a form to choose a new
 * password. On submit, POSTs to /api/auth/confirm-reset with the
 * token + new password. On success, redirects to /admin/login.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function ResetPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Missing reset token. Use the link from your email.');
  }, [token]);

  function strength(p: string): { score: number; label: string; color: string } {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    const map = [
      { label: '', color: 'bg-slate-200' },
      { label: 'Weak', color: 'bg-rose-500' },
      { label: 'Fair', color: 'bg-amber-500' },
      { label: 'Good', color: 'bg-emerald-500' },
      { label: 'Strong', color: 'bg-emerald-600' },
      { label: 'Very strong', color: 'bg-emerald-700' },
    ];
    return { score: s, ...map[s] };
  }
  const strengthInfo = strength(newPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Password must include uppercase, lowercase, and a digit');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/confirm-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Could not reset password');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/admin/login'), 2500);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Password reset</h1>
          <p className="text-sm text-slate-600 mb-6">
            Your password has been updated. Redirecting to the login page&hellip;
          </p>
          <Link
            href="/admin/login"
            className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700"
          >
            Go to Login
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
            <Lock className="w-6 h-6 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
            <p className="text-xs text-slate-500">Trustner Advisory Workbench</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Your new password will be applied to both the Employee and Admin portals — use the same one for both.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">New password <span className="text-rose-600">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-sm focus:border-primary-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Minimum 8 characters &middot; mix upper + lower + number</p>
            {newPassword && (
              <div className="mt-2">
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded ${i < strengthInfo.score ? strengthInfo.color : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">{strengthInfo.label}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm new password <span className="text-rose-600">*</span></label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter the new password"
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-sm focus:border-primary-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !token}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {submitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <Link href="/admin/login" className="text-sm text-slate-500 hover:text-primary-700">
            Back to Login
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          Trustner Asset Services Pvt. Ltd. &middot; AMFI ARN-286886 &middot; Authorized access only
        </p>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>}>
      <ResetPageInner />
    </Suspense>
  );
}
