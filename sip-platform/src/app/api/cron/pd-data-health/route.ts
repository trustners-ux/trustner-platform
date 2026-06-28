/**
 * Cron — PD Data-Health snapshot (daily).
 *
 * Computes the engine's data-health metrics (research-stats freshness, feed
 * garbage, unmatched funds, buy-list gaps) and appends a row to
 * pd_data_health_log so drift is caught proactively. Surfaces alerts in the
 * response (and the log) for an admin to act on.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>`.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getDataHealth } from '@/lib/portfolio-diagnostic/analytics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const health = await getDataHealth(supabase, new Date().toISOString().slice(0, 10));

  await supabase.from('pd_data_health_log').insert({
    metrics: health,
    alerts: health.alerts.length ? health.alerts : null,
  });

  return NextResponse.json({ success: true, health });
}
