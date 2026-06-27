/**
 * Cloudflare Turnstile (CAPTCHA) — server-side verification.
 *
 * Audit P1/P2 — bot defence on public forms (lead capture, OTP send, report
 * generation, onboarding upload) on top of rate-limiting.
 *
 * Designed to be 100% SAFE TO DEPLOY BEFORE KEYS EXIST: when
 * `TURNSTILE_SECRET_KEY` is not set, verification is a NO-OP (returns ok), so
 * every form keeps working exactly as before. It only starts enforcing once
 * BOTH keys are configured:
 *   - server:  TURNSTILE_SECRET_KEY            (this file)
 *   - client:  NEXT_PUBLIC_TURNSTILE_SITE_KEY  (TurnstileWidget.tsx)
 * ⚠️ Set BOTH together. Setting only the secret (without the public site key)
 * would block real users, since the client wouldn't render the widget.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** True only when the server secret is configured (i.e. CAPTCHA is live). */
export function turnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export interface TurnstileResult {
  ok: boolean;
  reason?: 'not-configured' | 'missing-token' | 'failed' | 'network-error';
}

/**
 * Verify a Turnstile token from a form submission.
 * - Not configured → { ok: true } (no-op; never blocks).
 * - Configured + no token → { ok: false, reason: 'missing-token' }.
 * - Configured + Cloudflare rejects → { ok: false, reason: 'failed' }.
 * - Configured + the verify call itself errors (Cloudflare down) → { ok: true }
 *   (fail OPEN on transient errors so a CF outage can't take our forms down;
 *   rate-limiting still bounds abuse in that window).
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, reason: 'not-configured' };
  if (!token) return { ok: false, reason: 'missing-token' };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as { success: boolean };
    return data.success ? { ok: true } : { ok: false, reason: 'failed' };
  } catch {
    // Transient Cloudflare/network error — don't take the form down over it.
    return { ok: true, reason: 'network-error' };
  }
}
