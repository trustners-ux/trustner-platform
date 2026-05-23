import { NextResponse } from 'next/server';
import { otpStore } from '@/lib/services/otp-store';
import {
  SUPER_ADMIN_EMAIL,
  isSuperAdmin,
} from '@/lib/admin/admin-user-store';

const OTP_KEY_EMAIL = 'admin-action-otp';

export async function POST(request: Request) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, targetEmail } = await request.json();

    if (!action || !['add', 'delete', 'reset'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be add, delete, or reset.' },
        { status: 400 }
      );
    }

    // Hard-block: super admin cannot be deleted at all
    if (action === 'delete' && targetEmail && isSuperAdmin(targetEmail)) {
      return NextResponse.json(
        { error: 'Super Admin account cannot be deleted. This action is permanently blocked.' },
        { status: 403 }
      );
    }

    // Rate limit: max 3 OTPs per 10-minute window
    if (otpStore.isRateLimited(OTP_KEY_EMAIL)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again after 10 minutes.' },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP for email
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const currentAttempts = otpStore.getAttempts(OTP_KEY_EMAIL);

    otpStore.set(OTP_KEY_EMAIL, {
      otp: emailOtp,
      email: SUPER_ADMIN_EMAIL,
      expiresAt: Date.now() + 300000, // 5 minutes
      attempts: currentAttempts + 1,
    });

    const actionLabel =
      action === 'add' ? 'Add New User' :
      action === 'delete' ? `Delete User (${targetEmail || 'unknown'})` :
      `Reset Password (${targetEmail || 'unknown'})`;

    // Send email OTP to super admin
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
            to: SUPER_ADMIN_EMAIL,
            subject: `Admin OTP: ${emailOtp} — ${actionLabel}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #1E3A5F, #0F2B47); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h2 style="color: #fff; margin: 0; font-size: 20px;">Trustner Admin</h2>
                  <p style="color: #93C5FD; margin: 6px 0 0; font-size: 13px;">User Management Verification</p>
                </div>
                <div style="background: #fff; padding: 30px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="color: #334155; font-size: 15px; margin: 0 0 8px;">
                    <strong>Action:</strong> ${actionLabel}
                  </p>
                  <p style="color: #334155; font-size: 15px; margin: 0 0 8px;">
                    <strong>Requested by:</strong> ${adminEmail}
                  </p>
                  <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">
                    Your verification code:
                  </p>
                  <div style="background: #EFF6FF; border: 2px solid #1E3A5F; border-radius: 8px; padding: 16px; text-align: center; margin: 0 0 20px;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1E3A5F;">${emailOtp}</span>
                  </div>
                  <p style="color: #64748B; font-size: 13px; margin: 0 0 8px;">
                    This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.
                  </p>
                  <p style="color: #94A3B8; font-size: 12px; margin: 0;">
                    If you did not request this action, please change your admin password immediately.
                  </p>
                  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0 16px;" />
                  <p style="color: #94A3B8; font-size: 11px; text-align: center; margin: 0;">
                    Trustner Asset Services Pvt. Ltd. | ARN-286886<br />
                    <a href="https://www.merasip.com/admin" style="color: #1E3A5F; text-decoration: none;">Admin Panel</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('[Admin OTP] Email send failed:', emailErr);
      }
    }

    // Log OTP in development for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Admin OTP] OTP sent for action: ${action}`);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to super admin email',
    });
  } catch (error) {
    console.error('[Admin OTP] Send error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
