'use client';

/**
 * Phase 9 — Mid-year check-in board.
 *
 * For each employee, lists their goals with current actual_value (auto-pulled
 * where applicable) and editable midyear_actual + midyear_note.
 *
 * Endpoints:
 *  GET /api/employee/hr/performance/cycles/:id/goals
 *  PUT /api/employee/hr/performance/cycles/:id/goals/:goalId
 */
import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, GitBranch, Loader2, Save } from 'lucide-react';
import type { HrGoalRow } from '@/lib/hr/performance';

interface EmployeeRow {
  id: number;
  employee_code: string;
  full_name: string;
  designation: string | null;
}

interface DraftPatch {
  midyear_actual: string;
  midyear_note: string;
}

export default function MidYearPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const cycleId = params.id;

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [goals, setGoals] = useState<HrGoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<number, DraftPatch>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const load = () => {
    setLoading(true);
    fetch(`/api/employee/hr/performance/cycles/${cycleId}/goals`)
      .then((r) => r.json())
      .then((j) => { setEmployees(j.employees || []); setGoals(j.goals || []); })
      .catch(() => { setEmployees([]); setGoals([]); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cycleId]);

  const byEmp = useMemo(() => {
    const m = new Map<number, HrGoalRow[]>();
    for (const g of goals) {
      const arr = m.get(g.employee_id) || [];
      arr.push(g);
      m.set(g.employee_id, arr);
    }
    return m;
  }, [goals]);

  const saveGoal = async (goalId: number, employeeId: number) => {
    const d = draft[goalId];
    if (!d) return;
    setSavingId(goalId);
    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;
      const res = await fetch(`/api/employee/hr/performance/cycles/${cycleId}/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          kra_category: goal.kra_category,
          goal_title: goal.goal_title,
          goal_description: goal.goal_description,
          weight: goal.weight,
          target_metric: goal.target_metric,
          target_value: goal.target_value,
          target_unit: goal.target_unit,
          auto_source: goal.auto_source,
          midyear_actual: d.midyear_actual === '' ? null : Number(d.midyear_actual),
          midyear_note: d.midyear_note || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) { alert(j.error || 'Save failed'); return; }
      setDraft((prev) => {
        const next = { ...prev };
        delete next[goalId];
        return next;
      });
      load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <Link href={`/employee/hr/performance/cycle/${cycleId}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to Cycle
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <GitBranch className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mid-Year Check-in</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Capture mid-year progress per goal. Auto-sourced actuals are already filled.
          </p>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" />
        </div>
      )}

      <div className="space-y-3">
        {employees.map((emp) => {
          const empGoals = byEmp.get(emp.id) || [];
          const done = empGoals.filter((g) => g.midyear_actual != null).length;
          const open = !!expanded[emp.id];
          return (
            <div key={emp.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpanded((p) => ({ ...p, [emp.id]: !open }))}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 text-left"
              >
                <div>
                  <div className="font-medium text-slate-900">{emp.full_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{emp.employee_code} · {emp.designation || '—'}</div>
                </div>
                <div className="text-xs text-slate-600">
                  <span className={`font-bold ${done === empGoals.length && empGoals.length > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {done}/{empGoals.length}
                  </span> goals reviewed
                </div>
              </button>
              {open && (
                <div className="border-t border-slate-200 divide-y divide-slate-100">
                  {empGoals.length === 0 && (
                    <div className="px-4 py-4 text-sm text-slate-500">No goals yet for this cycle.</div>
                  )}
                  {empGoals.map((g) => {
                    const d = draft[g.id] || {
                      midyear_actual: g.midyear_actual?.toString() ?? '',
                      midyear_note: g.midyear_note ?? '',
                    };
                    return (
                      <div key={g.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        <div className="md:col-span-5">
                          <div className="text-sm font-medium text-slate-900">{g.goal_title}</div>
                          <div className="text-[11px] text-slate-500">
                            {g.kra_category} · {g.weight}% · target {g.target_value ?? '—'} {g.target_unit ?? ''}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Actual (auto)</label>
                          <div className="px-2 py-1.5 text-sm rounded bg-slate-50 border border-slate-200 font-mono text-slate-700">
                            {g.actual_value ?? '—'}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mid-year</label>
                          <input
                            type="number"
                            value={d.midyear_actual}
                            onChange={(e) => setDraft((p) => ({ ...p, [g.id]: { ...d, midyear_actual: e.target.value } }))}
                            className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Note</label>
                          <input
                            value={d.midyear_note}
                            onChange={(e) => setDraft((p) => ({ ...p, [g.id]: { ...d, midyear_note: e.target.value } }))}
                            className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm"
                          />
                        </div>
                        <div className="md:col-span-1 flex md:justify-end">
                          <button
                            onClick={() => saveGoal(g.id, emp.id)}
                            disabled={savingId === g.id}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-brand text-white text-xs font-bold hover:bg-brand-700 disabled:opacity-60"
                          >
                            {savingId === g.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {!loading && employees.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            No employees in this cycle.
          </div>
        )}
      </div>
    </div>
  );
}
