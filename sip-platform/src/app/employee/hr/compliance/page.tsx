'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Search, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Audit {
  id: number;
  posp_candidate_pan: string | null;
  posp_candidate_name: string;
  posp_candidate_mobile: string | null;
  matched_employee_id: number | null;
  matched_family_id: number | null;
  match_type: string;
  match_score: number;
  status: 'flagged' | 'approved_exception' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  flagged:            'bg-amber-100 text-amber-800',
  approved_exception: 'bg-emerald-100 text-emerald-800',
  rejected:           'bg-rose-100 text-rose-800',
};

export default function CompliancePage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [filter, setFilter] = useState('flagged');
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const refresh = () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : '';
    fetch(`/api/employee/hr/posp-crosscheck${qs}`)
      .then((r) => r.json())
      .then((j) => setAudits(j.rows || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  const act = async (id: number, action: 'approve_exception' | 'reject') => {
    if (!reviewNote.trim()) {
      alert('Please add a review note before marking this audit.');
      return;
    }
    await fetch('/api/employee/hr/posp-crosscheck', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, notes: reviewNote }),
    });
    setReviewing(null);
    setReviewNote('');
    refresh();
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Compliance — POSP Cross-Check Audit</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Every POSP candidate cross-checked against employee + family roster. Drives Zakir/Gourab/Sukanta prevention.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
            <option value="">All</option>
            <option value="flagged">Flagged (pending review)</option>
            <option value="approved_exception">Approved Exception</option>
            <option value="rejected">Rejected</option>
          </select>
          <Link
            href="/employee/hr/compliance/posp-crosscheck"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700"
          >
            <Search className="w-4 h-4" />
            New Check
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Candidate</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">PAN</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Match Type</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Score</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Checked</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((a, i) => (
              <tr key={a.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-slate-900">{a.posp_candidate_name}</div>
                  {a.posp_candidate_mobile && <div className="text-[11px] text-slate-500">{a.posp_candidate_mobile}</div>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{a.posp_candidate_pan || '—'}</td>
                <td className="px-4 py-2.5 text-xs text-slate-700">{a.match_type.replace('_', ' ')}</td>
                <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                  {a.match_score}{a.match_score > 0 ? '%' : ''}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[a.status]}`}>
                    {a.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {new Date(a.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {a.status === 'flagged' ? (
                    <button onClick={() => { setReviewing(a.id); setReviewNote(''); }} className="text-xs text-brand font-semibold hover:underline">
                      Review
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      {a.reviewed_by ? `by ${a.reviewed_by.split('@')[0]}` : ''}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {reviewing && (
              <tr>
                <td colSpan={7} className="px-4 py-3 bg-amber-50 border-b border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-1" />
                    <div className="flex-1">
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Reason for approval exception / rejection (required for audit)"
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm mb-2"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => act(reviewing, 'approve_exception')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Exception
                        </button>
                        <button onClick={() => act(reviewing, 'reject')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-700">
                          <XCircle className="w-3.5 h-3.5" />
                          Reject POSP
                        </button>
                        <button onClick={() => setReviewing(null)} className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100">Cancel</button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {!loading && audits.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No audit records.</td></tr>
            )}
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
