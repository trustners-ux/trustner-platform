'use client';

/**
 * Phase 9 — Calibration.
 *
 * Editable final_performance_rating + final_potential_rating per
 * employee. If cycle.enforce_distribution = true, show a side-by-side
 * "current vs target" distribution chart.
 *
 * Endpoints:
 *  GET /api/employee/hr/performance/cycles/:id/calibration
 *  PUT /api/employee/hr/performance/cycles/:id/calibration/:employeeId
 */
import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Loader2, Save, ShieldAlert } from 'lucide-react';

interface CalibRow {
  employee_id: number;
  employee_code: string;
  full_name: string;
  designation: string | null;
  manager_rating: number | null;
  potential_rating: number | null;
  final_performance_rating: number | null;
  final_potential_rating: number | null;
  compliance_capped: boolean;
  compliance_cap_reason: string | null;
}

interface CalibResp {
  enforce_distribution: boolean;
  distribution_curve: Record<string, number> | null;
  rows: CalibRow[];
}

export default function CalibrationPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const cycleId = params.id;

  const [data, setData] = useState<CalibResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<number, { perf: string; pot: string }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/employee/hr/performance/cycles/${cycleId}/calibration`)
      .then((r) => r.json())
      .then((j: CalibResp) => setData(j))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cycleId]);

  const rows = data?.rows || [];

  const dist = useMemo(() => {
    const out: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of rows) {
      const v = r.final_performance_rating ?? 0;
      if (v >= 1 && v <= 5) out[Math.round(v)]++;
    }
    return out;
  }, [rows]);

  const total = rows.length || 1;
  const distPct = (r: number) => Math.round((dist[r] / total) * 100);
  const targetPct = (r: number) => Math.round(data?.distribution_curve?.[String(r)] ?? 0);

  const save = async (employeeId: number) => {
    const d = draft[employeeId];
    if (!d) return;
    setSavingId(employeeId);
    try {
      const res = await fetch(`/api/employee/hr/performance/cycles/${cycleId}/calibration/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_performance_rating: d.perf === '' ? null : Number(d.perf),
          final_potential_rating: d.pot === '' ? null : Number(d.pot),
        }),
      });
      const j = await res.json();
      if (!res.ok) { alert(j.error || 'Save failed'); return; }
      setDraft((p) => { const n = { ...p }; delete n[employeeId]; return n; });
      load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl">
      <Link href={`/employee/hr/performance/cycle/${cycleId}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to Cycle
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Calibration</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Lock final performance + potential ratings. Compliance-capped rows are limited to 3.
          </p>
        </div>
      </div>

      {data?.enforce_distribution && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">Distribution check</div>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((r) => {
              const cur = distPct(r);
              const tgt = targetPct(r);
              const diff = cur - tgt;
              return (
                <div key={r} className="rounded-lg bg-white border border-amber-200 p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Rating {r}</div>
                  <div className="flex items-end justify-between mt-1">
                    <span className="text-lg font-extrabold text-slate-900">{cur}%</span>
                    <span className="text-[10px] text-slate-500">tgt {tgt}%</span>
                  </div>
                  <div className={`text-[10px] font-bold mt-1 ${Math.abs(diff) <= 5 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {diff > 0 ? '+' : ''}{diff}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employee</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Mgr rt</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Pot rt</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Final perf</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Final pot</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Cap</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const d = draft[r.employee_id] || {
                perf: r.final_performance_rating?.toString() ?? '',
                pot: r.final_potential_rating?.toString() ?? '',
              };
              const perfNum = Number(d.perf);
              const exceedsCap = r.compliance_capped && perfNum > 3;
              return (
                <tr key={r.employee_id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{r.full_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{r.employee_code} · {r.designation || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{r.manager_rating ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{r.potential_rating ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <select
                      value={d.perf}
                      onChange={(e) => setDraft((p) => ({ ...p, [r.employee_id]: { ...d, perf: e.target.value } }))}
                      className={`px-2 py-1 rounded border text-sm ${exceedsCap ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                    >
                      <option value="">—</option>
                      {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={d.pot}
                      onChange={(e) => setDraft((p) => ({ ...p, [r.employee_id]: { ...d, pot: e.target.value } }))}
                      className="px-2 py-1 rounded border border-slate-300 text-sm"
                    >
                      <option value="">—</option>
                      {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    {r.compliance_capped ? (
                      <span title={r.compliance_cap_reason || ''} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                        <ShieldAlert className="w-3 h-3" /> Capped
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => save(r.employee_id)}
                      disabled={savingId === r.employee_id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-brand text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-60"
                    >
                      {savingId === r.employee_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No calibration data yet.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
