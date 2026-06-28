'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Plus, Loader2, X, CheckCircle2 } from 'lucide-react';

interface Ticket {
  id: number;
  employee_id?: number;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  assigned_to: string | null;
  resolution: string | null;
  created_at: string;
  updated_at: string;
  hr_employees?: { full_name: string; employee_code: string; email: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  open:         'bg-blue-100 text-blue-800',
  in_progress:  'bg-amber-100 text-amber-800',
  resolved:     'bg-emerald-100 text-emerald-800',
  closed:       'bg-slate-200 text-slate-700',
  reopened:     'bg-violet-100 text-violet-800',
};

const PRIORITY_COLOR: Record<string, string> = {
  low:     'text-slate-500',
  normal:  'text-slate-700',
  high:    'text-amber-700 font-bold',
  urgent:  'text-rose-700 font-bold',
};

const CATEGORIES = ['payroll', 'leave', 'attendance', 'document', 'other'];

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [isHr, setIsHr] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: 'other', subject: '', description: '', priority: 'normal' });
  const [resolving, setResolving] = useState<number | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const refresh = () => {
    setLoading(true);
    fetch(`/api/employee/hr/helpdesk?scope=${scope}`)
      .then((r) => r.json())
      .then((j) => { setTickets(j.tickets || []); setIsHr(!!j.isHr); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [scope]);

  const submit = async () => {
    if (!form.subject || !form.description) {
      alert('Subject and description required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/employee/hr/helpdesk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error || 'Failed');
        return;
      }
      setShowForm(false);
      setForm({ category: 'other', subject: '', description: '', priority: 'normal' });
      refresh();
    } finally { setSubmitting(false); }
  };

  const act = async (id: number, action: 'assign' | 'resolve' | 'close' | 'reopen') => {
    const body: Record<string, unknown> = { id, action };
    if (action === 'resolve') {
      if (!resolutionText.trim()) {
        alert('Add a resolution note before resolving.');
        return;
      }
      body.resolution = resolutionText;
    }
    await fetch('/api/employee/hr/helpdesk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setResolving(null);
    setResolutionText('');
    refresh();
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employee/hr/me" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100 text-violet-700">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">HR Help Desk</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? 'Loading…' : `${tickets.length} ticket(s)`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isHr && (
            <select value={scope} onChange={(e) => setScope(e.target.value as 'mine' | 'all')} className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
              <option value="mine">My tickets</option>
              <option value="all">All tickets (HR)</option>
            </select>
          )}
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700">
            <Plus className="w-4 h-4" />
            Raise Ticket
          </button>
        </div>
      </div>

      {/* New ticket form */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-brand/40 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">New Ticket</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject *</label>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="One-line summary" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="What do you need help with?" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
            <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Tickets table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Subject</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Category</th>
              {scope === 'all' && <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employee</th>}
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Priority</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Raised</th>
              {isHr && <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Action</th>}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <>
                <tr key={t.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{t.subject}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-md">{t.description}</div>
                    {t.resolution && (
                      <div className="text-[11px] text-emerald-700 mt-1 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {t.resolution}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs uppercase text-slate-700">{t.category}</td>
                  {scope === 'all' && (
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-bold text-slate-900">{t.hr_employees?.full_name ?? '—'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{t.hr_employees?.employee_code}</div>
                    </td>
                  )}
                  <td className={`px-4 py-2.5 text-xs uppercase ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[t.status]}`}>{t.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  {isHr && (
                    <td className="px-4 py-2.5 text-right space-x-1">
                      {t.status === 'open' && (
                        <button onClick={() => act(t.id, 'assign')} className="text-[11px] text-brand font-semibold hover:underline">Take</button>
                      )}
                      {(t.status === 'in_progress' || t.status === 'reopened') && (
                        <button onClick={() => setResolving(t.id)} className="text-[11px] text-emerald-700 font-semibold hover:underline">Resolve</button>
                      )}
                      {t.status === 'resolved' && (
                        <>
                          <button onClick={() => act(t.id, 'close')} className="text-[11px] text-slate-600 font-semibold hover:underline">Close</button>
                          <button onClick={() => act(t.id, 'reopen')} className="text-[11px] text-violet-700 font-semibold hover:underline ml-1">Reopen</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
                {resolving === t.id && (
                  <tr key={`r-${t.id}`} className="bg-emerald-50 border-b border-emerald-200">
                    <td colSpan={isHr ? (scope === 'all' ? 7 : 6) : (scope === 'all' ? 6 : 5)} className="px-4 py-3">
                      <div className="flex gap-2">
                        <input
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          placeholder="Resolution note (will be shown to the employee)"
                          className="flex-1 px-3 py-1.5 rounded border border-emerald-300 text-sm"
                        />
                        <button onClick={() => act(t.id, 'resolve')} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">Mark Resolved</button>
                        <button onClick={() => { setResolving(null); setResolutionText(''); }} className="px-3 py-1.5 rounded text-xs text-slate-600 hover:bg-slate-100">Cancel</button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {!loading && tickets.length === 0 && (
              <tr><td colSpan={isHr ? (scope === 'all' ? 7 : 6) : (scope === 'all' ? 6 : 5)} className="px-4 py-10 text-center text-sm text-slate-500">No tickets yet. Click <b>Raise Ticket</b> to open one.</td></tr>
            )}
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
