'use client';

/**
 * Phase 9 — Review status board.
 *
 * Per employee row: self-review, manager-review, skip-review status;
 * compliance cap badge if hr_rating.compliance_capped.
 *
 * Endpoint: GET /api/employee/hr/performance/cycles/:id/reviews
 */
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Loader2, ShieldAlert } from 'lucide-react';
import type { ReviewStatus } from '@/lib/hr/performance';

interface ReviewRow {
  employee_id: number;
  employee_code: string;
  full_name: string;
  designation: string | null;
  self_status: ReviewStatus | null;
  manager_status: ReviewStatus | null;
  skip_status: ReviewStatus | null;
  manager_email: string | null;
  skip_email: string | null;
  compliance_capped: boolean;
  compliance_cap_reason: string | null;
  self_rating: number | null;
  manager_rating: number | null;
  potential_rating: number | null;
}

const STATUS_COLOR: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-700',
  submitted: 'bg-emerald-100 text-emerald-800',
  locked:    'bg-emerald-200 text-emerald-900',
  null:      'bg-slate-50 text-slate-400',
};

const STATUS_LABEL: Record<string, string> = {
  draft:     'Draft',
  submitted: 'Submitted',
  locked:    'Locked',
  null:      'Not started',
};

function statusBadge(s: ReviewStatus | null) {
  const key = s ?? 'null';
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[key]}`}>
      {STATUS_LABEL[key]}
    </span>
  );
}

export default function ReviewsBoardPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const cycleId = params.id;

  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/employee/hr/performance/cycles/${cycleId}/reviews`)
      .then((r) => r.json())
      .then((j) => setRows(j.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [cycleId]);

  const counts = {
    self_done: rows.filter((r) => r.self_status === 'submitted' || r.self_status === 'locked').length,
    mgr_done: rows.filter((r) => r.manager_status === 'submitted' || r.manager_status === 'locked').length,
    skip_done: rows.filter((r) => r.skip_status === 'submitted' || r.skip_status === 'locked').length,
    capped: rows.filter((r) => r.compliance_capped).length,
  };

  return (
    <div className="p-8 max-w-7xl">
      <Link href={`/employee/hr/performance/cycle/${cycleId}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to Cycle
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Reviews Board</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Self · manager · skip-level review status, with compliance flags.
          </p>
        </div>
      </div>

      {/* Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Kpi label="Self submitted"    n={counts.self_done} total={rows.length} />
        <Kpi label="Manager submitted" n={counts.mgr_done}  total={rows.length} />
        <Kpi label="Skip submitted"    n={counts.skip_done} total={rows.length} />
        <Kpi label="Compliance capped" n={counts.capped}    total={rows.length} tone="amber" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employee</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Self</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Manager</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Skip</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Self rt</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Mgr rt</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Pot rt</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Flag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.employee_id} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-slate-900">{r.full_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{r.employee_code} · {r.designation || '—'}</div>
                </td>
                <td className="px-3 py-2.5">{statusBadge(r.self_status)}</td>
                <td className="px-3 py-2.5">
                  {statusBadge(r.manager_status)}
                  {r.manager_email && <div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.manager_email}</div>}
                </td>
                <td className="px-3 py-2.5">
                  {statusBadge(r.skip_status)}
                  {r.skip_email && <div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.skip_email}</div>}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">{r.self_rating ?? '—'}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">{r.manager_rating ?? '—'}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">{r.potential_rating ?? '—'}</td>
                <td className="px-3 py-2.5">
                  {r.compliance_capped ? (
                    <span title={r.compliance_cap_reason || ''} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                      <ShieldAlert className="w-3 h-3" /> Capped
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">No reviews recorded yet.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={8} className="px-4 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, n, total, tone }: { label: string; n: number; total: number; tone?: 'amber' }) {
  return (
    <div className={`rounded-lg border p-3 ${tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-xl font-extrabold text-slate-900">
        {n}<span className="text-slate-400 font-normal text-sm"> / {total}</span>
      </div>
    </div>
  );
}
