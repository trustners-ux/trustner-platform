'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Handshake, Phone, Shield, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function PartnerLoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    // TODO: Integrate with actual OTP API
    setTimeout(() => {
      setStep('otp');
      setLoading(false);
    }, 1500);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    // TODO: Integrate with actual verify API
    setTimeout(() => {
      setLoading(false);
      setError('Partner portal is launching soon. You will be notified when it goes live.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to MeraSIP.com
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-amber-100/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-8 py-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Handshake className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">Partner Portal</h1>
            <p className="text-amber-100 text-sm mt-1">POSP | Sub-Broker | Referral Partner</p>
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

            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">+91</div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        setError('');
                      }}
                      placeholder="Enter 10-digit number"
                      className="w-full pl-[4.5rem] pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10}
                  className="w-full py-3 rounded-lg text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Send OTP
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="text-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    OTP sent to <span className="font-semibold">+91 {phone}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                    className="text-xs text-amber-600 hover:underline mt-1"
                  >
                    Change number
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    placeholder="6-digit OTP"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm text-center tracking-[0.5em] font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    autoFocus
                    maxLength={6}
                  />
                </div>

                {error && (
                  <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 rounded-lg text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
              </form>
            )}

            {/* Info */}
            <div className="mt-6 p-4 bg-amber-50/50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-800 font-medium mb-1">For registered partners only</p>
              <p className="text-[11px] text-amber-600 leading-relaxed">
                If you are a POSP, Sub-broker, or Referral partner with Trustner, use your registered mobile number to login.
                For new partner registration, contact your relationship manager.
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Want to become a partner?{' '}
                <Link href="/contact" className="text-amber-600 hover:underline font-medium">
                  Contact Us
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Trustner Asset Services Pvt Ltd | AMFI ARN-286886 | IRDAI Licensed
        </p>
      </div>
    </div>
  );
}
