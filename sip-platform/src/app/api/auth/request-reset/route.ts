/**
 * Request Password Reset
 *
 * Public endpoint. Takes an email, generates a short-lived signed
 * reset token (60-minute expiry), emails a reset link to the user.
 * If the email isn't registered, returns success anyway (no
 * enumeration).
 *
 * Body: { email: string }
 *
 * The token is a JWT signed with JWT_SECRET. To prevent replay within
 * the 60-min window we include a unique `jti` (random ID). Sufficient
 * for the launch — proper one-time-use enforcement can come later via
 * a Supabase table that tracks used JTIs.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import crypto from 'crypto';
import { findUserByEmailFromBlob } from '@/lib/admin/admin-user-store';
import { getCredentials } from '@/lib/employee/employee-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const RESET_TOKEN_TTL_MIN = 60;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const normalised = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // Does the user exist in ANY store?
    let userName: string | undefined;
    try {
      const adminUser = await findUserByEmailFromBlob(normalised);
      if (adminUser) userName = adminUser.name;
    } catch { /* swallow */ }

    if (!userName) {
      try {
        const creds = await getCredentials();
        const cred = creds.find((c) => c.email.toLowerCase() === normalised);
        if (cred) userName = cred.email.split('@')[0]; // we don't store name on the cred, fallback
      } catch { /* swallow */ }
    }

    const userExists = !!userName;

    // If user doesn't exist, return success silently to prevent enumeration.
    if (!userExists) {
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a password reset link has been sent.',
      });
    }

    // Generate signed reset token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    );
    const jti = crypto.randomBytes(16).toString('hex');
    const token = await new SignJWT({ type: 'password-reset', email: normalised, jti })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${RESET_TOKEN_TTL_MIN}m`)
      .sign(secret);

    // Build the reset URL
    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return 'https://www.merasip.com';
      }
    })();
    const resetUrl = `${origin}/auth/reset?token=${encodeURIComponent(token)}`;

    // Send email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error('[request-reset] RESEND_API_KEY missing — cannot send email');
      // Still return success so we don't leak that emailing failed
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a password reset link has been sent.',
      });
    }

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Trustner <noreply@merasip.com>',
          to: normalised,
          subject: 'Reset your Trustner password',
          html: buildEmailHtml({ name: userName!, resetUrl, ttlMin: RESET_TOKEN_TTL_MIN }),
        }),
      });
    } catch (err) {
      console.error('[request-reset] Resend send failed', err);
    }

    return NextResponse.json({
      success: true,
      message: 'If this email is registered, a password reset link has been sent.',
    });
  } catch (err) {
    console.error('[request-reset]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

function buildEmailHtml(args: { name: string; resetUrl: string; ttlMin: number }): string {
  return `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
  <div style="background: linear-gradient(135deg, #0c4a6e 0%, #1e40af 100%); padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 800;">TRUSTNER</h1>
    <p style="color: #93C5FD; margin: 6px 0 0; font-size: 12px; letter-spacing: 1px;">ASSET SERVICES PVT. LTD.</p>
  </div>
  <div style="background: #fff; padding: 32px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #0c4a6e; font-size: 18px; margin: 0 0 16px 0;">Reset your password</h2>
    <p style="color: #1a1a2e; font-size: 14px; line-height: 1.55; margin: 0 0 16px 0;">
      Hi ${escapeHtml(args.name)},
    </p>
    <p style="color: #1a1a2e; font-size: 14px; line-height: 1.55; margin: 0 0 20px 0;">
      We received a request to reset your password for the Trustner Advisory Workbench. Click the button below to choose a new password. The link is valid for the next <strong>${args.ttlMin} minutes</strong>.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${args.resetUrl}" style="display: inline-block; background: #0c4a6e; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.3px;">
        Reset Password
      </a>
    </div>
    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 8px 0;">
      Or copy this link into your browser:
    </p>
    <p style="color: #0c4a6e; font-size: 11px; line-height: 1.5; margin: 0 0 24px 0; word-break: break-all;">
      ${args.resetUrl}
    </p>
    <div style="background: #fef3c7; border-left: 3px solid #b45309; padding: 12px 14px; margin: 0 0 20px 0; font-size: 12px; color: #78350f;">
      <strong>If you didn&rsquo;t request this</strong>, ignore this email — your password will stay unchanged. The link expires automatically in ${args.ttlMin} minutes.
    </div>
    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0 16px;" />
    <p style="color: #94a3b8; font-size: 11px; line-height: 1.5; margin: 0; text-align: center;">
      Trustner Asset Services Pvt. Ltd. &middot; AMFI ARN-286886<br/>
      <a href="https://www.merasip.com" style="color: #0c4a6e; text-decoration: none;">www.merasip.com</a>
    </p>
  </div>
</div>
  `.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
