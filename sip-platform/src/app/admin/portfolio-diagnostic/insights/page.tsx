'use client';

/**
 * PD Insights — admin analytics surface for the verdict-override feedback loop
 * + research data-health. Renders the (previously API-only)
 * /api/admin/portfolio-diagnostic/insights payload.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, TrendingUp, Activity, AlertTriangle } from 'lucide-react';

interface OverrideInsight {
  totalOverrides: number;
  byTransition: { from: string; to: string; count: number }[];
  recent: { runId: number; from: string; to: string; reason: string | null; at: string }[];
}
interface DataHealth {
  latestSnapshot: string | null;
  snapshotAgeDays: number | null;
  researchStatsRows: number;
  terGarbageCount: number;
  volGarbageCount: number;
  unmatchedLogCount: number;
  buyListNullAmfi: number;
  alerts: string[];
}

export default function PdInsightsPage() {
  const [overrides, setOverrides] = useState<OverrideInsight | null>(null);
  const [health, setHealth] = useState<DataHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/portfolio-diagnostic/insights')
      .then((r) => r.json())
      .then((j) => { if (j.error) setError(j.error); else { setOverrides(j.overrides); setHealth(j.dataHealth); } })
      .catch(() => setError('Failed to load insights'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  if (error) return <div className="p-8 max-w-3xl"><div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-sm text-rose-800">{error}</div></div>;

  const stat = (label: string, value: string | number, tone: 'ok' | 'warn' | 'bad' = 'ok', sub?: string) => {
    const tones = { ok: 'text-slate-900', warn: 'text-amber-600', bad: 'text-rose-600' };
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className={`text-2xl font-extrabold ${tones[tone]}`}>{value}</div>
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mt-1">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/portfolio-diagnostic" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">PD Insights</h1>
          <p className="text-sm text-slate-500 mt-0.5">Verdict-override feedback loop &amp; research data-health.</p>
        </div>
      </div>

      {/* Data-health alerts */}
      {health && health.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-1.5 text-amber-800 font-bold text-sm mb-1"><AlertTriangle className="w-4 h-4" /> Data-health alerts</div>
          <ul className="list-disc pl-5 text-sm text-amber-900 space-y-0.5">
            {health.alerts.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}

      {/* Data health */}
      <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5"><Activity className="w-4 h-4 text-brand" /> Research data-health</h2>
      {health && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">
          {stat('Snapshot age', health.snapshotAgeDays != null ? `${health.snapshotAgeDays}d` : '—',
            health.snapshotAgeDays != null && health.snapshotAgeDays > 10 ? 'warn' : 'ok',
            health.latestSnapshot || 'no snapshot')}
          {stat('Research rows', health.researchStatsRows)}
          {stat('TER garbage', health.terGarbageCount, health.terGarbageCount > 0 ? 'warn' : 'ok', '>3% feed values')}
          {stat('Vol garbage', health.volGarbageCount, health.volGarbageCount > 0 ? 'warn' : 'ok', '>60% feed values')}
          {stat('Unmatched', health.unmatchedLogCount, health.unmatchedLogCount > 60 ? 'warn' : 'ok', 'import log')}
          {stat('Buy-list ∅ AMFI', health.buyListNullAmfi, health.buyListNullAmfi > 0 ? 'bad' : 'ok', 'active rows')}
        </div>
      )}

      {/* Override feedback loop */}
      <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-brand" /> Verdict overrides — engine-tuning signal</h2>
      {overrides && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {stat('Total overrides', overrides.totalOverrides, overrides.totalOverrides > 0 ? 'warn' : 'ok')}
            {stat('Distinct transitions', overrides.byTransition.length)}
          </div>

          {overrides.byTransition.length === 0 ? (
            <p className="text-sm text-slate-500 mb-6">No verdict overrides recorded yet — reviewers are accepting the engine&apos;s calls.</p>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Engine verdict</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Reviewer changed to</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Times</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.byTransition.map((t, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 ? 'bg-slate-50/40' : ''}`}>
                      <td className="px-4 py-2 font-mono text-xs text-slate-700">{t.from}</td>
                      <td className="px-4 py-2 font-mono text-xs font-bold text-slate-900">{t.to}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-900">{t.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {overrides.recent.length > 0 && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Recent overrides</h3>
              <div className="space-y-1.5">
                {overrides.recent.map((r, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200 px-4 py-2 text-sm flex items-center gap-3 flex-wrap">
                    <Link href={`/admin/portfolio-diagnostic/${r.runId}/review`} className="font-mono text-xs text-brand hover:underline">run #{r.runId}</Link>
                    <span className="font-mono text-xs text-slate-700">{r.from} → <b>{r.to}</b></span>
                    {r.reason && <span className="text-xs text-slate-500 italic flex-1 min-w-0 truncate">“{r.reason}”</span>}
                    <span className="text-[11px] text-slate-400 ml-auto">{new Date(r.at).toLocaleDateString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
