"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, ShieldCheck, X } from "lucide-react";

const CONSENT_KEY = "trustner-consent";

export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if consent hasn't been given
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on mount
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="rounded-2xl border border-blue-200 bg-white/95 p-5 shadow-2xl backdrop-blur-sm">
          {/* Close button */}
          <button
            onClick={handleAccept}
            className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="hidden flex-shrink-0 rounded-xl bg-blue-50 p-3 sm:block">
              <ShieldCheck size={28} className="text-blue-600" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">
                Your Financial Data is Safe
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Your financial data stays on your device by default — no
                registration needed. When you create an account, your data is{" "}
                <span className="font-semibold text-gray-800">
                  encrypted and stored securely
                </span>{" "}
                to enable PDF reports and multi-device access. We never share
                your data with third parties.
              </p>

              {/* Trust badges */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <Lock size={10} />
                  256-bit Encryption
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                  <ShieldCheck size={10} />
                  DPDPA Compliant
                </span>
                <Link
                  href="/privacy-policy"
                  className="text-[10px] font-semibold text-blue-600 underline underline-offset-2 transition hover:text-blue-800"
                >
                  Privacy Policy
                </Link>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleAccept}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:shadow-md"
                >
                  I Understand, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
