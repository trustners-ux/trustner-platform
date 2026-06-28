import { NextResponse } from 'next/server';
import { CLIENT_PORTAL_COOKIE } from '@/lib/auth/client-portal-jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true, redirect: '/portal/login' });
  res.cookies.set(CLIENT_PORTAL_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
