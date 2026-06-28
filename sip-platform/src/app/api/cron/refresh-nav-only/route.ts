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
export const maxDuration = 120;

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

    // CRITICAL: AMFI NAVAll has ~14k schemes but pd_fund_master holds only our
    // curated ~4.2k. Upserting the lot with onConflict:amfi_code tries to INSERT
    // the ~10k unknown codes — which violates the scheme_name NOT NULL constraint
    // and aborts the WHOLE 500-row batch (Postgres upsert is all-or-nothing), so
    // NOTHING updated and the universe NAV silently froze. Fix: restrict to codes
    // that ALREADY exist, so every upsert is a pure UPDATE (never an insert).
    const existing = new Set<string>();
    {
      let from = 0;
      const PAGE = 1000;
      for (;;) {
        const { data, error } = await supabase
          .from('pd_fund_master')
          .select('amfi_code')
          .range(from, from + PAGE - 1);
        if (error) { log.push(`load codes batch ${from}: ${error.message}`); break; }
        if (!data || data.length === 0) break;
        for (const r of data as Array<{ amfi_code: string }>) existing.add(r.amfi_code);
        if (data.length < PAGE) break;
        from += PAGE;
      }
    }
    log.push(`pd_fund_master has ${existing.size} funds`);

    // Build batch updates: current_nav + last_refreshed_at, restricted to codes
    // that exist in the master → UPDATE-only, no inserts.
    //
    // last_refreshed_at carries the AMFI NAV PUBLICATION DATE (not the cron run
    // time): the universe view maps live_nav_at = last_refreshed_at, and clients
    // care about "what date is this NAV" — so /funds/universe shows the real AMFI
    // date (matching /funds/selection), not when our job happened to run. Stored
    // at noon IST of the NAV date so it renders as that calendar date in any TZ.
    // (pd_fund_master has no dedicated nav_date column; this avoids a migration.)
    const nowIso = new Date().toISOString();
    const navTs = (d: string | null | undefined) =>
      d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T06:30:00.000Z` : nowIso;
    const updates = amfiRows
      .filter((r) => r.schemeCode && r.nav != null && !Number.isNaN(r.nav) && existing.has(String(r.schemeCode)))
      .map((r) => ({
        amfi_code: String(r.schemeCode),
        current_nav: r.nav,
        last_refreshed_at: navTs(r.date),
      }));

    log.push(`Updating ${updates.length} NAVs (matched to master)`);

    // UPDATE (not upsert): amfi_code has no UNIQUE constraint, so upsert
    // onConflict:amfi_code can't match → it would attempt INSERTs that fail the
    // scheme_name NOT NULL check and abort the whole batch (this is exactly why
    // the universe NAV silently froze). A keyed UPDATE only ever touches the
    // existing row. Bounded concurrency keeps it well within the time limit.
    let upserted = 0;
    let failed = 0;
    const CONC = 40;
    for (let i = 0; i < updates.length; i += CONC) {
      const chunk = updates.slice(i, i + CONC);
      const res = await Promise.all(
        chunk.map((u) =>
          supabase
            .from('pd_fund_master')
            .update({ current_nav: u.current_nav, last_refreshed_at: u.last_refreshed_at })
            .eq('amfi_code', u.amfi_code)
            .then(({ error }) => (error ? 0 : 1))
        )
      );
      for (const ok of res) { if (ok) upserted++; else failed++; }
    }
    if (failed > 0) log.push(`${failed} individual updates failed`);

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
