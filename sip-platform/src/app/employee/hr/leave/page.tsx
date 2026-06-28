'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, Calendar, Clock } from 'lucide-react';

interface Application {
  id: number;
  from_date: string;
  to_date: string;
  is_half_day: boolean;
  days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'withdrawn';
  applied_at: string;
  approved_by: string | null;
  hr_leave_types: { code: string; name: string } | null;
}

interface Balance {
  fy: string;
  credited: number;
  carried_forward: number;
  used: number;
  available: number;
  hr_leave_types: { code: string; name: string } | null;
}

interface LeaveType {
  id: number;
  code: string;
  name: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  approved:  'bg-emerald-100 text-emerald-800',
  rejected:  'bg-rose-100 text-rose-800',
  cancelled: 'bg-slate-100 text-slate-600',
  withdrawn: 'bg-slate-100 text-slate-600',
};

export default function LeavePage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leave_type_id: '',
    from_date: '',
    to_date: '',
    is_half_day: false,
    half_day_session: 'first',
    reason: '',
  });

  const refresh = () => {
    fetch('/api/employee/hr/leave').then((r) => r.json()).then((j) => setApps(j.applications || []));
    fetch('/api/employee/hr/leave?balances=1').then((r) => r.json()).then((j) => setBalances(j.balances || []));
  };

  useEffect(() => {
    refresh();
    // Best-effort: fetch leave types so the dropdown is populated.
    // We don't have a list endpoint yet — use balances' embedded types as a starter list.
  }, []);

  useEffect(() => {
    // Derive distinct leave types from balances for the dropdown
    const seen = new Set<string>();
    const list: LeaveType[] = [];
    balances.forEach((b) => {
      if (b.hr_leave_types && !seen.has(b.hr_leave_types.code)) {
        seen.add(b.hr_leave_types.code);
        list.push({ id: 0, code: b.hr_leave_types.code, name: b.hr_leave_types.name });
      }
    });
    setTypes(list);
  }, [balances]);

  const submit = async () => {
    if (!form.leave_type_id || !form.from_date || !form.to_date) {
      alert('Pick leave type and dates');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/employee/hr/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(`Submit failed: ${j.error || res.status}`);
        return;
      }
      setShowForm(false);
      setForm({ leave_type_id: '', from_date: '', to_date: '', is_half_day: false, half_day_session: 'first', reason: '' });
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Leave</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Apply for leave &middot; track balance &middot; view history
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          Apply Leave
        </button>
      </div>

      {/* Balance cards */}
      {balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {balances.map((b, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{b.hr_leave_types?.code || '?'}</div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">{Number(b.available).toFixed(1)}</div>
              <div className="text-[10px] text-slate-400 mt-1">of {Number(b.credited + b.carried_forward).toFixed(1)} days</div>
            </div>
          ))}
        </div>
      )}

      {/* New application inline form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3">New Leave Application</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Leave Type</label>
              <select
                value={form.leave_type_id}
                onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="">Select…</option>
                {types.map((t) => <option key={t.code} value={t.id}>{t.code} — {t.name}</option>)}
              </select>
              <div className="text-[10px] text-slate-400 mt-1">
                {types.length === 0 && 'No leave types loaded — HR must first create your employee record + leave balances.'}
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_half_day}
                  onChange={(e) => setForm({ ...form, is_half_day: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Half-day
              </label>
              {form.is_half_day && (
                <select
                  value={form.half_day_session}
                  onChange={(e) => setForm({ ...form, half_day_session: e.target.value })}
                  className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                >
                  <option value="first">First half</option>
                  <option value="second">Second half</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From</label>
              <input
                type="date"
                value={form.from_date}
                onChange={(e) => setForm({ ...form, from_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To</label>
              <input
                type="date"
                value={form.to_date}
                onChange={(e) => setForm({ ...form, to_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              placeholder="Optional"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Application history */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2 text-sm font-bold text-slate-700">
          <Clock className="w-4 h-4" />
          Recent Applications
        </div>
        {apps.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No leave applications yet. Click <b>Apply Leave</b> above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Type</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">From</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">To</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Days</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Applied</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a, i) => (
                <tr key={a.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{a.hr_leave_types?.code || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-700">{a.from_date}</td>
                  <td className="px-4 py-2.5 text-slate-700">{a.to_date}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{a.days}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {new Date(a.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
