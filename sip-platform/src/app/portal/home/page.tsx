/**
 * /portal/home — Client portal dashboard.
 *
 * Read-only profile + consent + family summary. Quick links to docs,
 * service requests, holdings, statements.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPortalSessionFromServer } from '@/lib/portal/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { maskAadhaar, maskPan } from '@/lib/client-master/clients';
import type { ClientRow, FamilyRole } from '@/lib/client-master/types';
import PortalShell from '../PortalShell';

export const metadata = {
  title: 'My Trustner portal',
  robots: { index: false, follow: false },
};

interface FamilyMemberSummary {
  role: FamilyRole;
  id: number;
  code: string;
  display_name: string;
  age_years: number | null;
}
interface FamilyGroup {
  family_id: number;
  family_code: string;
  family_name: string;
  my_role: FamilyRole;
  members: FamilyMemberSummary[];
}

const ROLE_ORDER: Record<FamilyRole, number> = {
  head: 1, spouse: 2, parent: 3, child: 4, sibling: 5, grandparent: 6, other_dependent: 7,
};

export default async function PortalHomePage() {
  const session = await getPortalSessionFromServer();
  if (!session) redirect('/portal/login');

  const sb = getSupabaseAdmin();
  if (!sb) {
    return (
      <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
        <div style={{ padding: 22, background: '#FEE2E2', color: '#B91C1C', borderRadius: 10 }}>
          Portal database isn&apos;t configured. Please try again in a few minutes.
        </div>
      </PortalShell>
    );
  }

  const { data: client } = await sb.from('clients').select('*').eq('id', session.clientId).maybeSingle();
  if (!client) {
    return (
      <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
        <div style={{ padding: 22 }}>We couldn&apos;t find your account.</div>
      </PortalShell>
    );
  }
  const c = client as ClientRow;

  type Membership = { family_id: number; role: FamilyRole; families: { id: number; code: string; name: string } };
  const { data: memberships } = await sb
    .from('family_members')
    .select('family_id, role, families!inner(id, code, name)')
    .eq('client_id', c.id)
    .eq('is_active', true);

  const families: FamilyGroup[] = await Promise.all(
    ((memberships as unknown as Membership[] | null) || []).map(async (m) => {
      type Other = { role: FamilyRole; clients: { id: number; code: string; display_name: string; age_years: number | null } };
      const { data: others } = await sb
        .from('family_members')
        .select('role, clients!inner(id, code, display_name, age_years)')
        .eq('family_id', m.family_id)
        .eq('is_active', true);
      const members = ((others as unknown as Other[] | null) || [])
        .map((o) => ({ role: o.role, id: o.clients.id, code: o.clients.code, display_name: o.clients.display_name, age_years: o.clients.age_years }))
        .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));
      return { family_id: m.family_id, family_code: m.families.code, family_name: m.families.name, my_role: m.role, members };
    }),
  );

  // Counts for the quick-link cards
  const { count: docCount } = await sb
    .from('client_documents')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', c.id);
  const { count: openRequests } = await sb
    .from('client_service_requests')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', c.id)
    .in('status', ['open', 'in_progress', 'waiting_on_client', 'escalated']);

  return (
    <PortalShell displayName={c.display_name} clientCode={c.code}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Welcome back, {c.first_name}</h1>
      <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 18px' }}>Here&apos;s a quick snapshot of your relationship with Trustner.</p>

      {/* Hero stats */}
      <div style={statsGrid}>
        <Stat label="KYC" value={c.kyc_status.replace(/_/g, ' ')} tone={c.kyc_status === 'verified' ? 'good' : 'warn'} />
        <Stat label="Status" value={c.status} tone={c.status === 'active' ? 'good' : 'warn'} />
        <Stat label="Family ties" value={`${families.length}`} tone="info" />
      </div>

      {/* Two-path portfolio cards — the hero CTA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 18 }}>
        <Link href="/portal/holdings" style={{ display: 'block', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 18px', textDecoration: 'none' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📈</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0A1628' }}>Portfolio View</div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>See your current mutual fund holdings, values, and returns at a glance.</div>
        </Link>
        <Link href="/portal/portfolio-review" style={{ display: 'block', background: 'linear-gradient(135deg, #0A1628 0%, #1E40AF 100%)', border: 'none', borderRadius: 14, padding: '20px 18px', textDecoration: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 8, right: 12, background: '#06B6D4', color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '3px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '.5px' }}>Recommended</div>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🩺</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Portfolio Health Check</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>Upload your CAS &amp; get an instant AI-powered health report for every fund.</div>
        </Link>
      </div>

      {/* Quick action cards */}
      <div style={cardsGrid}>
        <QuickCard
          href="/portal/documents"
          emoji="📄"
          title="Documents"
          subtitle={docCount && docCount > 0 ? `${docCount} on file` : 'Upload PAN, Aadhaar, photo'}
        />
        <QuickCard
          href="/portal/requests"
          emoji="📨"
          title="Service requests"
          subtitle={openRequests && openRequests > 0 ? `${openRequests} open` : 'Raise a new ticket'}
        />
      </div>

      {/* Profile */}
      <Section title="Your profile">
        <KV label="Full name" value={c.display_name} />
        {c.dob && <KV label="Date of birth" value={c.dob} mono />}
        <KV label="Residential status" value={c.residential_status} />
        {c.occupation && <KV label="Occupation" value={c.occupation} />}
        {c.annual_income_band && <KV label="Income band" value={c.annual_income_band} />}
        <KV label="Risk profile" value={c.risk_profile} />
      </Section>

      <Section title="Contact">
        {c.mobile_primary && <KV label="Mobile" value={c.mobile_primary} mono />}
        {c.email_primary && <KV label="Email" value={c.email_primary} />}
        {c.addr_current_city && (
          <KV label="Address" value={[c.addr_current_line1, c.addr_current_line2, c.addr_current_city, c.addr_current_state, c.addr_current_pincode].filter(Boolean).join(' · ')} />
        )}
      </Section>

      <Section title="Identifiers">
        <KV label="PAN" value={maskPan(c.pan)} mono />
        <KV label="Aadhaar" value={maskAadhaar(c.aadhaar_last4)} mono />
        <p style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 6 }}>
          Your full Aadhaar is never stored. We keep only the last 4 digits + a one-way hash for verification.
        </p>
      </Section>

      <Section title="Communication preferences">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <ConsentChip on={!!c.whatsapp_opt_in} label="WhatsApp" />
          <ConsentChip on={!!c.sms_opt_in} label="SMS" />
          <ConsentChip on={!!c.email_opt_in} label="Email" />
          <ConsentChip on={!!c.marketing_opt_in} label="Marketing" />
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10 }}>
          Want to change these? Raise a <Link href="/portal/requests/new?category=contact_update" style={{ color: '#1E40AF', fontWeight: 700 }}>contact update request</Link> and we&apos;ll log every change.
        </p>
      </Section>

      {families.length > 0 && (
        <Section title="Your family on Trustner">
          {families.map((f) => (
            <div key={f.family_id} style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{f.family_name}</div>
                  <div style={{ fontSize: 10.5, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>{f.family_code}</div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1E40AF', background: '#DBEAFE', padding: '3px 9px', borderRadius: 999 }}>
                  your role: {f.my_role}
                </span>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {f.members.map((m) => (
                  <li key={m.id} style={{ padding: '6px 0', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span><b>{m.display_name}</b> {m.id === c.id && <em style={{ color: '#94A3B8' }}> (you)</em>}</span>
                    <span style={{ color: '#94A3B8', fontSize: 11 }}>{m.role}{m.age_years != null ? ` · age ${m.age_years}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Section>
      )}
    </PortalShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warn' | 'info' }) {
  const tints: Record<string, { bg: string; fg: string }> = {
    good: { bg: '#ECFDF5', fg: '#065F46' }, warn: { bg: '#FEF3C7', fg: '#92400E' }, info: { bg: '#DBEAFE', fg: '#1E40AF' },
  };
  const t = tints[tone];
  return (
    <div style={{ background: t.bg, borderRadius: 10, padding: 14, flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: t.fg, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: t.fg, marginTop: 4, textTransform: 'capitalize' }}>{value}</div>
    </div>
  );
}
function QuickCard({ href, emoji, title, subtitle, disabled }: { href: string; emoji: string; title: string; subtitle: string; disabled?: boolean }) {
  const body = (
    <>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#0A1628' }}>{title}</div>
      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{subtitle}</div>
    </>
  );
  if (disabled) {
    return <div style={{ ...quickCardStyle, opacity: 0.55, cursor: 'default' }}>{body}</div>;
  }
  return <Link href={href} style={quickCardStyle}>{body}</Link>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>{title}</h2>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '8px 14px' }}>{children}</div>
    </div>
  );
}
function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid #F8FAFC', fontSize: 12.5, gap: 16 }}>
      <div style={{ flex: '0 0 150px', color: '#64748B', fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, color: '#0A1628', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit' }}>{value}</div>
    </div>
  );
}
function ConsentChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 11px', borderRadius: 999, fontSize: 12, fontWeight: 700,
      background: on ? '#ECFDF5' : '#F1F5F9', color: on ? '#065F46' : '#94A3B8',
      border: `1px solid ${on ? '#A7F3D0' : '#E2E8F0'}`,
    }}>{on ? '✓' : '○'} {label}</span>
  );
}

const statsGrid: React.CSSProperties = { display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' };
const cardsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 18 };
const quickCardStyle: React.CSSProperties = { display: 'block', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.1s' };
