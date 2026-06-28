'use client';

import { useEffect } from 'react';

/**
 * Registers the MeraSIP service worker so the site is installable as an app
 * ("Add to Home Screen"). Production-only. Renders nothing.
 *
 * ⚠️ DO NOT re-add a `controllerchange` → `window.location.reload()` here.
 * It caused an INFINITE reload loop in Safari (Jun 2026): Safari re-activates
 * and re-claims the service worker on most page loads, firing `controllerchange`
 * every time → reload → the fresh page re-claims → fires again → reload, about
 * once per second. The per-load guards can't stop it because they reset on each
 * reload. Chrome never re-fires the event for an unchanged SW, so it looked fine
 * there — which is exactly why the symptom was Safari-only.
 *
 * There is nothing to reload FOR: the v2 service worker caches no scripts or
 * data (it's a network-first pass-through), so a page can never be stuck on a
 * stale build. Registration alone is all we need for installability.
 */
export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* installability is best-effort — never block the page on it */
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
