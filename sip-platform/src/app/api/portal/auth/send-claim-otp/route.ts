/**
 * POST /api/portal/auth/send-claim-otp
 * Body: { token: string, channel: 'mobile' | 'email' }
 *
 * Validates the invite token, looks up the client's mobile/email,
 * generates a 6-digit OTP, sends it over WhatsApp (mobile) or
 * Resend (email). Returns the masked target + 'ok'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { lookupInvite } from '@/lib/portal/claim';
import { createPortalOtp, sendPortalOtp, normMobileE164, normEmail } from '@/lib/portal/otp';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// OTP send-side throttle (audit P1-2) — per-invite-token + per-IP.
const tokenLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });
const ipLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 12 });

interface Body { token?: string; channel?: 'mobile' | 'email' }

export async function POST(req: NextRequest) {
  let body: Body = {};
  try { body = (await req.json()) as Body; } catch { /* empty */ }
  const token = body.token?.trim();
  const channel = body.channel;
  if (!token) return NextResponse.json({ ok: false, reason: 'token required' }, { status: 400 });
  if (channel !== 'mobile' && channel !== 'email') {
    return NextResponse.json({ ok: false, reason: 'channel must be "mobile" or "email"' }, { status: 400 });
  }

  const ipCheck = ipLimiter.check(`otp:claim:ip:${clientIp(req)}`);
  const tokenCheck = tokenLimiter.check(`otp:claim:tok:${token}`);
  if (!ipCheck.ok || !tokenCheck.ok) {
    return NextResponse.json(
      { ok: false, reason: 'Too many OTP requests. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(ipCheck.retryAfter, tokenCheck.retryAfter)) } }
    );
  }

  const r = await lookupInvite(token);
  if (!r.ok) return NextResponse.json(r, { status: 400 });

  const login_id = channel === 'mobile'
    ? (r.client.mobile_primary ? normMobileE164(r.client.mobile_primary) : null)
    : (r.client.email_primary ? normEmail(r.client.email_primary) : null);
  if (!login_id) {
    return NextResponse.json({ ok: false, reason: `Client has no ${channel} on file` }, { status: 400 });
  }

  try {
    const code = await createPortalOtp(login_id, 'claim');
    const send = await sendPortalOtp(login_id, code, 'claim');
    if (!send.delivered) {
      return NextResponse.json({ ok: false, reason: send.error || 'Send failed' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, channel: send.channel, login_id_masked: login_id.startsWith('+') ? login_id.replace(/^(\+\d{2})\d{6}/, '$1XXXXXX') : login_id.replace(/^(.{2})[^@]*/, '$1***') });
  } catch (err) {
    console.error('[SendClaimOtp]', err);
    return NextResponse.json({ ok: false, reason: 'OTP send failed' }, { status: 500 });
  }
}
