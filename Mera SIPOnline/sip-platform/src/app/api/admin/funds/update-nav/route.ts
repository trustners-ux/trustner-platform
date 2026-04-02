import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { updateAllFundNavs, type FundToUpdate } from '@/lib/utils/nav-fetcher';
import { CURRENT_TRUSTNER_LIST } from '@/data/funds/trustner';
import type { NavUpdateResult } from '@/types/funds';

const NAV_BLOB_KEY = 'funds/nav-data.json';

/**
 * GET /api/admin/funds/update-nav
 * Returns the latest stored NAV data (if any).
 */
export async function GET() {
  try {
    const result = await list({ prefix: NAV_BLOB_KEY, limit: 1 });
    if (result.blobs.length > 0) {
      const res = await fetch(result.blobs[0].url);
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    }
    return NextResponse.json({ funds: [], updatedAt: null });
  } catch (err) {
    console.error('[NAV GET]', err);
    return NextResponse.json({ error: 'Failed to fetch NAV data' }, { status: 500 });
  }
}

/**
 * POST /api/admin/funds/update-nav
 * Triggers a full NAV update for all Trustner curated funds with a schemeCode.
 * Can be called manually (admin button) or by cron.
 *
 * Optional header: x-cron-secret for automated calls.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check: either admin session or cron secret
    const cronSecret = req.headers.get('x-cron-secret');
    const adminEmail = req.headers.get('x-admin-email');
    const validCron = cronSecret && cronSecret === process.env.CRON_SECRET;

    if (!adminEmail && !validCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      return NextResponse.json({
        error: 'No funds with schemeCode found',
      }, { status: 400 });
    }

    // Fetch and calculate
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
      errors: result.errors,
    });
  } catch (err) {
    console.error('[NAV POST]', err);
    return NextResponse.json({
      error: 'NAV update failed',
      details: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
