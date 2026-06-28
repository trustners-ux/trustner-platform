import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getServerActor } from '@/lib/client-master/actor';
import { canReadClients, canWriteClients } from '@/lib/client-master/permissions';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import AdminTicketActions from './AdminTicketActions';

export const metadata = { title: 'Service request — Trustner', robots: { index: false, follow: false } };

interface Props { params: Promise<{ id: string }> }

interface ReplyRow {
  id: number;
  author_kind: 'client' | 'admin' | 'system';
  author_display_name: string | null;
  body: string;
  status_changed_to: string | null;
  created_at: string;
  is_internal_note: boolean;
}

export default async function AdminTicketPage({ params }: Props) {
  const a = await getServerActor();
  if (!a) redirect('/admin/login?next=/admin/client-master/service-requests');
  if (!canReadClients(a.role)) return <div style={{ padding: 40 }}>Forbidden.</div>;
  const canWrite = canWriteClients(a.role);

  const { id: idStr } = await params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) notFound();
  const sb = getSupabaseAdmin();
  if (!sb) return <div style={{ padding: 40 }}>DB not configured.</div>;

  const { data: r } = await sb
    .from('client_service_requests')
    .select('*, clients!inner(id, code, display_name, mobile_primary, email_primary)')
    .eq('id', id)
    .maybeSingle();
  if (!r) notFound();
  type ReqRow = {
    id: number; ticket_code: string; client_id: number; category: string; subject: string;
    description: string | null; status: string; priority: string;
    assigned_to_email: string | null; resolution_notes: string | null;
    raised_via: string; raised_by_user_id: number | null;
    created_at: string; resolved_at: string | null; last_activity_at: string;
    clients: { id: number; code: string; display_name: string; mobile_primary: string | null; email_primary: string | null };
  };
  const ticket = r as unknown as ReqRow;

  const { data: replies } = await sb
    .from('client_service_request_replies')
    .select('id, author_kind, author_display_name, body, status_changed_to, created_at, is_internal_note')
    .eq('request_id', id)
    .order('created_at', { ascending: true });
  const thread = (replies as ReplyRow[] | null) || [];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        <Link href="/admin/client-master/service-requests" style={{ color: '#1E40AF', textDecoration: 'none' }}>← Service requests</Link>
        {' / '}<code style={{ fontSize: 11 }}>{ticket.ticket_code}</code>
      </div>

      <div style={headerCard}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <code style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>{ticket.ticket_code}</code>
          <Pill kind={ticket.status} />
          <span style={{ background: '#F1F5F9', color: '#475569', padding: '3px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>{ticket.category}</span>
          {ticket.priority === 'urgent' && <span style={{ background: '#FECACA', color: '#7F1D1D', padding: '3px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>🚨 urgent</span>}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{ticket.subject}</h1>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>
          From <Link href={`/admin/client-master/${ticket.clients.id}`} style={{ color: '#1E40AF', fontWeight: 700 }}>{ticket.clients.display_name}</Link>
          {' '}({ticket.clients.code})
          {ticket.clients.mobile_primary && <> · 📱 {ticket.clients.mobile_primary}</>}
          {ticket.clients.email_primary && <> · ✉️ {ticket.clients.email_primary}</>}
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
          Raised {new Date(ticket.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} via {ticket.raised_via}
        </div>
        {ticket.description && <p style={{ fontSize: 13, color: '#475569', marginTop: 12, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>}
      </div>

      {/* Side-by-side: thread + actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginTop: 20 }}>
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>Conversation</h2>
          {thread.length === 0 ? (
            <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 10, textAlign: 'center', color: '#94A3B8', fontSize: 12.5 }}>
              No replies yet. Be the first to respond.
            </div>
          ) : thread.map((rep) => (
            <div key={rep.id} style={rep.author_kind === 'client' ? clientBubble : rep.author_kind === 'system' ? sysBubble : adminBubble}>
              <div style={{ fontSize: 10.5, color: '#94A3B8', marginBottom: 4 }}>
                {rep.author_kind === 'admin' && <>🛡️ </>}
                {rep.author_kind === 'client' && <>👤 </>}
                {rep.author_kind === 'system' && <>⚙️ </>}
                {rep.author_display_name || rep.author_kind}
                {rep.is_internal_note && <span style={{ marginLeft: 6, background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 4, fontSize: 9.5, fontWeight: 800 }}>INTERNAL NOTE</span>}
                {' · '}{new Date(rep.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: 13, color: '#0A1628', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{rep.body}</div>
              {rep.status_changed_to && (
                <div style={{ fontSize: 10.5, color: '#1E40AF', marginTop: 6, fontStyle: 'italic' }}>
                  → status changed to <b>{rep.status_changed_to}</b>
                </div>
              )}
            </div>
          ))}
        </div>

        {canWrite && (
          <AdminTicketActions
            id={ticket.id}
            status={ticket.status}
            priority={ticket.priority}
            assigned_to_email={ticket.assigned_to_email}
            resolution_notes={ticket.resolution_notes}
          />
        )}
      </div>
    </div>
  );
}

function Pill({ kind }: { kind: string }) {
  const tints: Record<string, { bg: string; fg: string; label: string }> = {
    open:               { bg: '#DBEAFE', fg: '#1E40AF', label: 'Open' },
    in_progress:        { bg: '#FEF3C7', fg: '#92400E', label: 'In progress' },
    waiting_on_client:  { bg: '#FEE2E2', fg: '#991B1B', label: 'Waiting on client' },
    resolved:           { bg: '#ECFDF5', fg: '#065F46', label: 'Resolved' },
    cancelled:          { bg: '#F1F5F9', fg: '#475569', label: 'Cancelled' },
    escalated:          { bg: '#FECACA', fg: '#7F1D1D', label: 'Escalated' },
  };
  const t = tints[kind] ?? tints.open;
  return <span style={{ background: t.bg, color: t.fg, padding: '3px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>{t.label}</span>;
}

const headerCard: React.CSSProperties = { marginTop: 6, padding: 18, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 };
const clientBubble: React.CSSProperties = { marginLeft: 'auto', maxWidth: '85%', marginBottom: 10, padding: 12, background: '#EFF6FF', borderRadius: 12, border: '1px solid #BFDBFE' };
const adminBubble: React.CSSProperties = { maxWidth: '85%', marginBottom: 10, padding: 12, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' };
const sysBubble: React.CSSProperties = { margin: '10px auto', maxWidth: '70%', padding: '8px 12px', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1', fontStyle: 'italic' };
