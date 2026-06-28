/**
 * Cron: /api/cron/universe-metrics  (self-maintaining universe engine, Jun 2026)
 *
 * Nightly: recomputes SEBI-standard returns + risk for every universe fund from
 * authoritative NAV (MFAPI) and upserts pd_fund_metrics. The /funds/universe
 * route serves these as the PRIMARY numbers — zero manual intervention.
 *
 * Auth: Authorization: Bearer <CRON_SECRET> (header-only, fail-closed).
 * Idempotent + time-boxed; processes stalest-first so repeated runs converge.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { fetchAndComputeFund } from '@/lib/funds/fund-metrics-source';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const CONCURRENCY = 8;
const TIME_BUDGET_MS = 270_000;

async function mapPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    })
  );
}

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  // Universe funds (have a research snapshot) + their names for the identity gate.
  const funds: { amfi_code: string; scheme_name: string }[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await supabase
      .from('pd_fund_universe_latest')
      .select('amfi_code, scheme_name')
      .not('amfi_code', 'is', null)
      .range(from, from + 999);
    if (error) return NextResponse.json({ error: `list failed: ${error.message}` }, { status: 500 });
    if (!data || data.length === 0) break;
    for (const r of data) if (r.amfi_code) funds.push({ amfi_code: String(r.amfi_code), scheme_name: String(r.scheme_name ?? '') });
    if (data.length < 1000) break;
  }
  // de-dup by amfi_code
  const seen = new Set<string>();
  const unique = funds.filter((f) => (seen.has(f.amfi_code) ? false : (seen.add(f.amfi_code), true)));

  const deadline = Date.now() + TIME_BUDGET_MS;
  let updated = 0, flagged = 0, failed = 0, timedOut = 0;

  await mapPool(unique, CONCURRENCY, async (f) => {
    if (Date.now() > deadline) { timedOut++; return; }
    const m = await fetchAndComputeFund(f.amfi_code, f.scheme_name);
    if (!m.identity_ok && m.nav_points === 0) { failed++; }
    else if (!m.identity_ok) { flagged++; }
    const { error } = await supabase.from('pd_fund_metrics').upsert({ ...m, updated_at: new Date().toISOString() }, { onConflict: 'amfi_code' });
    if (error) { failed++; return; }
    if (m.identity_ok) updated++;
  });

  return NextResponse.json({
    ok: true,
    universeFunds: unique.length,
    updated, flaggedIdentity: flagged, failed, timedOut,
    note: timedOut > 0 ? 'Hit time budget — re-run to finish the remainder.' : 'Complete.',
  });
}
