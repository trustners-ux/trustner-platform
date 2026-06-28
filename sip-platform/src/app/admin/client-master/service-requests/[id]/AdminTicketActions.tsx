'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  id: number;
  status: string;
  priority: string;
  assigned_to_email: string | null;
  resolution_notes: string | null;
}

const STATUSES = [
  { value: 'open',               label: 'Open' },
  { value: 'in_progress',        label: 'In progress' },
  { value: 'waiting_on_client',  label: 'Waiting on client' },
  { value: 'resolved',           label: 'Resolved' },
  { value: 'cancelled',          label: 'Cancelled' },
  { value: 'escalated',          label: 'Escalated' },
];

export default function AdminTicketActions({ id, status, priority, assigned_to_email, resolution_notes }: Props) {
  const router = useRouter();
  const [s, setStatus] = useState(status);
  const [p, setPriority] = useState(priority);
  const [a, setAssignee] = useState(assigned_to_email || '');
  const [notes, setNotes] = useState(resolution_notes || '');
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function saveProps() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`/api/admin/client-master/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: s,
          priority: p,
          assigned_to_email: a || undefined,
          resolution_notes: notes,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) { setErr(j.error || `HTTP ${r.status}`); return; }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally { setBusy(false); }
  }

  async function send() {
    if (!reply.trim()) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`/api/admin/client-master/service-requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply.trim(), is_internal_note: internal }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) { setErr(j.error || `HTTP ${r.status}`); return; }
      setReply('');
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ position: 'sticky', top: 20 }}>
      <div style={card}>
        <h3 style={hdr}>Quick reply</h3>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type your reply…"
          rows={5}
          style={textareaStyle}
        />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569', marginTop: 6 }}>
          <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note (not visible to client)
        </label>
        <button onClick={send} disabled={busy || !reply.trim()} style={primaryBtn}>
          {busy ? 'Sending…' : '↑ Send reply'}
        </button>
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <h3 style={hdr}>Properties</h3>
        <label style={labelStyle}>Status</label>
        <select value={s} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
          {STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label style={labelStyle}>Priority</label>
        <select value={p} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">🚨 Urgent</option>
        </select>
        <label style={labelStyle}>Assigned to (email)</label>
        <input value={a} onChange={(e) => setAssignee(e.target.value)} placeholder="staff@trustner.in" style={inputStyle} />
        <label style={labelStyle}>Resolution notes (internal)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={textareaStyle} />
        {err && <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12, marginTop: 8 }}>✗ {err}</div>}
        <button onClick={saveProps} disabled={busy} style={primaryBtn}>
          {busy ? 'Saving…' : '✓ Save properties'}
        </button>
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14 };
const hdr: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '.4px', margin: '0 0 10px' };
const labelStyle: React.CSSProperties = { display: 'block', marginTop: 10, fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 };
const textareaStyle: React.CSSProperties = { ...inputStyle, fontFamily: 'inherit', resize: 'vertical' };
const primaryBtn: React.CSSProperties = { marginTop: 10, padding: '8px 14px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', width: '100%' };
