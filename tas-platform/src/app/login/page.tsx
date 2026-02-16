import { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, Phone, Mail, ArrowRight, Shield } from "lucide-react";
import { REGULATORY } from "@/lib/constants/regulatory";

export const metadata: Metadata = {
  title: "Login - Access Your Trustner Account",
  description: "Login to your Trustner account. View portfolio, track investments, manage insurance policies.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-surface-100 to-primary-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary">
              <TrendingUp size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Welcome to Trustner</h1>
            <p className="text-sm text-gray-500">Login to manage your investments & insurance</p>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Mobile Number</label>
              <div className="flex rounded-xl border border-gray-200 bg-gray-50 transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-50">
                <span className="flex items-center border-r border-gray-200 px-3 text-sm text-gray-500">+91</span>
                <input type="tel" placeholder="Enter your mobile number" maxLength={10} className="flex-1 bg-transparent px-4 py-3 text-sm outline-none" />
              </div>
            </div>

            <button className="w-full rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600">
              Send OTP
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">Or continue with</span></div>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
              <Mail size={16} /> Login with Email
            </button>
          </div>

          {/* KYC Notice */}
          <div className="mt-6 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
            <div className="flex items-start gap-2">
              <Shield size={14} className="mt-0.5 flex-shrink-0" />
              <p>{REGULATORY.KYC_NOTICE.substring(0, 120)}...</p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-primary-500 hover:underline">Terms</Link>{" "}
            &{" "}
            <Link href="/privacy-policy" className="text-primary-500 hover:underline">Privacy Policy</Link>
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          {REGULATORY.AMFI_ARN} | {REGULATORY.MF_ENTITY}
        </p>
      </div>
    </div>
  );
}
