'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Reply {
  id: number;
  author_kind: 'client' | 'admin' | 'system';
  author_display_name: string | null;
  body: string;
  status_changed_to: string | null;
  created_at: string;
}

interface Req {
  id: number;
  ticket_code: string;
  category: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  resolved_at: string | null;
  assigned_to_email: string | null;
}

const STATUS_TINT: Record<string, { bg: string; fg: string; label: string }> = {
  open:               { bg: '#DBEAFE', fg: '#1E40AF', label: 'Open' },
  in_progress:        { bg: '#FEF3C7', fg: '#92400E', label: 'In progress' },
  waiting_on_client:  { bg: '#FEE2E2', fg: '#991B1B', label: 'Waiting on you' },
  resolved:           { bg: '#ECFDF5', fg: '#065F46', label: 'Resolved' },
  cancelled:          { bg: '#F1F5F9', fg: '#475569', label: 'Cancelled' },
  escalated:          { bg: '#FECACA', fg: '#7F1D1D', label: 'Escalated' },
};

export default function RequestThread({ id }: { id: string }) {
  const [req, setReq] = useState<Req | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch(`/api/portal/me/service-requests/${id}`);
      const j = await r.json();
      if (j.ok) {
        setReq(j.request);
        setReplies(j.replies || []);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true); setErr(null);
    try {
      const r = await fetch(`/api/portal/me/service-requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) { setErr(j.error || `HTTP ${r.status}`); return; }
      setDraft('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Network');
    } finally { setSending(false); }
  }

  if (loading) return <div style={{ padding: 20, color: '#94A3B8' }}>Loading…</div>;
  if (!req) return (
    <div>
      <Link href="/portal/requests" style={{ fontSize: 12, color: '#1E40AF', textDecoration: 'none' }}>← Back to requests</Link>
      <div style={{ marginTop: 20, padding: 22, background: '#FEE2E2', color: '#B91C1C', borderRadius: 12 }}>
        Couldn&apos;t find this ticket. It may have been deleted or doesn&apos;t belong to your account.
      </div>
    </div>
  );

  const t = STATUS_TINT[req.status] ?? STATUS_TINT.open;

  return (
    <div>
      <Link href="/portal/requests" style={{ fontSize: 12, color: '#1E40AF', textDecoration: 'none' }}>← Back to requests</Link>

      <div style={headerCard}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <code style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>{req.ticket_code}</code>
          <span style={{ background: t.bg, color: t.fg, padding: '3px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>{t.label}</span>
          {req.priority === 'urgent' && <span style={{ background: '#FECACA', color: '#7F1D1D', padding: '3px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>🚨 urgent</span>}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{req.subject}</h1>
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
          Raised on {new Date(req.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          {req.assigned_to_email && <> · assigned to {req.assigned_to_email}</>}
        </div>
        {req.description && <p style={{ fontSize: 13, color: '#475569', marginTop: 12, whiteSpace: 'pre-wrap' }}>{req.description}</p>}
      </div>

      {/* Thread */}
      <div style={{ marginTop: 18 }}>
        {replies.length === 0 ? (
          <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 10, textAlign: 'center', color: '#94A3B8', fontSize: 12.5 }}>
            No replies yet. Our team will respond within 1-2 business days.
          </div>
        ) : (
          replies.map((rep) => (
            <div key={rep.id} style={rep.author_kind === 'client' ? clientBubble : adminBubble}>
              <div style={{ fontSize: 10.5, color: '#94A3B8', marginBottom: 4 }}>
                {rep.author_kind === 'admin' ? `🛡️ Trustner team — ${rep.author_display_name || 'support'}` : rep.author_display_name || 'You'} ·{' '}
                {new Date(rep.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: 13, color: '#0A1628', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{rep.body}</div>
              {rep.status_changed_to && (
                <div style={{ fontSize: 10.5, color: '#1E40AF', marginTop: 6, fontStyle: 'italic' }}>
                  → status changed to <b>{rep.status_changed_to}</b>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reply box */}
      {req.status !== 'resolved' && req.status !== 'cancelled' ? (
        <div style={{ marginTop: 18, padding: 14, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a reply…"
            rows={4}
            style={{ width: '100%', padding: 10, border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
          />
          {err && <div style={{ padding: 10, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, marginTop: 8 }}>✗ {err}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={send} disabled={sending || !draft.trim()} style={primaryBtn}>
              {sending ? 'Sending…' : '↑ Send reply'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 18, padding: 14, background: '#F8FAFC', borderRadius: 10, fontSize: 12, color: '#64748B', textAlign: 'center' }}>
          This ticket is {req.status === 'resolved' ? 'resolved' : 'cancelled'} and the conversation is closed.
          Need to revisit this? <Link href="/portal/requests/new" style={{ color: '#1E40AF', fontWeight: 700 }}>Raise a new request</Link>.
        </div>
      )}
    </div>
  );
}

const headerCard: React.CSSProperties = { marginTop: 10, padding: 18, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 };
const clientBubble: React.CSSProperties = { marginLeft: 'auto', maxWidth: '85%', marginBottom: 10, padding: 12, background: '#EFF6FF', borderRadius: 12, border: '1px solid #BFDBFE' };
const adminBubble: React.CSSProperties = { maxWidth: '85%', marginBottom: 10, padding: 12, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' };
const primaryBtn: React.CSSProperties = { padding: '8px 16px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' };
