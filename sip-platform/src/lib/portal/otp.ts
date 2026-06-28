/**
 * Client-portal OTP utilities.
 *
 *   - generate, store, verify 6-digit OTPs
 *   - dispatch over WhatsApp (mobile) or Resend (email)
 *
 * OTPs land in the portal_otps table (migration 029). Tied to a
 * login_id (mobile in E.164 or email lowercase) + a purpose
 * ('claim' / 'login' / 'reset'). 5-min default expiry. Max 6 verify
 * attempts before the OTP is invalidated.
 */

import { randomInt } from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { sendOtpViaWhatsApp } from '@/lib/messaging/whatsapp';

export const OTP_TTL_SECONDS = 300; // 5 min
export const MAX_OTP_ATTEMPTS = 6;

export type OtpPurpose = 'claim' | 'login' | 'reset';

function generate6Digit(): string {
  // CSPRNG (audit P1-1) — an OTP is an auth credential, never use Math.random.
  // randomInt is uniform over [100000, 1000000) → 6 digits, never leading zero.
  return String(randomInt(100000, 1000000));
}

/** Normalize a mobile number into E.164 (defaults to India). */
export function normMobileE164(raw: string): string | null {
  if (!raw) return null;
  let s = raw.replace(/[^\d+]/g, '');
  if (s.startsWith('+')) {
    return /^\+[1-9]\d{6,14}$/.test(s) ? s : null;
  }
  // Strip 00 international prefix
  if (s.startsWith('00')) s = s.slice(2);
  // Strip leading 0
  if (/^0\d{10}$/.test(s)) s = s.slice(1);
  // Strip 91 if already prefixed without +
  if (/^91[6-9]\d{9}$/.test(s)) return '+' + s;
  if (/^[6-9]\d{9}$/.test(s)) return '+91' + s;
  if (/^[1-9]\d{9,14}$/.test(s)) return '+' + s;
  return null;
}

/** Lowercase + trim email for canonical comparison. */
export function normEmail(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

/**
 * Create + store a new OTP. Invalidates any prior unconsumed OTP for
 * the same (login_id, purpose) pair.
 */
export async function createPortalOtp(login_id: string, purpose: OtpPurpose): Promise<string> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  // Mark prior unconsumed OTPs as consumed (atomically retire them)
  await sb
    .from('portal_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('login_id', login_id)
    .eq('purpose', purpose)
    .is('consumed_at', null);

  const code = generate6Digit();
  const expires_at = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();
  const { error } = await sb.from('portal_otps').insert({
    login_id,
    code,
    purpose,
    expires_at,
    attempts: 0,
  });
  if (error) throw new Error(`OTP insert failed: ${error.message}`);
  return code;
}

/**
 * Verify a 6-digit OTP. Returns true if it matches an active row and
 * marks it consumed. Increments attempt counter on miss; once attempts
 * reach MAX_OTP_ATTEMPTS, the row is force-consumed (no further tries).
 */
export async function verifyPortalOtp(
  login_id: string,
  purpose: OtpPurpose,
  code: string,
): Promise<{ ok: boolean; reason?: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase not configured');

  const { data: rows, error } = await sb
    .from('portal_otps')
    .select('id, code, attempts, expires_at, consumed_at')
    .eq('login_id', login_id)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .order('id', { ascending: false })
    .limit(1);
  if (error) return { ok: false, reason: error.message };

  const row = rows?.[0] as { id: number; code: string; attempts: number; expires_at: string; consumed_at: string | null } | undefined;
  if (!row) return { ok: false, reason: 'No active OTP — request a new one.' };
  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, reason: 'OTP expired — request a new one.' };
  }

  if (row.code !== code.trim()) {
    const newAttempts = row.attempts + 1;
    const force_consume = newAttempts >= MAX_OTP_ATTEMPTS;
    await sb
      .from('portal_otps')
      .update({
        attempts: newAttempts,
        consumed_at: force_consume ? new Date().toISOString() : null,
      })
      .eq('id', row.id);
    return {
      ok: false,
      reason: force_consume
        ? 'Too many wrong attempts — request a new OTP.'
        : `Wrong OTP — ${MAX_OTP_ATTEMPTS - newAttempts} attempts left.`,
    };
  }

  // Match. Consume.
  await sb
    .from('portal_otps')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id);
  return { ok: true };
}

// ── Dispatch ────────────────────────────────────────────────────────────────

const RESEND_API = 'https://api.resend.com/emails';

export async function sendPortalOtp(login_id: string, code: string, purpose: OtpPurpose): Promise<{ delivered: boolean; channel: 'whatsapp' | 'email' | 'none'; error?: string }> {
  // login_id starting with '+' = mobile, else email
  if (login_id.startsWith('+')) {
    try {
      const ok = await sendOtpViaWhatsApp(login_id.slice(1), code); // sendOtpViaWhatsApp wants without '+'
      return { delivered: ok, channel: 'whatsapp' };
    } catch (err) {
      return { delivered: false, channel: 'whatsapp', error: err instanceof Error ? err.message : 'send failed' };
    }
  }
  // Email path
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Trustner Portal <noreply@merasip.com>';
    if (!apiKey) return { delivered: false, channel: 'email', error: 'RESEND_API_KEY not configured' };

    const subject = purpose === 'claim'
      ? 'Your Trustner portal verification code'
      : 'Your Trustner login code';

    const r = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [login_id],
        subject,
        html: `
          <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#0A1628;font-size:20px;margin:0 0 12px">Your verification code</h2>
            <p style="font-size:13px;color:#475569;margin:0 0 16px;line-height:1.5">
              Use this 6-digit code to ${purpose === 'claim' ? 'claim your Trustner portal account' : 'sign in to your Trustner portal'}.
              It expires in 5 minutes.
            </p>
            <div style="font-size:28px;font-weight:800;letter-spacing:8px;background:#F1F5F9;border-radius:10px;padding:18px;text-align:center;color:#0A1628;font-family:ui-monospace,monospace">
              ${code}
            </div>
            <p style="font-size:11px;color:#94A3B8;margin-top:18px;line-height:1.5">
              Trustner Asset Services Pvt Ltd · ARN-286886 · AMFI registered Mutual Fund Distributor.
              If you didn&apos;t request this code, ignore this email.
            </p>
          </div>
        `,
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      return { delivered: false, channel: 'email', error: `Resend HTTP ${r.status}: ${t.slice(0, 200)}` };
    }
    return { delivered: true, channel: 'email' };
  } catch (err) {
    return { delivered: false, channel: 'email', error: err instanceof Error ? err.message : 'send failed' };
  }
}
