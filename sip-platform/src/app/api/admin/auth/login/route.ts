import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmailFromBlob } from '@/lib/admin/admin-user-store';
import { signToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { writeAuditLog } from '@/lib/dal/audit';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

// Brute-force / credential-stuffing defence (audit P0-3). Only FAILED attempts
// are counted, so a legitimate user who mistypes a few times is never locked
// out by a successful login. Best-effort (per-region) — upgrade to Vercel KV
// for cross-region durability.
const ipLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const emailLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8 });

// Auth routes MUST always be dynamic + Node runtime + zero caching.
// Without these, Vercel may reuse cached serverless bundles or stale blob
// reads, causing password changes not to take effect for hours/days.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const ip = clientIp(request);
    const normalisedEmail = String(email).trim().toLowerCase();
    const ipKey = `login:admin:ip:${ip}`;
    const emailKey = `login:admin:email:${normalisedEmail}`;
    // Gate on recent FAILED attempts (peek = no increment here).
    if (ipLimiter.peek(ipKey).remaining <= 0 || emailLimiter.peek(emailKey).remaining <= 0) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }
    const noteFailure = () => { ipLimiter.check(ipKey); emailLimiter.check(emailKey); };

    const user = await findUserByEmailFromBlob(email);
    if (!user) {
      noteFailure();
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      noteFailure();
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: { email: user.email, name: user.name, role: user.role },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Audit log — SEBI/IRDAI compliance
    await writeAuditLog({
      tableName: 'users',
      action: 'LOGIN',
      changedBy: user.email,
      newValues: { loginType: 'admin', role: user.role },
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
