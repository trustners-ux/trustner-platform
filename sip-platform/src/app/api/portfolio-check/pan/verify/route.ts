/**
 * POST /api/portfolio-check/pan/verify
 *
 * Step 2 of PAN+OTP flow: verify OTP → get CAS PDFs → parse → full PD engine.
 *
 * Body: { sessionId, otp, name, mobile, pan }
 * Returns: { success, resultsToken, investorName }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cdslVerify, smartParseUrl, CasParserError } from '@/lib/casparser/client';
import { adaptCasParserResponse } from '@/lib/casparser/adapter';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { createPdRunFromHoldings } from '@/lib/casparser/run-pd-from-holdings';
import { clientIp } from '@/lib/security/rate-limit';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request.' }, { status: 400 });
  }

  const sessionId = String(body.sessionId ?? '').trim();
  const otp = String(body.otp ?? '').trim();
  const name = String(body.name ?? '').trim();
  const mobile = String(body.mobile ?? '').replace(/\D/g, '');
  const pan = String(body.pan ?? '').trim().toUpperCase();

  if (!sessionId) {
    return NextResponse.json({ success: false, message: 'Session expired. Please start again.' }, { status: 400 });
  }
  if (!otp || otp.length < 4) {
    return NextResponse.json({ success: false, message: 'Please enter the OTP sent to your registered mobile.' }, { status: 400 });
  }
  if (!name || !mobile) {
    return NextResponse.json({ success: false, message: 'Missing lead details.' }, { status: 400 });
  }

  try {
    // Step 1: Verify OTP and get CAS PDF URLs
    const verifyResult = await cdslVerify(sessionId, otp);

    if (!verifyResult.files || verifyResult.files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No CAS statement found for this PAN. You may not have CDSL demat holdings. Please upload your CAS PDF instead.' },
        { status: 422 }
      );
    }

    // Step 2: Parse the most recent CAS PDF via CASParser Smart Parse
    const latestFile = verifyResult.files[0];
    const casParserResult = await smartParseUrl(latestFile.url);

    if (!casParserResult.mutual_funds || casParserResult.mutual_funds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Your CAS was fetched but contains no mutual fund holdings. Please upload your CAMS/KFintech CAS instead.' },
        { status: 422 }
      );
    }

    // Step 3: Convert CASParser response → RawHolding[] / RawSip[]
    const parsed = adaptCasParserResponse(casParserResult);

    if (parsed.holdings.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Could not extract holdings from your CAS. Please upload your CAS PDF manually.' },
        { status: 422 }
      );
    }

    // Step 4: Run full PD engine
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Database unavailable. Please try again.' },
        { status: 503 }
      );
    }

    const pdResult = await createPdRunFromHoldings(supabase, parsed, {
      name,
      mobile,
      ip,
      source: 'PAN+OTP (CDSL)',
    });

    return NextResponse.json({
      success: true,
      resultsToken: pdResult.resultsToken,
      investorName: parsed.investorName ?? null,
      pan: pan || casParserResult.investor?.pan || null,
    });
  } catch (err) {
    if (err instanceof CasParserError) {
      if (err.statusCode === 400 || err.statusCode === 401) {
        const parsed = tryParseJson(err.responseBody);
        const msg = parsed?.message || 'Invalid OTP. Please try again.';
        return NextResponse.json({ success: false, message: msg }, { status: 422 });
      }
      if (err.statusCode === 402) {
        return NextResponse.json(
          { success: false, message: 'Service temporarily unavailable. Please upload your CAS PDF instead.' },
          { status: 503 }
        );
      }
    }
    console.error('[portfolio-check/pan/verify] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Something went wrong during analysis. Please try again or upload your CAS PDF instead.' },
      { status: 500 }
    );
  }
}

function tryParseJson(s: string): Record<string, string> | null {
  try { return JSON.parse(s); } catch { return null; }
}
