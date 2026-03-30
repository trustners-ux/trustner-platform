import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  resetUserPassword,
  generateSecurePassword,
  canResetPasswords,
} from '@/lib/admin/admin-user-store';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');

export async function POST(request: Request) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Ram & Sangeeta can reset passwords
    if (!canResetPasswords(adminEmail)) {
      return NextResponse.json(
        { error: 'You do not have permission to reset passwords. Only authorized admins can perform this action.' },
        { status: 403 }
      );
    }

    const { email, actionToken } = await request.json();

    // Validate action token
    if (!actionToken) {
      return NextResponse.json(
        { error: 'OTP verification required' },
        { status: 403 }
      );
    }

    try {
      const { payload } = await jwtVerify(actionToken, getSecret());
      if (payload.type !== 'admin-action' || payload.action !== 'reset') {
        return NextResponse.json(
          { error: 'Invalid action token' },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Token expired or invalid. Please verify OTP again.' },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate new password
    const newPassword = generateSecurePassword();

    // Update in Blob store
    await resetUserPassword(email, newPassword);

    // NO email sent to user — admin communicates password directly (Microsoft Outlook admin style)
    // Return the new password to the admin so they can share it
    return NextResponse.json({
      success: true,
      message: `Password reset for ${email}`,
      newPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    console.error('[Admin Users] Reset password error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
