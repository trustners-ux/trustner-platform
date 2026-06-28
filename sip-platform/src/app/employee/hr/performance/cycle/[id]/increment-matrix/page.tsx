'use client';

/**
 * Phase 9 — Increment Matrix.
 *
 * Shows the FY's hr_increment_matrix (rating → default / min / max) at
 * the top, then per-employee override panel below. Bulk action:
 * "Generate increment letters" runs the letter generator for every
 * locked rating row.
 *
 * Endpoints:
 *  GET  /api/employee/hr/performance/cycles/:id/increment-matrix
 *  PUT  /api/employee/hr/performance/cycles/:id/increment-matrix/:employeeId
 *  POST /api/employee/hr/performance/cycles/:id/generate-letters
 */
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Loader2, FileText, Save } from 'lucide-react';

interface MatrixBand {
  rating: number;
  default_pct: number;
  min_pct: number;
  max_pct: number;
  notes: string | null;
}

interface IncrementRow {
  employee_id: number;
  employee_code: string;
  full_name: string;
  designation: string | null;
  final_performance_rating: number | null;
  current_gross_monthly: number | null;
  recommended_increment_pct: number | null;
  final_increment_pct: number | null;
  increment_amount: number | null;
  band_min: number | null;
  band_max: number | null;
  band_default: number | null;
  letter_id: number | null;
  locked: boolean;
}

interface MatrixResp {
  fiscal_year: string;
  bands: MatrixBand[];
  rows: IncrementRow[];
}

function inr(v: number | null | undefined): string {
  if (v == null) return '—';
  return '₹ ' + Math.round(v).toLocaleString('en-IN');
}

export default function IncrementMatrixPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const cycleId = params.id;

  const [data, setData] = useState<MatrixResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/employee/hr/performance/cycles/${cycleId}/increment-matrix`)
      .then((r) => r.json())
      .then((j: MatrixResp) => setData(j))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cycleId]);

  const save = async (employeeId: number) => {
    const v = draft[employeeId];
    if (v === undefined) return;
    setSavingId(employeeId);
    try {
      const res = await fetch(`/api/employee/hr/performance/cycles/${cycleId}/increment-matrix/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_increment_pct: v === '' ? null : Number(v) }),
      });
      const j = await res.json();
      if (!res.ok) { alert(j.error || 'Save failed'); return; }
      setDraft((p) => { const n = { ...p }; delete n[employeeId]; return n; });
      load();
    } finally {
      setSavingId(null);
    }
  };

  const bulkGenerate = async () => {
    if (!confirm('Generate increment letters for every locked rating? Letters land in the audit archive.')) return;
    setBulkRunning(true);
    setBulkResult(null);
    try {
      const res = await fetch(`/api/employee/hr/performance/cycles/${cycleId}/generate-letters`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) {
        setBulkResult(`Error: ${j.error || 'generate failed'}`);
      } else {
        setBulkResult(`Generated ${j.generated || 0} letter(s).`);
        load();
      }
    } catch (e) {
      setBulkResult(`Error: ${e instanceof Error ? e.message : 'generate failed'}`);
    } finally {
      setBulkRunning(false);
    }
  };

  const rows = data?.rows || [];

  return (
    <div className="p-8 max-w-7xl">
      <Link href={`/employee/hr/performance/cycle/${cycleId}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to Cycle
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Increment Matrix</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              FY {data?.fiscal_year || '—'} · % bands per rating · per-employee override.
            </p>
          </div>
        </div>
        <button
          onClick={bulkGenerate}
          disabled={bulkRunning}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-60"
        >
          {bulkRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
          Generate increment letters
        </button>
      </div>

      {bulkResult && (
        <div className={`rounded-lg p-3 mb-4 text-sm ${bulkResult.startsWith('Error') ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
          {bulkResult}
        </div>
      )}

      {/* Bands strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {(data?.bands || []).map((b) => (
          <div key={b.rating} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rating {b.rating}</div>
            <div className="text-xl font-extrabold text-slate-900">{b.default_pct}%</div>
            <div className="text-[10px] text-slate-500 font-mono">band [{b.min_pct}–{b.max_pct}%]</div>
          </div>
        ))}
        {data && data.bands.length === 0 && (
          <div className="col-span-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            No matrix configured for FY {data.fiscal_year}. Seed hr_increment_matrix to enable letter generation.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employee</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Rating</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Current gross</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Band</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Recommended</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Final %</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Δ Annual</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Letter</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const cur = draft[r.employee_id] ?? (r.final_increment_pct?.toString() ?? '');
              const curNum = Number(cur);
              const outOfBand = cur !== '' && r.band_min != null && r.band_max != null && (curNum < r.band_min || curNum > r.band_max);
              return (
                <tr key={r.employee_id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{r.full_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{r.employee_code} · {r.designation || '—'}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{r.final_performance_rating ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{inr(r.current_gross_monthly)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[11px] text-slate-500">
                    {r.band_min != null ? `${r.band_min}–${r.band_max}%` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{r.recommended_increment_pct != null ? `${r.recommended_increment_pct}%` : '—'}</td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      step="0.5"
                      value={cur}
                      onChange={(e) => setDraft((p) => ({ ...p, [r.employee_id]: e.target.value }))}
                      disabled={r.locked}
                      className={`w-20 px-2 py-1 rounded border text-sm text-right ${outOfBand ? 'border-rose-400 bg-rose-50' : 'border-slate-300'} ${r.locked ? 'bg-slate-100 opacity-60' : ''}`}
                    />
                    {outOfBand && <div className="text-[10px] text-rose-600 mt-0.5">Out of band</div>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{inr(r.increment_amount)}</td>
                  <td className="px-3 py-2.5 text-xs">
                    {r.letter_id ? (
                      <Link href={`/employee/hr/letters/${r.letter_id}`} className="text-brand font-bold hover:underline">View</Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => save(r.employee_id)}
                      disabled={savingId === r.employee_id || outOfBand || r.locked}
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
              <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">No increment rows yet — lock ratings first.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={9} className="px-4 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
