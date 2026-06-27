'use client';

import { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile widget (CAPTCHA). Renders NOTHING when
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not configured — so forms behave exactly
 * as before until keys are added (audit P1/P2). Pairs with the server-side
 * `verifyTurnstile()` in `lib/security/turnstile.ts`.
 *
 * Usage:
 *   const [token, setToken] = useState('');
 *   <TurnstileWidget onToken={setToken} />
 *   // include `token` (as e.g. `turnstileToken`) in the form POST body.
 */
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export function TurnstileWidget({
  onToken,
  className,
}: {
  onToken: (token: string) => void;
  className?: string;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let cancelled = false;

    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (window.turnstile) return resolve();
        if (!document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)) {
          const s = document.createElement('script');
          s.src = SCRIPT_SRC;
          s.async = true;
          s.defer = true;
          document.head.appendChild(s);
        }
        // Poll for readiness instead of relying on the script's `load` event:
        // when another widget already injected the script, its load event may
        // have fired before this listener could attach, leaving window.turnstile
        // present but render() never called (widget silently never appears).
        const startedAt = Date.now();
        const iv = setInterval(() => {
          if (window.turnstile) { clearInterval(iv); resolve(); }
          else if (Date.now() - startedAt > 15000) { clearInterval(iv); }
        }, 100);
      });

    ensureScript().then(() => {
      if (cancelled || !window.turnstile || !ref.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        'error-callback': () => onToken(''),
        'expired-callback': () => onToken(''),
      });
    });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* noop */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={ref} className={className} />;
}
