'use client';

/**
 * Holiday Admin — HR admin can add/edit/delete holidays with multi-office
 * scoping. Holidays default to "All offices" unless specific offices are
 * picked. Solves Ram's call-out: "holiday in Assam may not be an holiday in
 * Kolkata" — Bohag Bihu → tag Guwahati + Tezpur only; Poila Boishakh →
 * Kolkata only; etc.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, Loader2, MapPin, X } from 'lucide-react';
import { FALLBACK_OFFICES, type Office } from '@/lib/hr/offices';

interface Holiday {
  id: number;
  fy: string;
  holiday_date: string;
  name: string;
  type: 'national' | 'festival' | 'regional' | 'restricted';
  entity: 'TAS' | 'TIB' | null;
  state: string | null;
  office_codes: string[] | null;
  description: string | null;
}

const TYPES = ['national', 'festival', 'regional', 'restricted'] as const;

const blankForm = (fy: string): Partial<Holiday> => ({
  fy,
  holiday_date: '',
  name: '',
  type: 'festival',
  office_codes: null,
  state: null,
  entity: null,
  description: '',
});

export default function HolidayAdminPage() {
  const [fy, setFy] = useState('FY2026');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [offices, setOffices] = useState<Office[]>(FALLBACK_OFFICES);
  const [editing, setEditing] = useState<Partial<Holiday> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`/api/employee/hr/holidays?fy=${fy}`)
      .then((r) => r.json())
      .then((j) => setHolidays(j.holidays || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [fy]);
  useEffect(() => {
    fetch('/api/employee/hr/offices')
      .then((r) => r.json())
      .then((j) => { if (j.offices?.length) setOffices(j.offices); });
  }, []);

  const toggleOffice = (code: string) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const cur = prev.office_codes || [];
      const next = cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code];
      return { ...prev, office_codes: next.length === 0 ? null : next };
    });
  };

  const save = async () => {
    if (!editing?.name || !editing.holiday_date || !editing.type) {
      setMsg('Name, date, and type are required.');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const res = await fetch('/api/employee/hr/holidays', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(`Save failed: ${j.error || res.status}`);
        return;
      }
      setMsg(`✅ Saved`);
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (h: Holiday) => {
    if (!confirm(`Delete "${h.name}" on ${h.holiday_date}?`)) return;
    const res = await fetch(`/api/employee/hr/holidays?id=${h.id}`, { method: 'DELETE' });
    if (res.ok) load();
    else {
      const j = await res.json().catch(() => ({}));
      alert(`Delete failed: ${j.error || res.status}`);
    }
  };

  const officeChips = (codes: string[] | null) => {
    if (!codes || codes.length === 0) return <span className="text-xs text-slate-500 italic">All offices</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {codes.map((c) => {
          const o = offices.find((x) => x.code === c);
          return (
            <span key={c} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {o?.city || c}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/employee/hr/holidays" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Holiday Admin</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Add holidays per office, or leave office selection blank for all 5 offices.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={fy}
            onChange={(e) => setFy(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="FY2026">FY 2026-27</option>
            <option value="FY2027">FY 2027-28</option>
          </select>
          <button
            onClick={() => setEditing(blankForm(fy))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            Add Holiday
          </button>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="bg-white rounded-xl border-2 border-brand/40 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              {editing.id ? 'Edit Holiday' : 'New Holiday'}
            </h2>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name</label>
              <input
                type="text"
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Bohag Bihu Day 1"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
              <input
                type="date"
                value={editing.holiday_date || ''}
                onChange={(e) => setEditing({ ...editing, holiday_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
              <select
                value={editing.type || 'festival'}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as Holiday['type'] })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description (optional)</label>
              <input
                type="text"
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Office multi-select — Ram's explicit ask */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                <MapPin className="w-3 h-3 inline mr-1" />
                Applies To
              </label>
              <div className="flex gap-1 text-[10px]">
                <button
                  onClick={() => setEditing({ ...editing, office_codes: null })}
                  className="px-2 py-0.5 rounded text-emerald-700 hover:bg-emerald-100 font-semibold"
                >
                  All offices
                </button>
                <button
                  onClick={() => setEditing({ ...editing, office_codes: [] })}
                  className="px-2 py-0.5 rounded text-rose-700 hover:bg-rose-100 font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              {offices.map((o) => {
                const checked = !editing.office_codes
                  ? false
                  : (editing.office_codes as string[]).includes(o.code);
                const allOffices = !editing.office_codes;
                return (
                  <label
                    key={o.code}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs ${
                      allOffices || checked ? 'bg-emerald-100 text-emerald-900' : 'bg-white border border-slate-200 text-slate-700 hover:border-brand'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={allOffices || checked}
                      disabled={allOffices}
                      onChange={() => toggleOffice(o.code)}
                      className="rounded border-slate-300"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{o.city}</div>
                      <div className="text-[10px] text-slate-500">{o.state}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5">
              {!editing.office_codes && '✓ This holiday applies to all 5 offices.'}
              {editing.office_codes && editing.office_codes.length === 0 && '⚠ No offices selected — pick at least one or click "All offices".'}
              {editing.office_codes && editing.office_codes.length > 0 && `Applies to ${editing.office_codes.length} office(s).`}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {msg && (
              <span className={`text-xs self-center mr-auto ${msg.startsWith('✅') ? 'text-emerald-700 font-bold' : 'text-rose-700'}`}>
                {msg}
              </span>
            )}
            <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Holiday list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Date</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Applies To</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((h, i) => (
              <tr key={h.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{h.holiday_date}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900">{h.name}</td>
                <td className="px-4 py-2.5 text-xs text-slate-700 uppercase">{h.type}</td>
                <td className="px-4 py-2.5">{officeChips(h.office_codes)}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => setEditing(h)}
                    className="text-xs text-brand font-semibold hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(h)}
                    className="text-xs text-rose-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && holidays.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  No holidays for {fy}. Click <b>Add Holiday</b> to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
