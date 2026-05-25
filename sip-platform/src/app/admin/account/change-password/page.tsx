'use client';

/**
 * Change Password — Self-service for the currently-signed-in user.
 * Works for both Admin Portal and Employee Portal sessions.
 *
 * Route: /admin/account/change-password
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Live strength signals
  const strength = scorePassword(newPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (strength.score < 3) {
      setError('Please choose a stronger password (mix uppercase, lowercase, numbers, and a symbol)');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/employee/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to change password');
      } else {
        setSuccess(data.message || 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Redirect to dashboard after a short delay
        setTimeout(() => router.push('/admin'), 1800);
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Change Password</h1>
            <p className="text-xs text-slate-500">
              Update your sign-in password for both Employee and Admin portals.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            autoFocus
            required
          />

          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            required
            hint="Minimum 8 characters · mix upper + lower + number + symbol"
          />

          {newPassword && (
            <div>
              <div className="flex gap-1 h-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={
                      'flex-1 rounded-full ' +
                      (i <= strength.score
                        ? strength.score <= 2
                          ? 'bg-rose-500'
                          : strength.score === 3
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                        : 'bg-slate-200')
                    }
                  />
                ))}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{strength.label}</div>
            </div>
          )}

          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            required
          />

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 flex items-start gap-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-start gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{success} Redirecting…</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full inline-flex items-center justify-center rounded-xl bg-brand text-white font-semibold py-3 px-4 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Updating…' : 'Change Password'}
          </button>
        </form>
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Trustner Asset Services Pvt. Ltd. · ARN-286886 · Authorized access only
      </p>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoFocus = false,
  required = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoFocus?: boolean;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pr-10 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition"
          autoFocus={autoFocus}
          autoComplete={label.includes('Current') ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function scorePassword(pwd: string): { score: number; label: string } {
  if (!pwd) return { score: 0, label: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  return { score, label: labels[Math.min(score, 5)] };
}
