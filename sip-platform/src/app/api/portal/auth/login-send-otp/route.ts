/**
 * POST /api/portal/auth/login-send-otp
 * Body: { login_id: string }
 *
 * Send a 6-digit OTP to a registered portal user. login_id can be:
 *   - a mobile (any common format; we normalize to E.164)
 *   - an email
 * If no matching portal_user exists, returns ok=true anyway (to avoid
 * leaking which numbers/emails are registered) but does nothing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { createPortalOtp, sendPortalOtp, normMobileE164, normEmail } from '@/lib/portal/otp';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// OTP send-side throttle (audit P1-2) — caps WhatsApp/email cost-bombs and
// enumeration. Per-recipient is the tight limit; per-IP is the global ceiling.
const idLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 3 });
const ipLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 12 });

interface Body { login_id?: string }

export async function POST(req: NextRequest) {
  let body: Body = {};
  try { body = (await req.json()) as Body; } catch {}
  const raw = body.login_id?.trim() || '';
  if (!raw) return NextResponse.json({ ok: false, reason: 'login_id required' }, { status: 400 });

  // Decide if it's a mobile or email
  const looksEmail = raw.includes('@');
  const login_id = looksEmail ? normEmail(raw) : normMobileE164(raw);
  if (!login_id) {
    return NextResponse.json({ ok: false, reason: looksEmail ? 'Email looks invalid' : 'Mobile looks invalid' }, { status: 400 });
  }

  // Throttle BEFORE any DB/send work, equally for registered + unregistered ids.
  const ipCheck = ipLimiter.check(`otp:login:ip:${clientIp(req)}`);
  const idCheck = idLimiter.check(`otp:login:id:${login_id}`);
  if (!ipCheck.ok || !idCheck.ok) {
    return NextResponse.json(
      { ok: false, reason: 'Too many OTP requests. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(ipCheck.retryAfter, idCheck.retryAfter)) } }
    );
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, reason: 'DB not configured' }, { status: 503 });

  // Look up the portal user
  const { data: pu } = await sb
    .from('portal_users')
    .select('id')
    .eq(looksEmail ? 'login_email' : 'login_mobile', login_id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!pu) {
    // Pretend we sent — don't reveal that this id isn't registered.
    return NextResponse.json({ ok: true, channel: looksEmail ? 'email' : 'whatsapp', login_id_masked: looksEmail ? login_id.replace(/^(.{2})[^@]*/, '$1***') : login_id.replace(/^(\+\d{2})\d{6}/, '$1XXXXXX'), demo: true });
  }

  try {
    const code = await createPortalOtp(login_id, 'login');
    const send = await sendPortalOtp(login_id, code, 'login');
    if (!send.delivered) return NextResponse.json({ ok: false, reason: send.error || 'send failed' }, { status: 500 });
    return NextResponse.json({
      ok: true,
      channel: send.channel,
      login_id_masked: looksEmail ? login_id.replace(/^(.{2})[^@]*/, '$1***') : login_id.replace(/^(\+\d{2})\d{6}/, '$1XXXXXX'),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, reason: err instanceof Error ? err.message : 'OTP failed' }, { status: 500 });
  }
}
