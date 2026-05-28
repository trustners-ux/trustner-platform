/**
 * Cron — Daily NAV-Only Refresh (lightweight)
 *
 * Runs daily (Tue-Sat 04:30 IST). Fetches the AMFI NAVAll file and
 * updates ONLY pd_fund_master.current_nav + last_refreshed_at for all
 * matched funds. Does NOT recompute CAGRs (that's the weekly job).
 *
 * Keeps the public /funds/universe page's live NAV column refreshed
 * within 24h, without the 4000-MFAPI-call overhead of the full refresh.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>` header.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { fetchAmfiNavFile } from '@/lib/portfolio-diagnostic/fund-data-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
  }

  // Skip Sun/Mon — no new NAV between Saturday close and Tuesday's AMFI feed
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const dow = ist.getUTCDay();
  if (dow === 0 || dow === 1) {
    return NextResponse.json({
      skipped: true,
      reason: dow === 0 ? 'Sunday — no new NAV' : 'Monday — Saturday already had no trading',
    });
  }

  const log: string[] = [];
  const t0 = Date.now();

  try {
    log.push(`[${new Date().toISOString()}] NAV-only refresh starting`);
    const amfiRows = await fetchAmfiNavFile();
    log.push(`Fetched ${amfiRows.length} rows from AMFI`);

    // Build batch updates: only current_nav + last_refreshed_at
    const nowIso = new Date().toISOString();
    const updates = amfiRows
      .filter((r) => r.schemeCode && r.nav != null && !Number.isNaN(r.nav))
      .map((r) => ({
        amfi_code: String(r.schemeCode),
        current_nav: r.nav,
        last_refreshed_at: nowIso,
      }));

    log.push(`Upserting ${updates.length} NAV updates`);

    let upserted = 0;
    const BATCH = 500;
    for (let i = 0; i < updates.length; i += BATCH) {
      const slice = updates.slice(i, i + BATCH);
      const { error } = await supabase
        .from('pd_fund_master')
        .upsert(slice, { onConflict: 'amfi_code', ignoreDuplicates: false });
      if (error) {
        log.push(`Batch ${i}: ${error.message}`);
        // continue on error — better to upsert what we can
      } else {
        upserted += slice.length;
      }
    }

    const elapsed = Math.round((Date.now() - t0) / 1000);
    log.push(`✓ NAV refresh complete: ${upserted}/${updates.length} funds updated in ${elapsed}s`);

    return NextResponse.json({
      success: true,
      navUpdates: upserted,
      elapsedSec: elapsed,
      log,
    });
  } catch (e) {
    log.push(`FATAL: ${(e as Error).message}`);
    return NextResponse.json({ success: false, log }, { status: 500 });
  }
}
