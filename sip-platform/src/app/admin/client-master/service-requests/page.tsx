/**
 * /admin/client-master/service-requests — Admin queue of client tickets.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerActor } from '@/lib/client-master/actor';
import { canReadClients } from '@/lib/client-master/permissions';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const metadata = { title: 'Service requests — Trustner', robots: { index: false, follow: false } };

const STATUS_TINT: Record<string, { bg: string; fg: string; label: string }> = {
  open:               { bg: '#DBEAFE', fg: '#1E40AF', label: 'Open' },
  in_progress:        { bg: '#FEF3C7', fg: '#92400E', label: 'In progress' },
  waiting_on_client:  { bg: '#FEE2E2', fg: '#991B1B', label: 'Waiting on client' },
  resolved:           { bg: '#ECFDF5', fg: '#065F46', label: 'Resolved' },
  cancelled:          { bg: '#F1F5F9', fg: '#475569', label: 'Cancelled' },
  escalated:          { bg: '#FECACA', fg: '#7F1D1D', label: 'Escalated' },
};

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}

export default async function AdminServiceRequestsPage({ searchParams }: PageProps) {
  const a = await getServerActor();
  if (!a) redirect('/admin/login?next=/admin/client-master/service-requests');
  if (!canReadClients(a.role)) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Forbidden.</div>;
  }

  const sp = await searchParams;
  const status = sp.status?.trim();
  const category = sp.category?.trim();
  const q = sp.q?.trim();

  const sb = getSupabaseAdmin();
  if (!sb) {
    return <div style={{ padding: 40 }}>DB not configured.</div>;
  }

  let query = sb
    .from('client_service_requests')
    .select('id, ticket_code, client_id, category, subject, status, priority, assigned_to_email, last_activity_at, created_at, clients!inner(id, code, display_name)')
    .order('last_activity_at', { ascending: false })
    .limit(200);
  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (q) query = query.or(`subject.ilike.%${q}%,ticket_code.ilike.%${q}%`);

  const { data, error } = await query;
  type Row = {
    id: number; ticket_code: string; client_id: number; category: string; subject: string;
    status: string; priority: string; assigned_to_email: string | null;
    last_activity_at: string; created_at: string;
    clients: { id: number; code: string; display_name: string };
  };
  const requests = ((data as unknown) as Row[] | null) || [];

  // Summary counts (open + in_progress + waiting_on_client + escalated all surface as "active")
  const openCount = requests.filter((r) => ['open', 'in_progress', 'waiting_on_client', 'escalated'].includes(r.status)).length;
  const resolvedCount = requests.filter((r) => r.status === 'resolved').length;
  const urgentCount = requests.filter((r) => r.priority === 'urgent' && r.status !== 'resolved' && r.status !== 'cancelled').length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        <Link href="/admin" style={{ color: '#1E40AF', textDecoration: 'none' }}>← Dashboard</Link>
        {' / '}<Link href="/admin/client-master" style={{ color: '#1E40AF', textDecoration: 'none' }}>Client master</Link>
        {' / Service requests'}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A1628', letterSpacing: '-.5px', marginTop: 4 }}>
        Service requests
      </h1>
      <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, maxWidth: 820 }}>
        Tickets raised by clients through the portal. Reply, change status, assign to a teammate.
      </p>

      {error && <div style={{ padding: 12, background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, fontSize: 12.5, marginTop: 14 }}>{error.message}</div>}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14, marginBottom: 14, flexWrap: 'wrap' }}>
        <Stat label="Active" value={openCount} tone="warn" />
        <Stat label="Urgent" value={urgentCount} tone={urgentCount > 0 ? 'bad' : 'info'} />
        <Stat label="Resolved (recent 200)" value={resolvedCount} tone="good" />
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <input
          name="q"
          placeholder="Search subject or ticket code…"
          defaultValue={q ?? ''}
          style={{ flex: 1, minWidth: 240, padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13 }}
        />
        <select name="status" defaultValue={status ?? ''} style={selectStyle}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_TINT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select name="category" defaultValue={category ?? ''} style={selectStyle}>
          <option value="">All categories</option>
          <option value="address_change">Address change</option>
          <option value="contact_update">Contact / consent update</option>
          <option value="nominee_change">Nominee change</option>
          <option value="kyc_update">KYC update</option>
          <option value="statement_request">Statement request</option>
          <option value="withdrawal_request">Withdrawal</option>
          <option value="bank_change">Bank change</option>
          <option value="sip_change">SIP change</option>
          <option value="redemption_request">Redemption</option>
          <option value="complaint">Complaint</option>
          <option value="other">Other</option>
        </select>
        <button type="submit" style={searchBtn}>Filter</button>
        {(status || category || q) && (
          <Link href="/admin/client-master/service-requests" style={{ ...searchBtn, background: '#F1F5F9', color: '#0A1628', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Clear</Link>
        )}
      </form>

      {requests.length === 0 ? (
        <div style={{ padding: 32, background: '#F8FAFC', borderRadius: 12, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
          🎉 No tickets matching the filter.
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={th}>Ticket</th>
                <th style={th}>Client</th>
                <th style={th}>Subject</th>
                <th style={th}>Category</th>
                <th style={th}>Status</th>
                <th style={th}>Pri</th>
                <th style={th}>Assigned</th>
                <th style={th}>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const t = STATUS_TINT[r.status] ?? STATUS_TINT.open;
                return (
                  <tr key={r.id}>
                    <td style={td}>
                      <Link href={`/admin/client-master/service-requests/${r.id}`} style={{ color: '#1E40AF', fontFamily: 'ui-monospace, monospace', fontSize: 11, textDecoration: 'none' }}>{r.ticket_code}</Link>
                    </td>
                    <td style={td}>
                      <Link href={`/admin/client-master/${r.client_id}`} style={{ color: '#0A1628', textDecoration: 'none' }}>
                        <b>{r.clients.display_name}</b>
                        <br />
                        <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>{r.clients.code}</span>
                      </Link>
                    </td>
                    <td style={td}>{r.subject}</td>
                    <td style={td}><code style={{ fontSize: 10.5 }}>{r.category}</code></td>
                    <td style={td}>
                      <span style={{ background: t.bg, color: t.fg, padding: '2px 8px', borderRadius: 999, fontSize: 9.5, fontWeight: 800 }}>{t.label}</span>
                    </td>
                    <td style={td}>
                      {r.priority === 'urgent' ? <span style={{ background: '#FECACA', color: '#7F1D1D', padding: '2px 8px', borderRadius: 999, fontSize: 9.5, fontWeight: 800 }}>🚨</span> : <span style={{ fontSize: 11, color: '#94A3B8' }}>{r.priority}</span>}
                    </td>
                    <td style={td}>{r.assigned_to_email ? <span style={{ fontSize: 11 }}>{r.assigned_to_email}</span> : <span style={{ color: '#94A3B8', fontSize: 11 }}>—</span>}</td>
                    <td style={td}><span style={{ fontSize: 10.5, color: '#94A3B8' }}>{new Date(r.last_activity_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'good' | 'warn' | 'bad' | 'info' }) {
  const tints: Record<string, { bg: string; fg: string }> = {
    good: { bg: '#ECFDF5', fg: '#065F46' }, warn: { bg: '#FEF3C7', fg: '#92400E' },
    bad: { bg: '#FEE2E2', fg: '#991B1B' }, info: { bg: '#DBEAFE', fg: '#1E40AF' },
  };
  const t = tints[tone];
  return (
    <div style={{ background: t.bg, borderRadius: 10, padding: 14, flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: t.fg, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.fg, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', fontSize: 9.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', padding: '10px 12px', borderBottom: '1px solid #E2E8F0' };
const td: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' };
const selectStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', background: '#fff' };
const searchBtn: React.CSSProperties = { padding: '8px 18px', background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
