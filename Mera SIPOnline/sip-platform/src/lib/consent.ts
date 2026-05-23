/**
 * Consent management for DPDP Act 2023 compliance.
 *
 * Tracks user consent for analytics/tracking. Stored in localStorage.
 *
 * States:
 *   - 'granted'   — user explicitly accepted
 *   - 'denied'    — user explicitly declined
 *   - 'unknown'   — never asked (show banner)
 */

export type ConsentState = 'granted' | 'denied' | 'unknown';

const STORAGE_KEY = 'merasip_analytics_consent_v1';
const CONSENT_EVENT = 'merasip:consent-changed';

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'granted' || raw === 'denied') return raw;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export function setConsent(state: Exclude<ConsentState, 'unknown'>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, state);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  } catch {
    /* ignore */
  }
}

export function clearConsent() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Also clear all Google Analytics cookies set on this domain
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('_ga') || name.startsWith('_gid') || name.startsWith('_gat')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.merasip.com`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    }
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: 'unknown' }));
  } catch {
    /* ignore */
  }
}

export function onConsentChange(cb: (state: ConsentState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent).detail as ConsentState);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
