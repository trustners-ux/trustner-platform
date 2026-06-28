'use client';

/**
 * Phase 9 — Performance Management: Landing dashboard.
 *
 * Surfaces the active cycle (status, due dates, counts) + history of
 * prior cycles. Entry point: + New Cycle.
 *
 * Data: GET /api/employee/hr/performance/cycles
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Plus, Loader2, ExternalLink } from 'lucide-react';
import type { CycleStatus, CycleType } from '@/lib/hr/performance';

interface CycleRow {
  id: number;
  cycle_code: string;
  fiscal_year: string;
  cycle_type: CycleType;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  goals_due_date: string | null;
  self_review_due_date: string | null;
  manager_review_due_date: string | null;
  calibration_due_date: string | null;
  published_at: string | null;
  counts?: {
    goals_locked: number;
    self_submitted: number;
    manager_submitted: number;
    ratings_locked: number;
    total_employees: number;
  };
}

const STATUS_COLOR: Record<CycleStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  goals_open: 'bg-sky-100 text-sky-800',
  mid_year: 'bg-amber-100 text-amber-800',
  self_review_open: 'bg-indigo-100 text-indigo-800',
  manager_review_open: 'bg-violet-100 text-violet-800',
  skip_review_open: 'bg-fuchsia-100 text-fuchsia-800',
  calibration: 'bg-orange-100 text-orange-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-200 text-slate-600',
};

const STATUS_LABEL: Record<CycleStatus, string> = {
  draft: 'Draft',
  goals_open: 'Goals open',
  mid_year: 'Mid-year',
  self_review_open: 'Self-review open',
  manager_review_open: 'Manager review open',
  skip_review_open: 'Skip review open',
  calibration: 'Calibration',
  published: 'Published',
  archived: 'Archived',
};

const TYPE_LABEL: Record<CycleType, string> = {
  annual: 'Annual',
  mid_year: 'Mid-year',
  probation_confirmation: 'Probation',
};

function fmt(d: string | null | undefined): string {
  if (!d) return '—';
  return d.slice(0, 10);
}

export default function PerformanceLandingPage() {
  const [rows, setRows] = useState<CycleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/employee/hr/performance/cycles')
      .then((r) => r.json())
      .then((j) => setRows(j.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const active = useMemo(
    () => rows.find((r) => r.status !== 'archived' && r.status !== 'published'),
    [rows]
  );
  const history = useMemo(() => rows.filter((r) => r !== active), [rows, active]);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Performance &amp; Appraisals</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Cycle setup · KRAs · reviews · calibration · 9-box · increment matrix · PIP
            </p>
          </div>
        </div>
        <Link
          href="/employee/hr/performance/cycle/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> New Cycle
        </Link>
      </div>

      {/* Active cycle card */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6 text-center">
          <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" />
        </div>
      )}

      {!loading && active && (
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Active cycle</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[active.status]}`}>
                  {STATUS_LABEL[active.status]}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                  {TYPE_LABEL[active.cycle_type]}
                </span>
              </div>
              <div className="mt-1 text-xl font-extrabold text-slate-900 font-mono">{active.cycle_code}</div>
              <div className="text-sm text-slate-600 mt-0.5">
                FY {active.fiscal_year} · {fmt(active.start_date)} → {fmt(active.end_date)}
              </div>
            </div>
            <Link
              href={`/employee/hr/performance/cycle/${active.id}`}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
            >
              Open cycle <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Due dates strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <DueTile label="Goals due"        date={active.goals_due_date} />
            <DueTile label="Self-review due"  date={active.self_review_due_date} />
            <DueTile label="Manager rev. due" date={active.manager_review_due_date} />
            <DueTile label="Calibration due"  date={active.calibration_due_date} />
          </div>

          {/* Counts strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <CountTile label="Goals locked"      n={active.counts?.goals_locked}     total={active.counts?.total_employees} />
            <CountTile label="Self reviews"      n={active.counts?.self_submitted}   total={active.counts?.total_employees} />
            <CountTile label="Manager reviews"   n={active.counts?.manager_submitted} total={active.counts?.total_employees} />
            <CountTile label="Ratings locked"    n={active.counts?.ratings_locked}   total={active.counts?.total_employees} />
          </div>
        </div>
      )}

      {!loading && !active && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 mb-6 text-center">
          <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-700 mb-1">No active appraisal cycle</div>
          <p className="text-xs text-slate-500 mb-3">Open a new cycle to start collecting KRAs.</p>
          <Link
            href="/employee/hr/performance/cycle/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-700"
          >
            <Plus className="w-3 h-3" /> New Cycle
          </Link>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Cycle history</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Cycle</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">FY</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Published</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600"></th>
            </tr>
          </thead>
          <tbody>
            {history.map((r, i) => (
              <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{r.cycle_code}</td>
                <td className="px-4 py-2.5 text-xs text-slate-700">{r.fiscal_year}</td>
                <td className="px-4 py-2.5 text-xs text-slate-700">{TYPE_LABEL[r.cycle_type]}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{fmt(r.published_at)}</td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/employee/hr/performance/cycle/${r.id}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && history.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No prior cycles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DueTile({ label, date }: { label: string; date: string | null | undefined }) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = date && date < today;
  return (
    <div className={`rounded-lg border p-2.5 ${overdue ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-sm font-mono ${overdue ? 'text-rose-700 font-bold' : 'text-slate-800'}`}>{fmt(date)}</div>
    </div>
  );
}

function CountTile({ label, n, total }: { label: string; n: number | undefined; total: number | undefined }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-800">
        {n ?? 0}
        {total != null && <span className="text-slate-400 font-normal text-xs"> / {total}</span>}
      </div>
    </div>
  );
}
