'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Briefcase, User, Hash, ArrowLeft, Loader2, Shield, Eye, EyeOff } from 'lucide-react';

export default function RMLoginPage() {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode) {
      setError('Please enter your employee code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rm/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode: employeeCode.toUpperCase(), phone, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Redirect to RM dashboard
      router.push('/rm');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to MeraSIP.com
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">Employee Portal</h1>
            <p className="text-emerald-100 text-sm mt-1">MIS &amp; Incentive Dashboard</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/Trustner Logo-blue.png"
                alt="Trustner"
                width={120}
                height={60}
                className="h-8 w-auto object-contain"
              />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Employee Code
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => {
                      setEmployeeCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    placeholder="e.g. TIB006"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Registered Phone (optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  PIN
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="4-6 digit PIN"
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg text-sm tracking-[0.3em] font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !employeeCode}
                className="w-full py-3 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4" />
                    Sign In to MIS
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <p className="text-xs text-emerald-800 font-medium mb-1">Demo Mode Active</p>
              <p className="text-[11px] text-emerald-600 leading-relaxed">
                Enter any employee code (e.g. TIB006, TAS003, TIB005) to login and explore the dashboard. PIN verification will be enabled when the database is connected.
              </p>
            </div>

            <p className="text-center text-[11px] text-slate-400 mt-4">
              Forgot your PIN?{' '}
              <span className="text-emerald-600 font-medium">Contact HR or your manager</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Trustner Asset Services Pvt Ltd &amp; Trustner Insurance Brokers Pvt Ltd
        </p>
      </div>
    </div>
  );
}
