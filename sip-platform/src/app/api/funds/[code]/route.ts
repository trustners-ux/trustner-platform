import { NextResponse } from 'next/server';
import { getFundDetail } from '@/lib/services/fund-data';

/* ─────────────────────────────────────────────────────────
   Fund Detail API

   GET /api/funds/119551

   Returns complete LiveFundDetail for a given MFAPI
   scheme code including NAV, returns, metadata, and
   fund house information.
   ───────────────────────────────────────────────────────── */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Validate scheme code is a valid number
    const schemeCode = Number(code);
    if (isNaN(schemeCode) || schemeCode <= 0 || !Number.isInteger(schemeCode)) {
      return NextResponse.json(
        {
          error: 'Invalid scheme code. Must be a positive integer.',
          example: '/api/funds/119551',
        },
        { status: 400 }
      );
    }

    // Fetch fund detail from service layer
    const fundDetail = await getFundDetail(schemeCode);

    if (!fundDetail) {
      return NextResponse.json(
        {
          error: `Fund not found for scheme code: ${schemeCode}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(fundDetail);
  } catch (error) {
    console.error('[API] Fund detail error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch fund details. Please try again.',
      },
      { status: 500 }
    );
  }
}
