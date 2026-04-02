import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { updateAllFundNavs, type FundToUpdate } from '@/lib/utils/nav-fetcher';
import { CURRENT_TRUSTNER_LIST } from '@/data/funds/trustner';

const NAV_BLOB_KEY = 'funds/nav-data.json';

/**
 * Cron job: Daily NAV update at 9 AM IST (3:30 AM UTC).
 * Fetches latest NAV for all Trustner curated funds and calculates returns.
 *
 * Skips weekends (Sat/Sun) and known Indian market holidays.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Runs Tue–Sat to pick up previous trading day's NAV (Mon–Fri).
  // NAV is published late evening, so we fetch next morning.
  // Skip Sunday & Monday (no trading day NAV to fetch).
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const dayOfWeek = istNow.getUTCDay(); // 0=Sun, 6=Sat

  if (dayOfWeek === 0 || dayOfWeek === 1) {
    return NextResponse.json({
      skipped: true,
      reason: dayOfWeek === 0
        ? 'Sunday — no trading day NAV to fetch'
        : 'Monday — Saturday had no trading, NAV already fetched',
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
    });
  }

  try {
    // Collect all funds with schemeCode
    const fundsToUpdate: FundToUpdate[] = [];
    for (const category of CURRENT_TRUSTNER_LIST.categories) {
      for (const fund of category.funds) {
        if (fund.schemeCode) {
          fundsToUpdate.push({
            schemeCode: fund.schemeCode,
            fundName: fund.name,
          });
        }
      }
    }

    if (fundsToUpdate.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'No funds with schemeCode' });
    }

    // Fetch and calculate returns
    const result = await updateAllFundNavs(fundsToUpdate);

    // Store in Vercel Blob
    await put(NAV_BLOB_KEY, JSON.stringify(result, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });

    return NextResponse.json({
      success: true,
      updatedAt: result.updatedAt,
      totalFunds: result.totalFunds,
      successCount: result.successCount,
      failedCount: result.failedCount,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    console.error('[NAV Cron]', err);
    return NextResponse.json({
      error: 'NAV cron failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
