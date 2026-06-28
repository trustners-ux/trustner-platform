import { NextResponse } from 'next/server';
import {
  findUserByEmailFromBlob,
  generateSecurePassword,
  resetUserPassword,
  SUPER_ADMIN_EMAIL,
} from '@/lib/admin/admin-user-store';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

// Auth routes: always dynamic, Node runtime, zero caching.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// Rate limits — defence against lockout-spam (an attacker repeatedly resetting
// a real admin's password to lock them out, or to flood their inbox).
// Per-IP:    5 requests / hour
// Per-email: 3 requests / hour (i.e. even from rotating IPs an admin can only
//            be locked out 3x/hour at worst)
const ipLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });
const emailLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 3 });

/**
 * Forgot Password — Self-service password reset.
 *
 * SECURITY: This is a PUBLIC unauthenticated POST. To prevent abuse:
 *   1. Per-IP + per-email rate limit (above).
 *   2. We always return the same generic success response — never reveal
 *      whether the email is registered.
 *   3. A copy of every reset is sent to SUPER_ADMIN_EMAIL so unauthorized
 *      activity is visible.
 *
 * TODO (next sprint): replace push-password flow with signed time-limited
 * reset link + super-admin approval gate, matching the employee reset flow.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Apply IP + email rate limits BEFORE doing any work. Same generic 429
    // response for either limit so the attacker can't distinguish.
    const ip = clientIp(request);
    const normalisedEmail = String(email).trim().toLowerCase();
    const ipCheck = ipLimiter.check(`fp:ip:${ip}`);
    const emailCheck = emailLimiter.check(`fp:email:${normalisedEmail}`);
    if (!ipCheck.ok || !emailCheck.ok) {
      const retryAfter = Math.max(ipCheck.retryAfter, emailCheck.retryAfter);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // Check if user exists (don't reveal this to prevent enumeration)
    const user = await findUserByEmailFromBlob(email);
    if (!user) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a password reset link has been sent.',
      });
    }

    // Generate new password and update
    const newPassword = generateSecurePassword();
    await resetUserPassword(email, newPassword);

    // Send new password to the user's own email
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Mera SIP Online <noreply@merasip.com>',
            to: email,
            subject: 'Your Trustner Admin Password Has Been Reset',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1E3A5F, #0F2B47); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h2 style="color: #fff; margin: 0; font-size: 20px;">Trustner Admin</h2>
                  <p style="color: #93C5FD; margin: 6px 0 0; font-size: 13px;">Password Reset</p>
                </div>
                <div style="background: #fff; padding: 30px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">
                    Hi ${user.name}, your admin panel password has been reset.
                  </p>
                  <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
                    <p style="color: #64748B; font-size: 13px; margin: 0 0 8px;"><strong>New Password:</strong></p>
                    <code style="font-size: 16px; font-weight: 700; color: #1E3A5F; letter-spacing: 1px;">${newPassword}</code>
                  </div>
                  <p style="color: #EF4444; font-size: 13px; font-weight: 600; margin: 0 0 12px;">
                    Please change this password after logging in.
                  </p>
                  <a href="https://www.merasip.com/admin/login" style="display: inline-block; background: #1E3A5F; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
                    Login Now
                  </a>
                  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0 16px;" />
                  <p style="color: #94A3B8; font-size: 11px; text-align: center; margin: 0;">
                    Trustner Asset Services Pvt. Ltd. | ARN-286886
                  </p>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('[Forgot Password] Email send failed:', emailErr);
      }

      // Also notify super admin about the password reset
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Mera SIP Online <noreply@merasip.com>',
            to: SUPER_ADMIN_EMAIL,
            subject: `Password Reset: ${user.name} (${email})`,
            html: `
              <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <div style="background: #fff; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px;">
                  <p style="color: #334155; font-size: 15px; margin: 0 0 8px;"><strong>Self-Service Password Reset</strong></p>
                  <p style="color: #64748B; font-size: 13px; margin: 0 0 4px;">User: ${user.name} (${email})</p>
                  <p style="color: #64748B; font-size: 13px; margin: 0;">Role: ${user.role}</p>
                  <p style="color: #94A3B8; font-size: 12px; margin: 12px 0 0;">This user used the "Forgot Password" option on the login page. A new password was sent to their registered email.</p>
                </div>
              </div>
            `,
          }),
        });
      } catch (notifyErr) {
        console.error('[Forgot Password] Super admin notification failed:', notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'If this email is registered, a new password has been sent to it.',
    });
  } catch (error) {
    console.error('[Forgot Password] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
