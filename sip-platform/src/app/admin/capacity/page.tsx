/**
 * Team Capacity Heatmap
 *
 * Route: /admin/capacity
 *
 * Bottleneck-finder. Shows per-person draft + review workload + AUM
 * book size + last activity. Hottest row at the top. Click a name
 * to open their performance page.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Activity, AlertTriangle, Flame } from 'lucide-react';

interface Row {
  id: number;
  name: string;
  employeeCode: string;
  designation: string;
  levelCode: string;
  entity: string;
  pdRole: string;
  pdLevel: number;
  canReview: boolean;
  canApprove: boolean;
  draftsInFlight: number;
  reviewsInQueue: number;
  oldestReviewAgeHours: number | null;
  activitiesLast7d: number;
  lastActivityAt: string | null;
  aumUnderBookInr: number;
}

function formatInr(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n === 0) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

function workloadTone(reviews: number, drafts: number): string {
  const total = reviews * 2 + drafts;
  if (total === 0) return 'bg-slate-50 border-slate-200';
  if (total < 3) return 'bg-emerald-50 border-emerald-200';
  if (total < 8) return 'bg-amber-50 border-amber-200';
  return 'bg-rose-50 border-rose-300';
}

export default function CapacityPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/capacity', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? `HTTP ${res.status}`); return; }
      setRows(data.rows ?? []);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  const totalReviewsInFlight = rows.reduce((s, r) => s + r.reviewsInQueue, 0);
  const totalDraftsInFlight = rows.reduce((s, r) => s + r.draftsInFlight, 0);
  const totalAum = rows.reduce((s, r) => s + r.aumUnderBookInr, 0);
  const stale = rows.filter((r) => (r.oldestReviewAgeHours ?? 0) > 48);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700 flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Team Capacity
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Spot bottlenecks and reassign work. Sorted by review-queue size (heaviest first).
          </p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Reviews in flight" value={String(totalReviewsInFlight)} tone="primary" />
        <KpiTile label="Drafts in flight" value={String(totalDraftsInFlight)} tone="amber" />
        <KpiTile label="Total team AUM" value={formatInr(totalAum)} tone="teal" />
        <KpiTile label="Stale > 48h" value={String(stale.length)} tone={stale.length > 0 ? 'rose' : 'emerald'} />
      </div>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stale-review callout */}
      {stale.length > 0 && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
          <div className="flex items-center gap-2 font-bold mb-2">
            <AlertTriangle className="h-4 w-4" />
            {stale.length} employee(s) have reviews sitting &gt; 48 hours
          </div>
          <ul className="space-y-1 text-xs">
            {stale.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong>: {s.reviewsInQueue} in queue · oldest {Math.round(s.oldestReviewAgeHours ?? 0)}h
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Capacity table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-600">
            <tr>
              <th className="text-left px-3 py-2 font-semibold">Employee</th>
              <th className="text-left px-3 py-2 font-semibold">PD Role</th>
              <th className="text-right px-3 py-2 font-semibold">Reviews</th>
              <th className="text-right px-3 py-2 font-semibold">Oldest age</th>
              <th className="text-right px-3 py-2 font-semibold">Drafts</th>
              <th className="text-right px-3 py-2 font-semibold">7d activity</th>
              <th className="text-right px-3 py-2 font-semibold">AUM book</th>
              <th className="text-left px-3 py-2 font-semibold">Last active</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">No team members with PD roles yet.</td></tr>
            ) : (
              rows.map((r) => {
                const isHot = r.reviewsInQueue >= 5 || (r.oldestReviewAgeHours ?? 0) > 48;
                return (
                  <tr key={r.id} className={`border-t border-slate-100 hover:bg-slate-50 ${workloadTone(r.reviewsInQueue, r.draftsInFlight)}`}>
                    <td className="px-3 py-2 align-top">
                      <Link href={`/admin/employees/${r.id}`} className="font-semibold text-slate-900 hover:text-primary-700">
                        {r.name}
                        {isHot && <Flame className="h-3 w-3 text-rose-600 inline ml-1" />}
                      </Link>
                      <div className="text-[10px] text-slate-500">{r.employeeCode} · {r.designation} · {r.levelCode}</div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary-50 text-primary-700">
                        {r.pdRole} · L{r.pdLevel}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top text-right font-bold">{r.reviewsInQueue || '—'}</td>
                    <td className="px-3 py-2 align-top text-right">
                      {r.oldestReviewAgeHours !== null
                        ? <span className={(r.oldestReviewAgeHours ?? 0) > 48 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                            {Math.round(r.oldestReviewAgeHours)}h
                          </span>
                        : '—'}
                    </td>
                    <td className="px-3 py-2 align-top text-right">{r.draftsInFlight || '—'}</td>
                    <td className="px-3 py-2 align-top text-right">{r.activitiesLast7d || '—'}</td>
                    <td className="px-3 py-2 align-top text-right font-mono">{formatInr(r.aumUnderBookInr)}</td>
                    <td className="px-3 py-2 align-top text-slate-600">
                      {r.lastActivityAt ? new Date(r.lastActivityAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">
        Row colour shows workload heat: green = light, amber = medium, red = heavy. <Flame className="h-3 w-3 inline text-rose-600" /> indicates a hotspot (5+ reviews or stale &gt; 48h).
      </div>
    </div>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone: 'primary' | 'amber' | 'teal' | 'emerald' | 'rose' }) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  } as const;
  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
    </div>
  );
}
