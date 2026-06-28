'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { EMP_SECTIONS, type EmpField } from '@/lib/hr/employee-form-fields';
import { FALLBACK_OFFICES, type Office } from '@/lib/hr/offices';

export default function NewEmployeePage() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, unknown>>({
    entity: 'TIB',
    status: 'new',
    date_of_joining: new Date().toISOString().slice(0, 10),
  });
  const [offices, setOffices] = useState<Office[]>(FALLBACK_OFFICES);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/employee/hr/offices').then((r) => r.json()).then((j) => { if (j.offices?.length) setOffices(j.offices); });
  }, []);

  const update = (key: string, value: string) => setData((d) => ({ ...d, [key]: value }));

  const submit = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/employee/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(`Save failed: ${j.error || res.status}`);
        return;
      }
      router.push(`/employee/hr/employees/${j.employee.id}`);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: EmpField) => {
    const value = (data[f.key] as string | undefined) ?? '';
    const wClass = f.width === 'full' ? 'sm:col-span-2' : 'sm:col-span-1';
    const inputClass =
      'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none';

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
      control = (
        <textarea
          value={value}
          onChange={(e) => update(f.key, e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
          placeholder={f.placeholder}
        />
      );
    } else {
      control = (
        <input
          type={f.type === 'num' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
          value={value}
          onChange={(e) => update(f.key, e.target.value)}
          placeholder={f.placeholder}
          className={inputClass}
        />
      );
    }

    return (
      <div key={f.key} className={wClass}>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          {f.label}{f.required && <span className="text-rose-600"> *</span>}
        </label>
        {control}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/employee/hr/employees" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">New Employee</h1>
            <p className="text-sm text-slate-500 mt-0.5">Add to Employee Master</p>
          </div>
        </div>
      </div>

      {EMP_SECTIONS.map((sec) => (
        <div key={sec.title} className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="text-sm font-bold text-slate-900 mb-1">{sec.title}</h2>
          {sec.desc && <p className="text-xs text-slate-500 mb-3">{sec.desc}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {sec.fields.map(renderField)}
          </div>
        </div>
      ))}

      <div className="sticky bottom-0 bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between shadow-md">
        {msg && <span className="text-xs text-rose-700">{msg}</span>}
        <div className="ml-auto flex gap-2">
          <Link href="/employee/hr/employees" className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </Link>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Employee
          </button>
        </div>
      </div>
    </div>
  );
}
