/**
 * POST /api/portfolio-check/pan
 *
 * Step 1 of PAN+OTP flow: Initiate CAS fetch via CASParser.in CDSL API.
 * Sends OTP to investor's registered mobile number.
 *
 * Body: { pan, dob, name, mobile, consent }
 * Returns: { success, sessionId, message }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cdslFetch, CasParserError } from '@/lib/casparser/client';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

export const maxDuration = 30;

const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (!limiter.check(ip).ok) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please try again in an hour.' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
  }

  const pan = String(body.pan ?? '').trim().toUpperCase();
  const dob = String(body.dob ?? '').trim();
  const name = String(body.name ?? '').trim();
  const mobile = String(body.mobile ?? '').replace(/\D/g, '');
  const consent = body.consent === true;

  if (!PAN_RE.test(pan)) {
    return NextResponse.json({ success: false, message: 'Please enter a valid PAN (e.g. ABCDE1234F).' }, { status: 400 });
  }
  if (!DOB_RE.test(dob)) {
    return NextResponse.json({ success: false, message: 'Please enter your date of birth (YYYY-MM-DD).' }, { status: 400 });
  }
  if (!name || name.length < 2) {
    return NextResponse.json({ success: false, message: 'Please enter your name.' }, { status: 400 });
  }
  if (!/^\d{10}$/.test(mobile)) {
    return NextResponse.json({ success: false, message: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ success: false, message: 'Consent is required.' }, { status: 400 });
  }

  if (!process.env.CASPARSER_API_KEY) {
    return NextResponse.json(
      { success: false, message: 'PAN-based fetch is not yet configured. Please upload your CAS PDF instead.' },
      { status: 503 }
    );
  }

  try {
    const result = await cdslFetch(pan, dob);

    return NextResponse.json({
      success: true,
      sessionId: result.session_id,
      message: 'OTP sent to your registered mobile number. Please enter it to proceed.',
    });
  } catch (err) {
    if (err instanceof CasParserError) {
      if (err.statusCode === 402) {
        return NextResponse.json(
          { success: false, message: 'Service temporarily unavailable. Please upload your CAS PDF instead.' },
          { status: 503 }
        );
      }
      const parsed = tryParseJson(err.responseBody);
      const msg = parsed?.message || parsed?.error || 'Could not fetch your CAS. Please check your PAN and date of birth, or upload your CAS PDF instead.';
      return NextResponse.json({ success: false, message: msg }, { status: 422 });
    }
    console.error('[portfolio-check/pan] CDSL fetch error:', err);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again or upload your CAS PDF instead.' },
      { status: 500 }
    );
  }
}

function tryParseJson(s: string): Record<string, string> | null {
  try { return JSON.parse(s); } catch { return null; }
}
