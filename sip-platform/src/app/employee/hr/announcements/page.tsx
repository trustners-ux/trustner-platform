'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Plus, Pin, Archive, Trash2, Send, Loader2, X } from 'lucide-react';

interface Announcement {
  id: number;
  title: string;
  body: string;
  entities: string[];
  category: string;
  pinned: boolean;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_by: string;
  created_at: string;
}

const CATEGORIES = ['general', 'policy', 'event', 'celebration', 'urgent'];
const CAT_STYLE: Record<string, string> = {
  general: 'bg-slate-100 text-slate-700', policy: 'bg-blue-100 text-blue-800',
  event: 'bg-violet-100 text-violet-800', celebration: 'bg-emerald-100 text-emerald-800',
  urgent: 'bg-rose-100 text-rose-800',
};

export default function AnnouncementsPage() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'general', entities: ['TAS', 'TIB'] as string[], pinned: false });

  const load = () => {
    setLoading(true);
    fetch('/api/employee/hr/announcements')
      .then((r) => r.json())
      .then((j) => { setRows(j.rows || []); setCanManage(!!j.canManage); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleEntity = (e: string) =>
    setForm((f) => ({ ...f, entities: f.entities.includes(e) ? f.entities.filter((x) => x !== e) : [...f.entities, e] }));

  const create = async (status: 'draft' | 'published') => {
    if (!form.title.trim() || !form.body.trim()) { alert('Title and body are required.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/employee/hr/announcements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status }),
      });
      const j = await res.json();
      if (!res.ok) { alert(`Failed: ${j.error || res.status}`); return; }
      if (status === 'published' && j.notified) alert(`Published and notified ${j.notified} employee(s).`);
      setForm({ title: '', body: '', category: 'general', entities: ['TAS', 'TIB'], pinned: false });
      setShowForm(false);
      load();
    } finally { setBusy(false); }
  };

  const patch = async (id: number, body: Record<string, unknown>) => {
    const res = await fetch('/api/employee/hr/announcements', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }),
    });
    const j = await res.json();
    if (!res.ok) { alert(`Failed: ${j.error || res.status}`); return; }
    if (body.status === 'published' && j.notified) alert(`Published and notified ${j.notified} employee(s).`);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`/api/employee/hr/announcements?id=${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-brand" />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Announcements</h1>
            <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading…' : `${rows.length} on the board`}</p>
          </div>
        </div>
        {canManage && !showForm && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {canManage && showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">New Announcement</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm mb-2 focus:border-brand outline-none" />
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write the announcement…" rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm mb-3 focus:border-brand outline-none" />
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <label className="text-xs text-slate-600">Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="ml-2 px-2 py-1 rounded border border-slate-300 text-xs bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-600">Audience:
              {['TAS', 'TIB'].map((e) => (
                <label key={e} className="inline-flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={form.entities.includes(e)} onChange={() => toggleEntity(e)} /> {e}
                </label>
              ))}
            </div>
            <label className="inline-flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin to top
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => create('draft')} disabled={busy} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Save Draft</button>
            <button onClick={() => create('published')} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publish &amp; Notify
            </button>
          </div>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          No announcements yet.{canManage ? ' Click “New Announcement” to post the first one.' : ''}
        </div>
      )}

      <div className="space-y-3">
        {rows.map((a) => (
          <div key={a.id} className={`bg-white rounded-xl border p-5 ${a.pinned ? 'border-amber-300' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {a.pinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                  <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${CAT_STYLE[a.category] || CAT_STYLE.general}`}>{a.category}</span>
                  {a.status !== 'published' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">{a.status}</span>
                  )}
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{a.body}</p>
                <div className="text-[11px] text-slate-400 mt-2">
                  {a.entities.join(' · ')} · {a.published_at ? new Date(a.published_at).toLocaleDateString('en-IN') : 'unpublished'} · by {a.created_by}
                </div>
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                {a.status !== 'published' && (
                  <button onClick={() => patch(a.id, { status: 'published' })} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"><Send className="w-3.5 h-3.5" /> Publish</button>
                )}
                <button onClick={() => patch(a.id, { pinned: !a.pinned })} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:underline"><Pin className="w-3.5 h-3.5" /> {a.pinned ? 'Unpin' : 'Pin'}</button>
                {a.status !== 'archived' && (
                  <button onClick={() => patch(a.id, { status: 'archived' })} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:underline"><Archive className="w-3.5 h-3.5" /> Archive</button>
                )}
                <button onClick={() => remove(a.id)} className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline ml-auto"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
