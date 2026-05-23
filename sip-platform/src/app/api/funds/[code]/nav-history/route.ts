import { NextResponse } from 'next/server';
import { getNavHistory } from '@/lib/services/mfapi';

/* ─────────────────────────────────────────────────────────
   NAV History API

   GET /api/funds/119551/nav-history?period=3Y

   Returns historical NAV data points for charting.
   Supported periods: 1Y, 3Y, 5Y, MAX
   Defaults to 3Y if no period specified.
   ───────────────────────────────────────────────────────── */

const VALID_PERIODS = ['1Y', '3Y', '5Y', 'MAX'] as const;
type NavPeriod = (typeof VALID_PERIODS)[number];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);

    // Validate scheme code
    const schemeCode = Number(code);
    if (isNaN(schemeCode) || schemeCode <= 0 || !Number.isInteger(schemeCode)) {
      return NextResponse.json(
        {
          error: 'Invalid scheme code. Must be a positive integer.',
          example: '/api/funds/119551/nav-history?period=3Y',
        },
        { status: 400 }
      );
    }

    // Parse and validate period
    const periodParam = searchParams.get('period') || '3Y';
    const period = periodParam.toUpperCase() as NavPeriod;

    if (!VALID_PERIODS.includes(period)) {
      return NextResponse.json(
        {
          error: `Invalid period: "${periodParam}". Must be one of: ${VALID_PERIODS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Fetch NAV history from MFAPI service
    const data = await getNavHistory(schemeCode, period);

    return NextResponse.json({
      schemeCode,
      period,
      data,
    });
  } catch (error) {
    console.error('[API] NAV history error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch NAV history. Please try again.',
      },
      { status: 500 }
    );
  }
}
