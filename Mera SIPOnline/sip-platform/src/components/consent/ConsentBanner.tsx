'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConsent, setConsent, onConsentChange, type ConsentState } from '@/lib/consent';

/**
 * Cookie / Analytics consent banner — DPDP Act 2023 compliant.
 *
 * Shows at the bottom of every page until the user explicitly accepts or declines.
 * Respects user choice (stored in localStorage) and can be re-opened via the footer
 * "Manage Preferences" link.
 */
export function ConsentBanner() {
  const [consent, setConsentVisibility] = useState<ConsentState>('unknown');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsentVisibility(getConsent());
    const unsub = onConsentChange(setConsentVisibility);
    return unsub;
  }, []);

  // Don't render on server or before consent state is known
  if (!mounted) return null;
  if (consent !== 'unknown') return null;

  const handleAccept = () => setConsent('granted');
  const handleDecline = () => setConsent('denied');

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie and Analytics Consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-neutral-200 bg-white shadow-2xl"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:py-5">
        <div className="flex-1 text-sm text-neutral-700">
          <p className="mb-1 font-semibold text-neutral-900">
            We value your privacy
          </p>
          <p className="leading-relaxed">
            We use cookies and analytics (Google Analytics with IP anonymization) to understand how
            visitors use our site and improve your experience. No data is used for advertising.
            You can accept, decline, or learn more in our{' '}
            <Link
              href="/privacy"
              className="font-medium text-brand-600 underline hover:text-brand-700"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-shrink-0 gap-2 md:gap-3">
          <button
            onClick={handleDecline}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:bg-neutral-50 md:px-5"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 md:px-5"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
