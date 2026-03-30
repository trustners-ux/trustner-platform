import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { otpStore } from '@/lib/services/otp-store';

const OTP_KEY = 'admin-action-otp';
const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');

export async function POST(request: Request) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { otp, action, targetEmail } = await request.json();

    if (!otp || !action) {
      return NextResponse.json(
        { error: 'OTP and action are required' },
        { status: 400 }
      );
    }

    // Development bypass
    if (process.env.NODE_ENV === 'development' && otp === '000000') {
      const token = await createActionToken(action, targetEmail, adminEmail);
      return NextResponse.json({ success: true, actionToken: token });
    }

    // Get stored OTP
    const entry = otpStore.get(OTP_KEY);
    if (!entry) {
      return NextResponse.json(
        { error: 'OTP has expired or was not sent. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (entry.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please check and try again.' },
        { status: 400 }
      );
    }

    // OTP verified — clear from store (single-use)
    otpStore.delete(OTP_KEY);

    // Create a short-lived action token (5 minutes)
    const token = await createActionToken(action, targetEmail, adminEmail);

    return NextResponse.json({
      success: true,
      actionToken: token,
    });
  } catch (error) {
    console.error('[Admin OTP] Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}

async function createActionToken(
  action: string,
  targetEmail: string | undefined,
  adminEmail: string
): Promise<string> {
  return new SignJWT({
    type: 'admin-action',
    action,
    targetEmail: targetEmail || null,
    requestedBy: adminEmail,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(getSecret());
}
