/**
 * Portfolio Diagnostic — analytics: override feedback loop + data-health.
 *
 *  - getOverrideInsights(): aggregates VERDICT_OVERRIDE events so the team can see
 *    WHICH engine calls reviewers most often change — the signal for tuning the
 *    verdict engine over time (a self-improving loop).
 *  - getDataHealth(): cheap count-based health check of the research data feeding
 *    the engine (snapshot freshness, feed-garbage, unmatched funds). A nightly
 *    cron snapshots this so drift is caught before it bites a live review.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface OverrideInsight {
  totalOverrides: number;
  byTransition: { from: string; to: string; count: number }[]; // engine verdict → reviewer's verdict
  recent: { runId: number; from: string; to: string; reason: string | null; at: string }[];
}

export async function getOverrideInsights(sb: SupabaseClient, limit = 500): Promise<OverrideInsight> {
  const { data } = await sb
    .from('pd_workflow_events')
    .select('diagnostic_run_id, comment, metadata, created_at')
    .eq('action', 'VERDICT_OVERRIDE')
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  const tally = new Map<string, { from: string; to: string; count: number }>();
  for (const r of rows) {
    const m = (r.metadata as Record<string, unknown>) || {};
    const from = String(m.from ?? '—'), to = String(m.to ?? '—');
    const key = `${from}→${to}`;
    const cur = tally.get(key) ?? { from, to, count: 0 };
    cur.count++; tally.set(key, cur);
  }
  return {
    totalOverrides: rows.length,
    byTransition: [...tally.values()].sort((a, b) => b.count - a.count),
    recent: rows.slice(0, 20).map((r) => {
      const m = (r.metadata as Record<string, unknown>) || {};
      return {
        runId: r.diagnostic_run_id as number,
        from: String(m.from ?? '—'),
        to: String(m.to ?? '—'),
        reason: (r.comment as string | null) ?? null,
        at: r.created_at as string,
      };
    }),
  };
}

export interface DataHealth {
  latestSnapshot: string | null;
  snapshotAgeDays: number | null;
  researchStatsRows: number;
  terGarbageCount: number;     // TER stored as fraction >0.03 (=>3%) — implausible
  volGarbageCount: number;     // volatility fraction >0.6 (=>60%) — implausible
  unmatchedLogCount: number;   // funds the importer couldn't match
  buyListNullAmfi: number;     // buy-list rows missing an AMFI code
  alerts: string[];
}

export async function getDataHealth(sb: SupabaseClient, todayIso: string): Promise<DataHealth> {
  // latest snapshot date
  const { data: snap } = await sb
    .from('pd_fund_research_stats')
    .select('snapshot_date')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestSnapshot = (snap?.snapshot_date as string) ?? null;
  let snapshotAgeDays: number | null = null;
  if (latestSnapshot) {
    snapshotAgeDays = Math.round((new Date(todayIso).getTime() - new Date(latestSnapshot).getTime()) / 86400000);
  }

  const [rsAll, rsTer, rsVol, unm, bl] = await Promise.all([
    sb.from('pd_fund_research_stats').select('*', { count: 'exact', head: true }),
    sb.from('pd_fund_research_stats').select('*', { count: 'exact', head: true }).gt('ter', 0.03),
    sb.from('pd_fund_research_stats').select('*', { count: 'exact', head: true }).gt('volatility', 0.6),
    sb.from('pd_fund_research_unmatched').select('*', { count: 'exact', head: true }),
    sb.from('pd_trustner_buylist').select('*', { count: 'exact', head: true }).is('amfi_code', null).eq('active', true),
  ]);
  const researchStatsRows = rsAll.count ?? 0;
  const terGarbageCount = rsTer.count ?? 0;
  const volGarbageCount = rsVol.count ?? 0;
  const unmatchedLogCount = unm.count ?? 0;
  const buyListNullAmfi = bl.count ?? 0;

  const alerts: string[] = [];
  if (snapshotAgeDays != null && snapshotAgeDays > 10) alerts.push(`Research stats are ${snapshotAgeDays} days old — import a fresh NGEN export.`);
  if (buyListNullAmfi > 0) alerts.push(`${buyListNullAmfi} active buy-list fund(s) missing an AMFI code.`);
  if (unmatchedLogCount > 60) alerts.push(`${unmatchedLogCount} funds in the unmatched-import log — review the matcher.`);

  return {
    latestSnapshot, snapshotAgeDays, researchStatsRows,
    terGarbageCount, volGarbageCount, unmatchedLogCount, buyListNullAmfi, alerts,
  };
}
