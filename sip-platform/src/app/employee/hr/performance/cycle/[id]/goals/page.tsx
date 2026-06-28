'use client';

/**
 * Phase 9 — Goals matrix.
 *
 * Rows = active employees in the cycle.
 * Columns = KRA categories (business / operational / behavioural /
 *           learning / compliance).
 * A cell shows weight chips for goals in that category. Click → edit
 * modal (weight, target, auto_source). Each row gets a data-quality %
 * chip = weights filled / 100.
 *
 * Endpoints:
 *  GET  /api/employee/hr/performance/cycles/:id/goals
 *  POST /api/employee/hr/performance/cycles/:id/goals          (create)
 *  PUT  /api/employee/hr/performance/cycles/:id/goals/:goalId  (update)
 *  POST /api/employee/hr/performance/cycles/:id/auto-pull      (refresh actuals)
 */
import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Target, RefreshCcw, Plus, X } from 'lucide-react';
import type {
  AutoSource, KraCategory, HrGoalRow,
} from '@/lib/hr/performance';

const KRA_COLS: { key: KraCategory; label: string }[] = [
  { key: 'business',    label: 'Business' },
  { key: 'operational', label: 'Operational' },
  { key: 'behavioural', label: 'Behavioural' },
  { key: 'learning',    label: 'Learning' },
  { key: 'compliance',  label: 'Compliance' },
];

const AUTO_SOURCES: { value: AutoSource; label: string }[] = [
  { value: 'manual',                  label: 'Manual entry' },
  { value: 'hr_dsr_business',         label: 'DSR — Business INR' },
  { value: 'hr_dsr_meetings',         label: 'DSR — Meetings' },
  { value: 'hr_dsr_leads',            label: 'DSR — Leads' },
  { value: 'posp_crosscheck_clean',   label: 'POSP cross-check clean' },
  { value: 'attendance_score',        label: 'Attendance score %' },
];

interface EmployeeRow {
  id: number;
  employee_code: string;
  full_name: string;
  designation: string | null;
}

interface MatrixResp {
  employees: EmployeeRow[];
  goals: HrGoalRow[];
}

export default function GoalsMatrixPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const cycleId = params.id;

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [goals, setGoals] = useState<HrGoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [editing, setEditing] = useState<{ employee: EmployeeRow; goal?: HrGoalRow; category: KraCategory } | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/employee/hr/performance/cycles/${cycleId}/goals`)
      .then((r) => r.json())
      .then((j: MatrixResp) => {
        setEmployees(j.employees || []);
        setGoals(j.goals || []);
      })
      .catch(() => { setEmployees([]); setGoals([]); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [cycleId]);

  const byEmpCat = useMemo(() => {
    const m = new Map<string, HrGoalRow[]>();
    for (const g of goals) {
      const key = `${g.employee_id}::${g.kra_category}`;
      const arr = m.get(key) || [];
      arr.push(g);
      m.set(key, arr);
    }
    return m;
  }, [goals]);

  const weightByEmp = useMemo(() => {
    const m = new Map<number, number>();
    for (const g of goals) {
      m.set(g.employee_id, (m.get(g.employee_id) || 0) + (Number(g.weight) || 0));
    }
    return m;
  }, [goals]);

  const autoPull = async () => {
    setPulling(true);
    try {
      const res = await fetch(`/api/employee/hr/performance/cycles/${cycleId}/auto-pull`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || 'Auto-pull failed');
      }
    } finally {
      setPulling(false);
      load();
    }
  };

  return (
    <div className="p-8 max-w-7xl">
      <Link href={`/employee/hr/performance/cycle/${cycleId}`} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 mb-3">
        <ArrowLeft className="w-3 h-3" /> Back to Cycle
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Goals Matrix</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Rows = employees · Cols = KRA category · Click a cell to edit goals.
            </p>
          </div>
        </div>
        <button
          onClick={autoPull}
          disabled={pulling}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-60"
        >
          {pulling ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
          Auto-pull actuals
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 sticky left-0 bg-slate-50">Employee</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">DQ</th>
              {KRA_COLS.map((c) => (
                <th key={c.key} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, i) => {
              const totalWeight = weightByEmp.get(emp.id) || 0;
              const dq = Math.min(100, Math.round(totalWeight));
              return (
                <tr key={emp.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-3 sticky left-0 bg-inherit">
                    <div className="font-medium text-slate-900">{emp.full_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{emp.employee_code} · {emp.designation || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      dq === 100 ? 'bg-emerald-100 text-emerald-800' :
                      dq >= 80   ? 'bg-amber-100 text-amber-800' :
                                   'bg-rose-100 text-rose-800'
                    }`}>
                      {dq}%
                    </span>
                  </td>
                  {KRA_COLS.map((c) => {
                    const cellGoals = byEmpCat.get(`${emp.id}::${c.key}`) || [];
                    return (
                      <td key={c.key} className="px-3 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {cellGoals.map((g) => (
                            <button
                              key={g.id}
                              onClick={() => setEditing({ employee: emp, goal: g, category: c.key })}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-sky-50 border border-sky-200 hover:bg-sky-100 text-[11px]"
                              title={g.goal_title}
                            >
                              <span className="font-bold text-sky-800">{g.weight}%</span>
                              <span className="text-slate-700 truncate max-w-[110px]">{g.goal_title}</span>
                            </button>
                          ))}
                          <button
                            onClick={() => setEditing({ employee: emp, category: c.key })}
                            className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded border border-dashed border-slate-300 text-slate-500 hover:border-brand hover:text-brand text-[11px]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {!loading && employees.length === 0 && (
              <tr><td colSpan={2 + KRA_COLS.length} className="px-4 py-10 text-center text-sm text-slate-500">
                No active employees in this cycle.
              </td></tr>
            )}
            {loading && (
              <tr><td colSpan={2 + KRA_COLS.length} className="px-4 py-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" />
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <GoalEditModal
          cycleId={cycleId}
          employee={editing.employee}
          category={editing.category}
          goal={editing.goal}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function GoalEditModal({
  cycleId, employee, category, goal, onClose, onSaved,
}: {
  cycleId: string;
  employee: EmployeeRow;
  category: KraCategory;
  goal?: HrGoalRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(goal?.goal_title || '');
  const [desc, setDesc] = useState(goal?.goal_description || '');
  const [weight, setWeight] = useState<number>(goal?.weight || 10);
  const [metric, setMetric] = useState(goal?.target_metric || '');
  const [targetValue, setTargetValue] = useState<string>(goal?.target_value?.toString() || '');
  const [unit, setUnit] = useState(goal?.target_unit || '');
  const [autoSource, setAutoSource] = useState<AutoSource>(goal?.auto_source || 'manual');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const body = {
        employee_id: employee.id,
        kra_category: category,
        goal_title: title,
        goal_description: desc || null,
        weight,
        target_metric: metric || null,
        target_value: targetValue ? Number(targetValue) : null,
        target_unit: unit || null,
        auto_source: autoSource,
      };
      const url = goal
        ? `/api/employee/hr/performance/cycles/${cycleId}/goals/${goal.id}`
        : `/api/employee/hr/performance/cycles/${cycleId}/goals`;
      const method = goal ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) { setErr(j.error || 'Save failed'); return; }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!goal) return;
    if (!confirm('Delete this goal?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/employee/hr/performance/cycles/${cycleId}/goals/${goal.id}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json(); setErr(j.error || 'Delete failed'); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500">{employee.full_name} · {category}</div>
            <div className="text-sm font-bold text-slate-900">{goal ? 'Edit goal' : 'Add goal'}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        <form onSubmit={save} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Goal title *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Weight % *</label>
              <input type="number" min={1} max={100} required value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Auto source</label>
              <select value={autoSource} onChange={(e) => setAutoSource(e.target.value as AutoSource)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                {AUTO_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Metric</label>
              <input value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="AUM_INR" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target</label>
              <input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="500000" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Unit</label>
              <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="INR / count / %" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>

          {err && <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-sm">{err}</div>}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              {goal && (
                <button type="button" onClick={remove} className="text-xs text-rose-600 hover:text-rose-800 font-bold">
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
                {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
