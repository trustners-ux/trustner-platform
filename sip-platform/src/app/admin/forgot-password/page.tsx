'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-900 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <Image
              src="/Trustner Logo-blue.png"
              alt="Trustner"
              width={48}
              height={48}
              className="object-contain brightness-0 invert"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Trustner Admin</h1>
          <p className="text-sm text-slate-400">Password Recovery</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-primary-700 mb-2">Check Your Email</h2>
              <p className="text-sm text-slate-500 mb-1">
                If <strong>{email}</strong> is registered, a new password has been sent to it.
              </p>
              <p className="text-xs text-slate-400 mb-6">
                Please check your inbox (and spam folder) for the reset email.
              </p>
              <a
                href="/admin/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-brand hover:bg-brand-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </a>
            </div>
          ) : (
            /* Form State */
            <>
              <h2 className="text-lg font-bold text-primary-700 mb-2">Forgot Password?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Enter your registered email and we&apos;ll send you a new password.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@trustner.in"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg text-sm font-bold text-white bg-brand hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Send New Password'
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <a
                  href="/admin/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-700 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
