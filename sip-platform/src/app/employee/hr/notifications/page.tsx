'use client';

import { useEffect, useState } from 'react';
import { Bell, Loader2, Check, CheckCheck, Send, Megaphone } from 'lucide-react';

interface Notif {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  created_by: string | null;
}

export default function NotificationsPage() {
  const [rows, setRows] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [canBroadcast, setCanBroadcast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bc, setBc] = useState({ title: '', body: '', entities: ['TAS', 'TIB'] as string[] });
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/employee/hr/notifications')
      .then((r) => r.json())
      .then((j) => { setRows(j.rows || []); setUnread(j.unread || 0); setCanBroadcast(!!j.canBroadcast); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markRead = async (body: Record<string, unknown>) => {
    await fetch('/api/employee/hr/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    load();
  };

  const toggleEntity = (e: string) =>
    setBc((f) => ({ ...f, entities: f.entities.includes(e) ? f.entities.filter((x) => x !== e) : [...f.entities, e] }));

  const broadcast = async () => {
    if (!bc.title.trim()) { alert('Title required.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/employee/hr/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bc) });
      const j = await res.json();
      if (!res.ok) { alert(`Failed: ${j.error || res.status}`); return; }
      alert(`Sent to ${j.notified} employee(s).`);
      setBc({ title: '', body: '', entities: ['TAS', 'TIB'] });
      load();
    } finally { setBusy(false); }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-brand" />
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Notification Center</h1>
            <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading…' : unread > 0 ? `${unread} unread` : 'All caught up'}</p>
          </div>
        </div>
        {unread > 0 && (
          <button onClick={() => markRead({ all: true })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {canBroadcast && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Megaphone className="w-4 h-4 text-brand" /> Broadcast a notification</h2>
          <input value={bc.title} onChange={(e) => setBc({ ...bc, title: e.target.value })} placeholder="Notification title"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm mb-2 focus:border-brand outline-none" />
          <textarea value={bc.body} onChange={(e) => setBc({ ...bc, body: e.target.value })} placeholder="Message (optional)" rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm mb-3 focus:border-brand outline-none" />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">To:
              {['TAS', 'TIB'].map((e) => (
                <label key={e} className="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={bc.entities.includes(e)} onChange={() => toggleEntity(e)} /> {e}</label>
              ))}
            </div>
            <button onClick={broadcast} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to staff
            </button>
          </div>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" /> No notifications yet.
        </div>
      )}

      <div className="space-y-2">
        {rows.map((n) => (
          <div key={n.id} className={`rounded-xl border p-4 flex items-start gap-3 ${n.read_at ? 'bg-white border-slate-200' : 'bg-blue-50/50 border-blue-200'}`}>
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read_at ? 'bg-transparent' : 'bg-blue-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900">{n.title}</div>
              {n.body && <p className="text-sm text-slate-600 whitespace-pre-wrap mt-0.5">{n.body}</p>}
              <div className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}{n.created_by ? ` · ${n.created_by}` : ''}</div>
            </div>
            {!n.read_at && (
              <button onClick={() => markRead({ id: n.id })} title="Mark read" className="text-slate-400 hover:text-brand"><Check className="w-4 h-4" /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
