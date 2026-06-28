'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Req {
  id: number;
  ticket_code: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  last_activity_at: string;
  created_at: string;
}

const STATUS_TINT: Record<string, { bg: string; fg: string; label: string }> = {
  open:               { bg: '#DBEAFE', fg: '#1E40AF', label: 'Open' },
  in_progress:        { bg: '#FEF3C7', fg: '#92400E', label: 'In progress' },
  waiting_on_client:  { bg: '#FEE2E2', fg: '#991B1B', label: 'Waiting on you' },
  resolved:           { bg: '#ECFDF5', fg: '#065F46', label: 'Resolved' },
  cancelled:          { bg: '#F1F5F9', fg: '#475569', label: 'Cancelled' },
  escalated:          { bg: '#FECACA', fg: '#7F1D1D', label: 'Escalated' },
};

const CATEGORY_LABELS: Record<string, string> = {
  address_change: 'Address change',
  contact_update: 'Contact / consent update',
  nominee_change: 'Nominee change',
  kyc_update: 'KYC update',
  statement_request: 'Statement request',
  withdrawal_request: 'Withdrawal',
  bank_change: 'Bank change',
  sip_change: 'SIP change',
  redemption_request: 'Redemption',
  complaint: 'Complaint',
  other: 'Other',
};

export default function RequestsList() {
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/portal/me/service-requests');
        const j = await r.json();
        if (j.ok) setItems(j.requests || []);
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Service requests</h1>
          <p style={{ fontSize: 12.5, color: '#475569', margin: '4px 0 0' }}>
            Address changes, KYC updates, statement requests, complaints — raise & track them here.
          </p>
        </div>
        <Link href="/portal/requests/new" style={primaryBtn}>+ New request</Link>
      </div>

      {loading ? (
        <div style={{ padding: 20, color: '#94A3B8', fontSize: 12.5 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ marginTop: 18, padding: 22, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
          📨 No service requests yet. Tap <b>+ New request</b> to raise one.
        </div>
      ) : (
        <div style={{ marginTop: 18 }}>
          {items.map((r) => {
            const t = STATUS_TINT[r.status] ?? STATUS_TINT.open;
            return (
              <Link key={r.id} href={`/portal/requests/${r.id}`} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <code style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>{r.ticket_code}</code>
                    <span style={{ background: t.bg, color: t.fg, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>{t.label}</span>
                    {r.priority === 'urgent' && <span style={{ background: '#FECACA', color: '#7F1D1D', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>🚨 urgent</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginTop: 4 }}>{r.subject}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                    {CATEGORY_LABELS[r.category] || r.category} · last activity {new Date(r.last_activity_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ fontSize: 18, color: '#94A3B8' }}>›</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = { padding: '8px 16px', background: 'linear-gradient(135deg,#1E40AF,#06B6D4)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' };
const rowStyle: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', padding: 14, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 8, textDecoration: 'none', color: '#0A1628' };
