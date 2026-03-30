import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Lazy initialization — only created when API is called at runtime
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const resend = getResend();

    if (resend) {
      // Send welcome email to subscriber
      const { error: emailError } = await resend.emails.send({
        from: 'Mera SIP Online <noreply@merasip.com>',
        to: email,
        subject: 'Welcome to Mera SIP Online!',
        html: `
          <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #f8fafc;">
            <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #0F766E 0%, #14b8a6 100%); padding: 32px 24px; text-align: center;">
                <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 700;">Welcome to Mera SIP Online!</h1>
                <p style="color: #CCFBF1; font-size: 14px; margin: 8px 0 0;">by Trustner Asset Services</p>
              </div>
              <div style="padding: 32px 24px;">
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
                  Thank you for subscribing! You've joined India's most comprehensive SIP education platform.
                </p>
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                  Here's what you can explore:
                </p>
                <ul style="color: #475569; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0 0 24px;">
                  <li><strong>11 Smart Calculators</strong> — SIP, Goal-Based, Life Stage & more</li>
                  <li><strong>Learning Modules</strong> — From SIP basics to advanced strategies</li>
                  <li><strong>Research Tools</strong> — Historical returns, rolling returns analysis</li>
                  <li><strong>Fund Explorer</strong> — Compare mutual funds side-by-side</li>
                </ul>
                <a href="https://www.merasip.com/calculators" style="display: inline-block; background: #0F766E; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                  Explore Calculators →
                </a>
              </div>
              <div style="padding: 16px 24px; background: #f1f5f9; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  Trustner Asset Services Pvt. Ltd. | AMFI ARN-286886 | CIN U66301AS2023PTC025505
                </p>
                <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0;">
                  Mutual fund investments are subject to market risks. Read all scheme-related documents carefully.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if (emailError) {
        console.error('[Newsletter] Email send failed:', emailError);
      }
    } else {
      console.warn('[Newsletter] RESEND_API_KEY not configured — email not sent');
    }

    console.log('[Newsletter Signup]', email, source || 'homepage', new Date().toISOString());

    return NextResponse.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    console.error('[Newsletter] Error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
