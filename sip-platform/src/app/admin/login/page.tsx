'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2,
  CheckCircle, Shield, UserCheck, AlertCircle, KeyRound, Users,
} from 'lucide-react';

type Step = 'email' | 'login' | 'setup' | 'reset-sent';

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [designation, setDesignation] = useState('');
  const [resetApprovers, setResetApprovers] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Check email
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/employee/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.status === 'not_found') {
        setError(data.message);
      } else if (data.status === 'inactive') {
        setError(data.message);
      } else if (data.status === 'new') {
        setEmployeeName(data.employeeName);
        setDesignation(data.designation);
        setStep('setup');
      } else if (data.status === 'active') {
        setEmployeeName(data.employeeName);
        setDesignation(data.designation);
        setStep('login');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: Login with password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/employee/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Route based on role
      const role = data.user?.role;
      if (role === 'bod' || role === 'cdo') {
        router.push('/admin');
      } else if (['regional_manager', 'branch_head', 'cdm', 'manager'].includes(role)) {
        router.push('/admin');
      } else {
        router.push('/rm');
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // Step 2b: Setup password (first time)
  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/employee/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Setup failed');
        setLoading(false);
        return;
      }

      // Auto-logged in — route based on role
      const role = data.user?.role;
      if (role === 'bod' || role === 'cdo' || role === 'regional_manager' || role === 'branch_head' || role === 'cdm' || role === 'manager') {
        router.push('/admin');
      } else {
        router.push('/rm');
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/employee/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Request failed');
        setLoading(false);
        return;
      }

      setResetApprovers(data.approvers || []);
      setStep('reset-sent');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('email');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-900 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <Image
              src="/Trustner Logo-blue.png"
              alt="Trustner"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-0.5">Trustner Employee Portal</h1>
          <p className="text-sm text-white/60">Mera SIP Online &mdash; Team Access</p>
        </div>

        {/* ─── STEP: EMAIL CHECK ─── */}
        {step === 'email' && (
          <form onSubmit={handleCheckEmail} className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Welcome</h2>
                <p className="text-xs text-slate-500">Enter your registered email to continue</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@trustner.in"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Only authorized Trustner employees can sign in</span>
              </div>
            </div>
          </form>
        )}

        {/* ─── STEP: LOGIN (existing user) ─── */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Employee greeting */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                {employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Hi, {employeeName.split(' ')[0]}</h2>
                <p className="text-xs text-slate-500">{designation}</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoFocus
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-5">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={goBack}
              className="w-full mt-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Use a different email
            </button>
          </form>
        )}

        {/* ─── STEP: FIRST-TIME PASSWORD SETUP ─── */}
        {step === 'setup' && (
          <form onSubmit={handleSetupPassword} className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Welcome, {employeeName.split(' ')[0]}!</h2>
                <p className="text-xs text-slate-500">{designation}</p>
              </div>
            </div>

            <div className="mb-5 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700">
                This is your first login. Please create a secure password to access your Trustner portal.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Create Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-amber-600 mt-1">Password must be at least 8 characters</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Set Password & Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={goBack}
              className="w-full mt-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          </form>
        )}

        {/* ─── STEP: RESET REQUEST SENT ─── */}
        {step === 'reset-sent' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Reset Request Submitted</h2>
            <p className="text-sm text-slate-600 mb-4">
              Your password reset request has been sent for approval.
            </p>

            {resetApprovers.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-4">
                <p className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Pending Approval From
                </p>
                <div className="space-y-1">
                  {resetApprovers.map((name, i) => (
                    <p key={i} className="text-sm font-medium text-slate-700">{name}</p>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 mb-5">
              Once approved, your manager will share a temporary password with you.
              You can then log in and change it.
            </p>

            <button
              onClick={goBack}
              className="w-full py-3 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-white/40">
          Trustner Asset Services Pvt. Ltd. &mdash; Authorized access only
        </p>
      </div>
    </div>
  );
}
