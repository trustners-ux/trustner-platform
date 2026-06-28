/**
 * POST /api/portal/auth/claim
 * Body: { token, channel, otp, pin?, password? }
 *
 * Verifies the OTP, claims the invite, creates the portal_user, signs
 * the session, and returns Set-Cookie for the client-portal-session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { lookupInvite, claimInvite } from '@/lib/portal/claim';
import { verifyPortalOtp, normMobileE164, normEmail } from '@/lib/portal/otp';
import { CLIENT_PORTAL_COOKIE } from '@/lib/auth/client-portal-jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  token?: string;
  channel?: 'mobile' | 'email';
  otp?: string;
  pin?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  let body: Body = {};
  try { body = (await req.json()) as Body; } catch { /* empty */ }
  const token = body.token?.trim();
  const channel = body.channel;
  const otp = body.otp?.trim();
  if (!token || !channel || !otp) {
    return NextResponse.json({ ok: false, reason: 'token, channel, otp required' }, { status: 400 });
  }
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ ok: false, reason: 'OTP must be 6 digits' }, { status: 400 });
  }
  if (body.pin && !/^\d{4}$/.test(body.pin)) {
    return NextResponse.json({ ok: false, reason: 'PIN must be 4 digits' }, { status: 400 });
  }
  if (body.password && body.password.length < 8) {
    return NextResponse.json({ ok: false, reason: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const r = await lookupInvite(token);
  if (!r.ok) return NextResponse.json(r, { status: 400 });

  const login_id = channel === 'mobile'
    ? (r.client.mobile_primary ? normMobileE164(r.client.mobile_primary) : null)
    : (r.client.email_primary ? normEmail(r.client.email_primary) : null);
  if (!login_id) {
    return NextResponse.json({ ok: false, reason: `Client has no ${channel} on file` }, { status: 400 });
  }

  const v = await verifyPortalOtp(login_id, 'claim', otp);
  if (!v.ok) return NextResponse.json({ ok: false, reason: v.reason }, { status: 400 });

  const claim = await claimInvite({
    invite_id: r.invite_id,
    client_id: r.client.id,
    client_code: r.client.code,
    display_name: r.client.display_name,
    login_mobile: channel === 'mobile' ? login_id : null,
    login_email: channel === 'email' ? login_id : null,
    pin: body.pin,
    password: body.password,
  });
  if (!claim.ok) return NextResponse.json(claim, { status: 400 });

  const res = NextResponse.json({
    ok: true,
    portal_user_id: claim.portal_user_id,
    redirect: '/portal/home',
  });
  res.cookies.set(CLIENT_PORTAL_COOKIE, claim.session_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 14 * 24 * 60 * 60, // 14 days — matches the JWT expiry (audit P1)
  });
  return res;
}
