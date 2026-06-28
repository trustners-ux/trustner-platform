'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ClipboardCheck, Loader2, ExternalLink } from 'lucide-react';

interface OnbRow {
  id: number;
  token: string;
  entity: 'TAS' | 'TIB';
  candidate_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  status: string;
  date_of_joining: string | null;
  created_at: string;
  employee_id: number | null;
}

const STATUS_COLOR: Record<string, string> = {
  invited:            'bg-blue-100 text-blue-800',
  in_progress:        'bg-amber-100 text-amber-800',
  submitted:          'bg-purple-100 text-purple-800',
  under_review:       'bg-violet-100 text-violet-800',
  changes_requested:  'bg-orange-100 text-orange-800',
  approved:           'bg-emerald-100 text-emerald-800',
  rejected:           'bg-rose-100 text-rose-800',
  expired:            'bg-slate-200 text-slate-700',
};

export default function OnboardingListPage() {
  const [rows, setRows] = useState<OnbRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const refresh = () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : '';
    fetch(`/api/employee/hr/onboarding${qs}`)
      .then((r) => r.json())
      .then((j) => setRows(j.rows || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Onboarding</h1>
            <p className="text-sm text-slate-500 mt-0.5">{rows.length} record(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value="">All</option>
            <option value="invited">Invited</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <Link
            href="/employee/hr/onboarding/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            New Invite
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Candidate</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Entity</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Designation</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">DOJ</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Sent</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2.5">
                  <Link href={`/employee/hr/onboarding/${r.id}`} className="font-medium text-slate-900 hover:text-brand">
                    {r.candidate_name}
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
                <td className="px-4 py-2.5 text-slate-700 text-xs">{r.designation || '—'}</td>
                <td className="px-4 py-2.5 text-xs text-slate-600 font-mono">{r.date_of_joining || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[r.status]}`}>
                    {r.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <a
                    href={`/onboarding/${r.token}`}
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Open link <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No onboarding records. Click <b>New Invite</b> to send one.</td></tr>
            )}
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
