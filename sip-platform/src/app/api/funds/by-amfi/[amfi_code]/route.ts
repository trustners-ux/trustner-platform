/**
 * GET /api/funds/by-amfi/[amfi_code]
 *
 * Returns a single fund-detail JSON keyed by AMFI code (not MFAPI scheme
 * code). Reads pd_fund_universe_latest via the strict public whitelist
 * defined in src/lib/services/pd-fund-detail.ts — proprietary feed_*
 * scores are never returned.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFundByAmfiCode } from '@/lib/services/pd-fund-detail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ amfi_code: string }> }
) {
  const { amfi_code } = await params;

  if (!/^[0-9]{4,7}$/.test(amfi_code)) {
    return NextResponse.json(
      { error: 'Invalid amfi_code — expected 4-7 digit numeric' },
      { status: 400 }
    );
  }

  const fund = await getFundByAmfiCode(amfi_code);
  if (!fund) {
    return NextResponse.json(
      { error: 'Fund not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ fund });
}
