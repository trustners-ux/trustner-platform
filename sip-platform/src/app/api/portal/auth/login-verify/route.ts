/**
 * POST /api/portal/auth/login-verify
 * Body: { login_id, otp }
 *
 * Verify the 6-digit OTP, look up the portal_user, sign session,
 * Set-Cookie the client-portal-session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyPortalOtp, normMobileE164, normEmail } from '@/lib/portal/otp';
import {
  signClientPortalToken,
  CLIENT_PORTAL_COOKIE,
} from '@/lib/auth/client-portal-jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body { login_id?: string; otp?: string }

export async function POST(req: NextRequest) {
  let body: Body = {};
  try { body = (await req.json()) as Body; } catch {}
  const raw = body.login_id?.trim() || '';
  const otp = body.otp?.trim() || '';
  if (!raw || !otp) return NextResponse.json({ ok: false, reason: 'login_id and otp required' }, { status: 400 });
  if (!/^\d{6}$/.test(otp)) return NextResponse.json({ ok: false, reason: 'OTP must be 6 digits' }, { status: 400 });

  const looksEmail = raw.includes('@');
  const login_id = looksEmail ? normEmail(raw) : normMobileE164(raw);
  if (!login_id) return NextResponse.json({ ok: false, reason: 'Invalid login id' }, { status: 400 });

  const v = await verifyPortalOtp(login_id, 'login', otp);
  if (!v.ok) return NextResponse.json({ ok: false, reason: v.reason }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, reason: 'DB not configured' }, { status: 503 });

  const { data: pu } = await sb
    .from('portal_users')
    .select('id, client_id, login_mobile, login_email, status, clients!inner(id, code, display_name)')
    .eq(looksEmail ? 'login_email' : 'login_mobile', login_id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (!pu) return NextResponse.json({ ok: false, reason: 'No active portal account for that identifier.' }, { status: 404 });

  type PURow = {
    id: number;
    client_id: number;
    login_mobile: string | null;
    login_email: string | null;
    status: string;
    clients: { id: number; code: string; display_name: string };
  };
  const row = pu as unknown as PURow;

  await sb.from('portal_users').update({ last_login_at: new Date().toISOString() }).eq('id', row.id);

  const token = await signClientPortalToken({
    portalUserId: row.id,
    clientId: row.client_id,
    clientCode: row.clients.code,
    displayName: row.clients.display_name,
    loginMobile: row.login_mobile,
    loginEmail: row.login_email,
  });

  const res = NextResponse.json({ ok: true, redirect: '/portal/home' });
  res.cookies.set(CLIENT_PORTAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 14 * 24 * 60 * 60, // 14 days — matches the JWT expiry (audit P1)
  });
  return res;
}
