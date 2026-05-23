import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { otpStore } from '@/lib/services/otp-store';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');

export async function POST(request: Request) {
  try {
    const { phone, email, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone and OTP are required' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Look up the stored OTP
    const stored = otpStore.get(cleanPhone);

    // Development bypass: accept "000000" for testing
    const isDev = process.env.NODE_ENV === 'development';
    const isValidOTP = stored && stored.otp === otp && Date.now() <= stored.expiresAt;
    const isBypass = isDev && otp === '000000';

    if (!isValidOTP && !isBypass) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please try again.' },
        { status: 400 }
      );
    }

    // Clear OTP after successful verification (prevent reuse)
    otpStore.delete(cleanPhone);

    // Use the email from the stored OTP entry if available (more secure),
    // otherwise fall back to what the client sent
    const verifiedEmail = stored?.email || email || '';

    // Generate session JWT valid for 2 hours
    const token = await new SignJWT({
      phone: cleanPhone,
      email: verifiedEmail,
      type: 'fp-session',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(getSecret());

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('[FP OTP] Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
