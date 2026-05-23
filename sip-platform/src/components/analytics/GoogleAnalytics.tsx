'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { getConsent, onConsentChange, type ConsentState } from '@/lib/consent';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 — DPDP-compliant gated loader.
 *
 * Only loads after user grants explicit consent via the ConsentBanner.
 * All privacy-preserving flags are set:
 *   - anonymize_ip: strips the last octet of IPv4 / last 80 bits of IPv6
 *   - allow_google_signals: disables cross-device, demographics, ads integration
 *   - allow_ad_personalization_signals: disables ad targeting signals
 *   - Consent Mode v2: denied by default until user accepts
 */
export function GoogleAnalytics() {
  const [consent, setConsentState] = useState<ConsentState>('unknown');

  useEffect(() => {
    setConsentState(getConsent());
    const unsub = onConsentChange(setConsentState);
    return unsub;
  }, []);

  if (!GA_ID) return null;
  if (consent !== 'granted') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'granted'
          });
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            page_title: document.title,
            send_page_view: true,
          });
        `}
      </Script>
    </>
  );
}
