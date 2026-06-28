'use client';

import { useEffect, useState, use as usePromise } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Trash2, UserPlus, X, ShieldAlert, CheckCircle2, CalendarClock } from 'lucide-react';
import { EMP_SECTIONS, type EmpField } from '@/lib/hr/employee-form-fields';
import { FALLBACK_OFFICES, type Office } from '@/lib/hr/offices';

interface FamilyMember {
  id: number;
  relation: string;
  name: string;
  pan: string | null;
  aadhaar_last4: string | null;
  dob: string | null;
  notes: string | null;
}

const RELATIONS = ['spouse', 'father', 'mother', 'child', 'sibling', 'father_in_law', 'mother_in_law', 'other'];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [offices, setOffices] = useState<Office[]>(FALLBACK_OFFICES);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [showFamForm, setShowFamForm] = useState(false);
  const [famForm, setFamForm] = useState<Partial<FamilyMember>>({});

  const load = () => {
    fetch(`/api/employee/hr/employees/${id}`)
      .then((r) => r.json())
      .then((j) => {
        setData(j.employee);
        setFamily(j.family || []);
      });
  };

  useEffect(() => {
    load();
    fetch('/api/employee/hr/offices').then((r) => r.json()).then((j) => { if (j.offices?.length) setOffices(j.offices); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key: string, value: string) => setData((d) => (d ? { ...d, [key]: value } : null));

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`/api/employee/hr/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json();
      if (res.ok) {
        setMsg('✅ Saved');
        setData(j.employee);
      } else {
        setMsg(`Failed: ${j.error || res.status}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const softDelete = async () => {
    if (!confirm('Mark this employee as Exited? Their records remain in the audit archive.')) return;
    const res = await fetch(`/api/employee/hr/employees/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/employee/hr/employees');
    else alert('Delete failed');
  };

  const addFamily = async () => {
    if (!famForm.relation || !famForm.name) {
      alert('Relation and name required');
      return;
    }
    const res = await fetch(`/api/employee/hr/employees/${id}/family`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(famForm),
    });
    if (res.ok) {
      setFamForm({});
      setShowFamForm(false);
      load();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error || 'Add failed');
    }
  };

  const removeFamily = async (fid: number) => {
    if (!confirm('Remove this family member from the roster?')) return;
    await fetch(`/api/employee/hr/employees/${id}/family?fid=${fid}`, { method: 'DELETE' });
    load();
  };

  if (!data) {
    return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }

  const renderField = (f: EmpField) => {
    const value = (data[f.key] as string | undefined) ?? '';
    const wClass = f.width === 'full' ? 'sm:col-span-2' : 'sm:col-span-1';
    const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand outline-none';

    let control: React.ReactNode;
    if (f.key === 'office_code') {
      control = (
        <select value={value} onChange={(e) => update(f.key, e.target.value)} className={`${inputClass} bg-white`}>
          <option value="">— Select office —</option>
          {offices.map((o) => <option key={o.code} value={o.code}>{o.shortLabel}</option>)}
        </select>
      );
    } else if (f.type === 'select') {
      const opts = f.options as Array<string | { value: string; label: string }> | undefined;
      control = (
        <select value={value} onChange={(e) => update(f.key, e.target.value)} className={`${inputClass} bg-white`}>
          <option value="">—</option>
          {opts?.map((o) => {
            const v = typeof o === 'string' ? o : o.value;
            const l = typeof o === 'string' ? o : o.label;
            return <option key={v} value={v}>{l}</option>;
          })}
        </select>
      );
    } else if (f.type === 'textarea') {
      control = <textarea value={value} onChange={(e) => update(f.key, e.target.value)} rows={2} className={`${inputClass} resize-none`} />;
    } else {
      control = (
        <input
          type={f.type === 'num' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
          value={value}
          onChange={(e) => update(f.key, e.target.value)}
          placeholder={f.placeholder}
          className={inputClass}
        />
      );
    }
    return (
      <div key={f.key} className={wClass}>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
          {f.label}{f.required && <span className="text-rose-600"> *</span>}
        </label>
        {control}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/employee/hr/employees" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{String(data.full_name || 'Employee')}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {String(data.employee_code)} · {String(data.entity)} · {String(data.designation || '—')}
            </p>
          </div>
        </div>
        <button
          onClick={softDelete}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-sm font-bold hover:bg-rose-50"
        >
          <Trash2 className="w-4 h-4" />
          Mark Exited
        </button>
      </div>

      {/* Probation banner — visible when employee is on probation */}
      <ProbationBanner employeeId={id} data={data} onChange={load} />

      {EMP_SECTIONS.map((sec) => (
        <div key={sec.title} className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-slate-900 mb-1">{sec.title}</h2>
          {sec.desc && <p className="text-xs text-slate-500 mb-3">{sec.desc}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {sec.fields.map(renderField)}
          </div>
        </div>
      ))}

      {/* Career & personal history captured at onboarding (read-only) */}
      <HistoryPanel data={data} />

      {/* Family roster — the POSP cross-check backbone */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Family Roster</h2>
            <p className="text-xs text-slate-500">Used by the POSP cross-check engine (Phase 6) to detect related-party arrangements.</p>
          </div>
          <button
            onClick={() => setShowFamForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-700"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Member
          </button>
        </div>

        {showFamForm && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900">Add Family Member</span>
              <button onClick={() => { setShowFamForm(false); setFamForm({}); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={famForm.relation || ''}
                onChange={(e) => setFamForm({ ...famForm, relation: e.target.value })}
                className="px-2 py-1.5 rounded border border-slate-300 text-xs bg-white"
              >
                <option value="">Relation</option>
                {RELATIONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
              <input
                placeholder="Name *"
                value={famForm.name || ''}
                onChange={(e) => setFamForm({ ...famForm, name: e.target.value })}
                className="px-2 py-1.5 rounded border border-slate-300 text-xs"
              />
              <input
                placeholder="PAN"
                value={famForm.pan || ''}
                onChange={(e) => setFamForm({ ...famForm, pan: e.target.value })}
                className="px-2 py-1.5 rounded border border-slate-300 text-xs"
              />
              <input
                placeholder="Aadhaar last 4"
                value={famForm.aadhaar_last4 || ''}
                onChange={(e) => setFamForm({ ...famForm, aadhaar_last4: e.target.value })}
                className="px-2 py-1.5 rounded border border-slate-300 text-xs"
              />
            </div>
            <button
              onClick={addFamily}
              className="mt-2 px-3 py-1 rounded bg-brand text-white text-xs font-bold hover:bg-brand-700"
            >
              Add
            </button>
          </div>
        )}

        {family.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-4">
            No family members on roster. Add at least the spouse and any siblings — they are the highest-risk POSP cross-check candidates.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="text-left py-1.5">Relation</th>
                <th className="text-left py-1.5">Name</th>
                <th className="text-left py-1.5">PAN</th>
                <th className="text-left py-1.5">Aadhaar (last 4)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {family.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="py-1.5 capitalize">{m.relation.replace(/_/g, ' ')}</td>
                  <td className="py-1.5 font-semibold">{m.name}</td>
                  <td className="py-1.5 font-mono text-slate-600">{m.pan || '—'}</td>
                  <td className="py-1.5 font-mono text-slate-600">{m.aadhaar_last4 || '—'}</td>
                  <td className="py-1.5 text-right">
                    <button onClick={() => removeFamily(m.id)} className="text-rose-600 hover:underline">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between shadow-md">
        {msg && <span className={`text-xs ${msg.startsWith('✅') ? 'text-emerald-700 font-bold' : 'text-rose-700'}`}>{msg}</span>}
        <div className="ml-auto">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/** Probation banner — only renders for employees with employment_status='probation'
 *  or already-confirmed employees who came off probation in the last 30d (as a
 *  positive reinforcement message). Calls /api/.../probation for actions. */
function ProbationBanner({
  employeeId, data, onChange,
}: {
  employeeId: string;
  data: Record<string, unknown>;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const status = String(data.employment_status || '');
  const probationEnd = data.probation_end_date ? String(data.probation_end_date) : null;
  const probationMonths = Number(data.probation_months || 0);
  const extCount = Number(data.probation_extended_count || 0);
  const empType = String(data.employment_type || 'permanent');

  if (status !== 'probation') return null;
  if (empType === 'intern' || empType === 'consultant') return null;

  const daysLeft = probationEnd ? Math.ceil((new Date(probationEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;
  const overdue = daysLeft !== null && daysLeft < 0;

  const act = async (body: Record<string, unknown>) => {
    setBusy(true); setErr('');
    try {
      const res = await fetch(`/api/employee/hr/employees/${employeeId}/probation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error || 'Failed'); return; }
      onChange();
    } finally { setBusy(false); }
  };

  return (
    <div className={`rounded-xl border p-4 mb-4 ${overdue ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className={`text-[10px] font-extrabold uppercase tracking-wider ${overdue ? 'text-rose-700' : 'text-amber-800'}`}>
              {overdue ? 'PROBATION EXPIRED — confirm decision needed' : 'On Probation'}
            </div>
            {extCount > 0 && <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase tracking-wider">Extended {extCount}×</span>}
          </div>
          <div className="text-sm text-slate-700 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="w-4 h-4 text-slate-500" />
              Probation period: <b>{probationMonths} months</b>
            </span>
            {probationEnd && (
              <span className="inline-flex items-center gap-1">·
                <span>Ends <b>{new Date(probationEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</b></span>
                {daysLeft !== null && (
                  <span className={overdue ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                    ({overdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`})
                  </span>
                )}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            During probation, paid leave (EL/SL/CL) is not entitled. Only LOP allowed. On confirmation, leave balances auto-credit pro-rata for the remainder of FY.
          </p>
          {err && <p className="text-xs text-rose-700 font-semibold mt-2">{err}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => { if (confirm(`Confirm ${String(data.full_name)} as a permanent employee from today?`)) act({ action: 'confirm' }); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Now
            </button>
            <button
              disabled={busy}
              onClick={() => { const m = prompt('Extend probation by how many months?', '3'); if (m) act({ action: 'extend', months: Number(m), notes: 'Performance review pending' }); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-800 text-xs font-bold hover:bg-amber-50 disabled:opacity-50"
            >
              Extend +N months
            </button>
            <button
              disabled={busy}
              onClick={() => { const m = prompt('Shorten probation by how many months?', '1'); if (m) act({ action: 'shorten', months: Number(m), notes: 'Performance excellent' }); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              Shorten −N months
            </button>
            <button
              disabled={busy}
              onClick={() => { if (confirm(`Mark ${String(data.full_name)} as NOT confirmed and trigger separation? This cannot be undone via this banner.`)) act({ action: 'not_confirmed', notes: 'Not confirmed at end of probation' }); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-rose-700 text-xs font-bold hover:bg-rose-50 disabled:opacity-50 ml-auto"
            >
              Not confirmed — start exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Read-only display of the career & personal history the joiner self-filled at
 *  onboarding (education / employment / emergency contacts JSONB). Renders nothing
 *  for older employees who pre-date migration 048 (empty arrays). */
function HistoryPanel({ data }: { data: Record<string, unknown> }) {
  type Row = Record<string, string | undefined>;
  const edu = (Array.isArray(data.education) ? data.education : []) as Row[];
  const emp = (Array.isArray(data.employment) ? data.employment : []) as Row[];
  const ec = ((Array.isArray(data.emergency_contacts) ? data.emergency_contacts : []) as Row[]).filter((c) => c.name || c.mobile);
  if (!edu.length && !emp.length && !ec.length) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
      <h2 className="text-sm font-bold text-slate-900 mb-1">Career &amp; Personal History</h2>
      <p className="text-xs text-slate-500 mb-3">Self-filled by the employee during onboarding. Read-only.</p>

      {edu.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Education</div>
          <div className="space-y-1.5">
            {edu.map((e, i) => (
              <div key={i} className="text-sm text-slate-700 border border-slate-100 rounded px-3 py-1.5">
                <b>{e.qualification || '—'}</b> · {e.institution || '—'} · {e.board || '—'} · {e.year || '—'} · {e.score || '—'}
              </div>
            ))}
          </div>
        </div>
      )}

      {emp.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Past Employment</div>
          <div className="space-y-1.5">
            {emp.map((e, i) => (
              <div key={i} className="text-sm text-slate-700 border border-slate-100 rounded px-3 py-1.5">
                <b>{e.company || '—'}</b> · {e.designation || '—'} · {e.fromDate || '—'} → {e.toDate || '—'}
                {e.lastCTC ? ` · CTC ${e.lastCTC}` : ''}{e.reason ? ` · ${e.reason}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {ec.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Emergency Contacts</div>
          <div className="space-y-1.5">
            {ec.map((c, i) => (
              <div key={i} className="text-sm text-slate-700 border border-slate-100 rounded px-3 py-1.5">
                <b>{c.name || '—'}</b> ({c.relationship || '—'}) · {c.mobile || '—'}{c.email ? ` · ${c.email}` : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
