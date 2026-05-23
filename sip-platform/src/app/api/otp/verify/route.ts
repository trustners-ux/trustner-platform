import { NextResponse } from 'next/server';
import { otpStore } from '@/lib/services/otp-store';

/**
 * POST /api/otp/verify
 * Verifies a 6-digit OTP for the given phone number.
 * Used by the LeadFunnel component for phone verification.
 *
 * Body: { phone: string, otp: string }
 *
 * Dev bypass: OTP "000000" is accepted in development mode.
 */
export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone and OTP are required' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Look up stored OTP
    const stored = otpStore.get(cleanPhone);

    // Development bypass: accept "000000"
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

    if (isDev) {
      console.log(`[Lead OTP] Phone ${cleanPhone} verified successfully`);
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully',
    });
  } catch (error) {
    console.error('[Lead OTP] Verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
