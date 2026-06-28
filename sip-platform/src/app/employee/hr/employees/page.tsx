'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Users, Loader2 } from 'lucide-react';
import { FALLBACK_OFFICES, type Office, officeLabel } from '@/lib/hr/offices';

interface Employee {
  id: number;
  employee_code: string;
  entity: 'TAS' | 'TIB';
  full_name: string;
  designation: string | null;
  department: string | null;
  location: string | null;
  office_code: string | null;
  date_of_joining: string | null;
  status: 'new' | 'active' | 'on_notice' | 'exited';
  email: string | null;
  phone: string | null;
  total_ctc_monthly: number | null;
}

const STATUS_COLOR: Record<string, string> = {
  new:        'bg-blue-100 text-blue-800',
  active:     'bg-emerald-100 text-emerald-800',
  on_notice:  'bg-amber-100 text-amber-800',
  exited:     'bg-slate-200 text-slate-700',
};

export default function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState('');
  const [status, setStatus] = useState('active');
  const [offices, setOffices] = useState<Office[]>(FALLBACK_OFFICES);

  useEffect(() => {
    fetch('/api/employee/hr/offices').then((r) => r.json()).then((j) => { if (j.offices?.length) setOffices(j.offices); });
  }, []);

  const refresh = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (entity) params.set('entity', entity);
    if (status) params.set('status', status);
    fetch(`/api/employee/hr/employees?${params}`)
      .then((r) => r.json())
      .then((j) => {
        setRows(j.rows || []);
        setTotal(j.total || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, entity, status]);

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 text-violet-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Employee Master</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? 'Loading…' : `${total} employee${total === 1 ? '' : 's'} on file`}
            </p>
          </div>
        </div>
        <Link
          href="/employee/hr/employees/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          New Employee
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name, code, email, PAN…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand outline-none"
          />
        </div>
        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="">All Entities</option>
          <option value="TAS">TAS</option>
          <option value="TIB">TIB</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="active">Active</option>
          <option value="on_notice">On Notice</option>
          <option value="exited">Exited</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Entity</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Designation</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Office</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">DOJ</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.employee_code}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/employee/hr/employees/${r.id}`} className="font-medium text-slate-900 hover:text-brand">
                    {r.full_name}
                  </Link>
                  <div className="text-[11px] text-slate-500">{r.email}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    r.entity === 'TAS' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {r.entity}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-700">{r.designation || '—'}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600">{officeLabel(r.office_code, offices)}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600 font-mono">{r.date_of_joining || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  No employees found. Click <b>New Employee</b> to add the first one.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
