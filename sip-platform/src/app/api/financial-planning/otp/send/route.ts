import { NextResponse } from 'next/server';
import { otpStore } from '@/lib/services/otp-store';

export async function POST(request: Request) {
  try {
    const { phone, email } = await request.json();

    if (!phone || !email) {
      return NextResponse.json(
        { error: 'Phone and email are required' },
        { status: 400 }
      );
    }

    // Validate phone: exactly 10 digits
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Rate limit: max 3 OTPs per phone per 10-minute window
    if (otpStore.isRateLimited(cleanPhone)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again after 10 minutes.' },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const currentAttempts = otpStore.getAttempts(cleanPhone);

    otpStore.set(cleanPhone, {
      otp,
      email,
      expiresAt: Date.now() + 300000, // 5 minutes
      attempts: currentAttempts + 1,
    });

    // Send OTP via email using Resend
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
            subject: `Your OTP: ${otp} — MeraSIP Financial Planning`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #0F766E, #134E4A); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h2 style="color: #fff; margin: 0; font-size: 20px;">Mera SIP Online</h2>
                  <p style="color: #99F6E4; margin: 6px 0 0; font-size: 13px;">by Trustner Asset Services</p>
                </div>
                <div style="background: #fff; padding: 30px; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">Your verification code for the Financial Wellness Assessment:</p>
                  <div style="background: #F0FDF4; border: 2px solid #0F766E; border-radius: 8px; padding: 16px; text-align: center; margin: 0 0 20px;">
                    <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0F766E;">${otp}</span>
                  </div>
                  <p style="color: #64748B; font-size: 13px; margin: 0 0 8px;">This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
                  <p style="color: #94A3B8; font-size: 12px; margin: 0;">If you did not request this code, please ignore this email.</p>
                  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0 16px;" />
                  <p style="color: #94A3B8; font-size: 11px; text-align: center; margin: 0;">
                    Trustner Asset Services Pvt. Ltd. | ARN-286886 | AMFI Registered<br />
                    <a href="https://www.merasip.com" style="color: #0F766E; text-decoration: none;">www.merasip.com</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('[FP OTP] Email send failed:', emailErr);
        // Don't fail the request — OTP is still stored, user can try resending
      }
    }

    // Try SMS via MSG91 (if configured — requires DLT registration)
    const msg91Key = process.env.MSG91_AUTH_KEY;
    const msg91Template = process.env.MSG91_TEMPLATE_ID;
    let smsSent = false;

    if (msg91Key && msg91Template) {
      try {
        const smsRes = await fetch('https://control.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authkey: msg91Key,
          },
          body: JSON.stringify({
            template_id: msg91Template,
            mobile: `91${cleanPhone}`,
            otp,
            otp_length: 6,
          }),
        });
        smsSent = smsRes.ok;
        if (!smsRes.ok) {
          console.error('[FP OTP] MSG91 response:', smsRes.status);
        }
      } catch (smsErr) {
        console.error('[FP OTP] SMS send failed:', smsErr);
      }
    }

    // Log OTP in development for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FP OTP] OTP sent successfully, SMS: ${smsSent}`);
    }

    return NextResponse.json({
      success: true,
      message: smsSent ? 'OTP sent to your phone and email' : 'OTP sent to your email',
      channel: smsSent ? 'sms+email' : 'email',
    });
  } catch (error) {
    console.error('[FP OTP] Send error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
