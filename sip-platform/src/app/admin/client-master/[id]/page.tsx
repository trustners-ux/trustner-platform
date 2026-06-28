/**
 * /admin/client-master/[id] — full client detail.
 *
 * Single-page scroll layout. Tabs (Profile · Family · Policies · Documents
 * · Comms · Service Reqs) get split out once those modules exist.
 *
 * Section order:
 *   1. Header — name, code, status, KYC, action buttons
 *   2. Contact
 *   3. Identity & KYC
 *   4. Current address / Permanent address (if different)
 *   5. Profile (occupation, income, risk, tags)
 *   6. DPDPA consent + log
 *   7. Family memberships
 *   8. Imported metadata buckets
 *   9. Audit footer
 */

import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getServerActor } from '@/lib/client-master/actor';
import { canReadClients, canViewClientKyc } from '@/lib/client-master/permissions';
import { getClient, maskAadhaar, maskPan } from '@/lib/client-master/clients';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { ConsentEntry, FamilyMemberRow, FamilyRole } from '@/lib/client-master/types';
import EditClientButton from './EditClientButton';
import PortalInviteButton from './PortalInviteButton';

export const metadata = { title: 'Client — Trustner', robots: { index: false, follow: false } };

const KYC_TINT: Record<string, { bg: string; fg: string }> = {
  pending:     { bg: '#FEF3C7', fg: '#92400E' },
  in_progress: { bg: '#DBEAFE', fg: '#1E40AF' },
  verified:    { bg: '#ECFDF5', fg: '#065F46' },
  rejected:    { bg: '#FEE2E2', fg: '#991B1B' },
  expired:     { bg: '#F1F5F9', fg: '#475569' },
};
const STATUS_TINT: Record<string, { bg: string; fg: string }> = {
  active:   { bg: '#ECFDF5', fg: '#065F46' },
  inactive: { bg: '#F1F5F9', fg: '#475569' },
  dormant:  { bg: '#FEF3C7', fg: '#92400E' },
  archived: { bg: '#FEE2E2', fg: '#991B1B' },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface FamilySnapshot extends FamilyMemberRow {
  family_code: string;
  family_name: string;
  head_client_id: number;
  members: { role: FamilyRole; id: number; code: string; display_name: string; dob: string | null; age_years: number | null }[];
}

const ROLE_ORDER: Record<FamilyRole, number> = {
  head: 1, spouse: 2, parent: 3, child: 4, sibling: 5, grandparent: 6, other_dependent: 7,
};

export default async function ClientDetailPage({ params }: PageProps) {
  const a = await getServerActor();
  if (!a) redirect('/admin/login?next=/admin/client-master');
  if (!canReadClients(a.role)) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
      You don&apos;t have permission to view this client. <Link href="/admin/client-master" style={{ color: '#1E40AF' }}>← Back</Link>
    </div>;
  }
  const canKyc = canViewClientKyc(a.role);
  // Re-derive write permission for client components on this page
  const { canWriteClients } = await import('@/lib/client-master/permissions');
  const canWrite = canWriteClients(a.role);

  const { id: idStr } = await params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) notFound();
  const c = await getClient(id);
  if (!c) notFound();

  const meta = (c.metadata && typeof c.metadata === 'object') ? c.metadata : {};
  const consentLog: ConsentEntry[] = Array.isArray(c.consent_log) ? c.consent_log : [];

  // Family memberships — fetch the rows this client belongs to, then for each
  // family fetch the other members. Two Supabase calls per family (small).
  const supabase = getSupabaseAdmin();
  let familySnapshots: FamilySnapshot[] = [];
  if (supabase) {
    const { data: memberships } = await supabase
      .from('family_members')
      .select('id, family_id, client_id, role, joined_at, is_active, families!inner(id, code, name, head_client_id)')
      .eq('client_id', c.id)
      .eq('is_active', true);

    type FamRow = { id: number; code: string; name: string; head_client_id: number };
    type Membership = FamilyMemberRow & { families: FamRow };
    const ms = (memberships as Membership[] | null) || [];

    familySnapshots = await Promise.all(
      ms.map(async (m): Promise<FamilySnapshot> => {
        const { data: others } = await supabase
          .from('family_members')
          .select('role, clients!inner(id, code, display_name, dob, age_years)')
          .eq('family_id', m.family_id)
          .eq('is_active', true);
        type Other = { role: FamilyRole; clients: { id: number; code: string; display_name: string; dob: string | null; age_years: number | null } };
        const members = ((others as Other[] | null) || [])
          .map((o) => ({
            role: o.role,
            id: o.clients.id,
            code: o.clients.code,
            display_name: o.clients.display_name,
            dob: o.clients.dob,
            age_years: o.clients.age_years,
          }))
          .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));
        return {
          id: m.id,
          family_id: m.family_id,
          client_id: m.client_id,
          role: m.role,
          joined_at: m.joined_at,
          is_active: m.is_active,
          family_code: m.families.code,
          family_name: m.families.name,
          head_client_id: m.families.head_client_id,
          members,
        };
      }),
    );
  }

  // Imported metadata buckets
  const importedExtras: Record<string, Record<string, string>> = {
    'Servicing': {},
    'MFD portfolio': {},
    'Identity & family': {},
    'KYC / FATCA': {},
    'Overseas address (NRI)': {},
    'Other': {},
  };
  const GROUPS: Record<string, string> = {
    rm_name: 'Servicing', rm_code: 'Servicing',
    sub_broker_name: 'Servicing', sub_broker_code: 'Servicing',
    service_rm_name: 'Servicing', service_rm_code: 'Servicing',
    referred_by: 'Servicing',
    source_onboarding_method: 'Servicing',
    source_platform_code: 'Servicing',
    source_family_head: 'Servicing',
    source_family_head_code: 'Servicing',
    source_username: 'Servicing',

    aum: 'MFD portfolio',
    target_sip: 'MFD portfolio',
    first_investment_date: 'MFD portfolio',
    last_review_date: 'MFD portfolio',
    client_rating: 'MFD portfolio',
    mode_of_holding: 'MFD portfolio',
    bank_details_raw: 'MFD portfolio',

    father_name: 'Identity & family', mother_name: 'Identity & family',
    spouse_name: 'Identity & family', date_of_death: 'Identity & family',
    joint_holder_1: 'Identity & family', joint_holder_2: 'Identity & family',
    guardian_name: 'Identity & family', guardian_pan: 'Identity & family',
    attorney_name: 'Identity & family', attorney_pan: 'Identity & family',
    nominee_details_raw: 'Identity & family',
    place_of_birth: 'Identity & family', country_of_birth: 'Identity & family',
    nationality: 'Identity & family',

    tax_status_raw: 'KYC / FATCA',
    ckyc_number: 'KYC / FATCA',
    fatca_status: 'KYC / FATCA',

    addr_overseas_line1: 'Overseas address (NRI)',
    addr_overseas_line2: 'Overseas address (NRI)',
    addr_overseas_city: 'Overseas address (NRI)',
    addr_overseas_state: 'Overseas address (NRI)',
    addr_overseas_country: 'Overseas address (NRI)',
    addr_overseas_pincode: 'Overseas address (NRI)',
    mobile_overseas: 'Overseas address (NRI)',
    phone_overseas: 'Overseas address (NRI)',
  };
  for (const [k, v] of Object.entries(meta)) {
    if (k === 'imported_at' || k === 'imported_by_email' || k === 'archived_on_import_reason') continue;
    if (v == null || v === '') continue;
    const group = GROUPS[k] || 'Other';
    importedExtras[group][k] = String(v);
  }

  const kycT = KYC_TINT[c.kyc_status] ?? KYC_TINT.pending;
  const statT = STATUS_TINT[c.status] ?? STATUS_TINT.active;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        <Link href="/admin" style={{ color: '#1E40AF', textDecoration: 'none' }}>← Dashboard</Link>
        {' / '}<Link href="/admin/client-master" style={{ color: '#1E40AF', textDecoration: 'none' }}>Client master</Link>
        {' / '}<code style={{ fontSize: 11 }}>{c.code}</code>
      </div>

      <div style={{
        marginTop: 6, padding: '22px 26px',
        background: 'linear-gradient(135deg,#0A1628 0%,#1E40AF 70%,#06B6D4 100%)',
        color: '#fff', borderRadius: 16, boxShadow: '0 6px 18px rgba(10,22,40,.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 700, letterSpacing: '1px' }}>
              CLIENT &nbsp;·&nbsp; <code>{c.code}</code>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.5px', marginTop: 4 }}>
              {c.display_name}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>
              {c.gender !== 'U' && (<span>{c.gender === 'M' ? '♂' : c.gender === 'F' ? '♀' : '⚧'} &nbsp;</span>)}
              {c.age_years != null && (<span>{c.age_years}y &nbsp;·&nbsp; </span>)}
              {c.marital_status !== 'unknown' && (<span>{c.marital_status} &nbsp;·&nbsp; </span>)}
              {c.residential_status}
              {c.occupation && (<span> &nbsp;·&nbsp; {c.occupation}</span>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Pill bg={kycT.bg} fg={kycT.fg}>KYC {c.kyc_status.replace(/_/g, ' ')}</Pill>
            <Pill bg={statT.bg} fg={statT.fg}>{c.status}</Pill>
            {canWrite && (
              <>
                <EditClientButton
                  client={{
                    id: c.id,
                    salutation: c.salutation,
                    first_name: c.first_name,
                    middle_name: c.middle_name,
                    last_name: c.last_name,
                    gender: c.gender,
                    dob: c.dob,
                    marital_status: c.marital_status,
                    pan: c.pan,
                    aadhaar_last4: c.aadhaar_last4,
                    mobile_primary: c.mobile_primary,
                    mobile_alt: c.mobile_alt,
                    email_primary: c.email_primary,
                    email_alt: c.email_alt,
                    addr_current_line1: c.addr_current_line1,
                    addr_current_line2: c.addr_current_line2,
                    addr_current_city: c.addr_current_city,
                    addr_current_state: c.addr_current_state,
                    addr_current_pincode: c.addr_current_pincode,
                    addr_current_country: c.addr_current_country,
                    residential_status: c.residential_status,
                    occupation: c.occupation,
                    employer: c.employer,
                    annual_income_band: c.annual_income_band,
                    risk_profile: c.risk_profile,
                    whatsapp_opt_in: !!c.whatsapp_opt_in,
                    sms_opt_in: !!c.sms_opt_in,
                    email_opt_in: !!c.email_opt_in,
                    marketing_opt_in: !!c.marketing_opt_in,
                    preferred_language: c.preferred_language,
                    tags: c.tags,
                    notes: c.notes,
                    status: c.status,
                  }}
                  canEditKyc={canKyc}
                />
                <PortalInviteButton
                  clientId={c.id}
                  clientName={c.display_name}
                  hasMobile={!!c.mobile_primary}
                  hasEmail={!!c.email_primary}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <Section title="Contact">
        <KV label="Mobile (primary)" value={c.mobile_primary || '—'} mono />
        <KV label="Mobile (alt)" value={c.mobile_alt || '—'} mono />
        <KV label="Email (primary)" value={c.email_primary || '—'} />
        <KV label="Email (alt)" value={c.email_alt || '—'} />
        <KV label="Preferred language" value={c.preferred_language} />
      </Section>

      <Section title="Identity & KYC">
        <KV label="Date of birth" value={c.dob || '—'} mono />
        <KV label="PAN" value={canKyc ? c.pan || '—' : maskPan(c.pan)} mono />
        <KV label="PAN status" value={c.pan_status || '—'} />
        <KV label="Aadhaar" value={maskAadhaar(c.aadhaar_last4)} mono />
        <KV label="Aadhaar status" value={c.aadhaar_status || '—'} />
        <KV label="KYC last reviewed" value={c.kyc_last_reviewed_at?.slice(0, 16) || '—'} />
        <KV label="KYC remarks" value={c.kyc_remarks || '—'} />
      </Section>

      <Section title="Address — current">
        <KV label="Line 1" value={c.addr_current_line1 || '—'} />
        <KV label="Line 2" value={c.addr_current_line2 || '—'} />
        <KV label="City" value={c.addr_current_city || '—'} />
        <KV label="State" value={c.addr_current_state || '—'} />
        <KV label="Pincode" value={c.addr_current_pincode || '—'} mono />
        <KV label="Country" value={c.addr_current_country || '—'} />
      </Section>

      {!c.addr_permanent_same_as_current && (
        <Section title="Address — permanent">
          <KV label="Line 1" value={c.addr_permanent_line1 || '—'} />
          <KV label="Line 2" value={c.addr_permanent_line2 || '—'} />
          <KV label="City" value={c.addr_permanent_city || '—'} />
          <KV label="State" value={c.addr_permanent_state || '—'} />
          <KV label="Pincode" value={c.addr_permanent_pincode || '—'} mono />
          <KV label="Country" value={c.addr_permanent_country || '—'} />
        </Section>
      )}

      <Section title="Profile">
        <KV label="Occupation" value={c.occupation || '—'} />
        <KV label="Employer" value={c.employer || '—'} />
        <KV label="Annual income band" value={c.annual_income_band || '—'} />
        <KV label="Risk profile" value={c.risk_profile} />
        <KV label="Tags" value={c.tags || '—'} />
      </Section>

      <Section title="Consent (DPDPA)">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <ConsentChip on={!!c.whatsapp_opt_in} label="WhatsApp" />
          <ConsentChip on={!!c.sms_opt_in} label="SMS" />
          <ConsentChip on={!!c.email_opt_in} label="Email" />
          <ConsentChip on={!!c.marketing_opt_in} label="Marketing" />
        </div>
        {consentLog.length > 0 && (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, color: '#475569' }}>
              ↓ Consent change log ({consentLog.length} events)
            </summary>
            <table style={{ width: '100%', marginTop: 8, fontSize: 11.5, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#F8FAFC' }}>
                <th style={th}>When</th><th style={th}>Channel</th><th style={th}>Action</th><th style={th}>Source</th><th style={th}>By</th>
              </tr></thead>
              <tbody>
                {consentLog.slice().reverse().map((e, i) => (
                  <tr key={i}>
                    <td style={td}>{e.at?.slice(0, 19).replace('T', ' ')}</td>
                    <td style={td}>{e.channel}</td>
                    <td style={td}>{e.opted_in ? '✓ opted in' : '✗ opted out'}</td>
                    <td style={td}>{e.source}</td>
                    <td style={td}><code style={{ fontSize: 10 }}>user_id={e.by_user_id ?? '—'}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </Section>

      <Section title={familySnapshots.length > 0 ? `Family memberships (${familySnapshots.length})` : 'Family memberships'}>
        {familySnapshots.length === 0 ? (
          <div style={{ fontSize: 12.5, color: '#94A3B8' }}>
            This client isn&apos;t linked to any family yet. Run the auto-linker
            at <code>/admin/client-master/import</code> after a bulk import.
          </div>
        ) : familySnapshots.map((fs) => (
          <div key={fs.family_id} style={{ marginBottom: 14, padding: 14, background: '#F8FAFC', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0A1628' }}>{fs.family_name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'ui-monospace, monospace' }}>{fs.family_code}</div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1E40AF', background: '#DBEAFE', padding: '3px 9px', borderRadius: 999 }}>
                this client&apos;s role: {fs.role}
              </span>
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#fff' }}>
                <th style={th}>Role</th><th style={th}>Name</th><th style={th}>Age</th><th style={th}>Code</th>
              </tr></thead>
              <tbody>
                {fs.members.map((m) => (
                  <tr key={m.id} style={{ background: m.id === c.id ? '#FEF3C7' : '#fff' }}>
                    <td style={td}>{m.role}</td>
                    <td style={td}>
                      {m.id === c.id
                        ? <b>{m.display_name} (this client)</b>
                        : <Link href={`/admin/client-master/${m.id}`} style={{ color: '#1E40AF', textDecoration: 'none' }}>{m.display_name}</Link>}
                    </td>
                    <td style={td}>{m.age_years ?? '—'}</td>
                    <td style={td}><code style={{ fontSize: 10.5 }}>{m.code}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </Section>

      {Object.entries(importedExtras).map(([group, entries]) => {
        const keys = Object.keys(entries);
        if (keys.length === 0) return null;
        return (
          <Section key={group} title={`Imported · ${group}`}>
            {keys.map((k) => (
              <KV key={k} label={prettyLabel(k)} value={entries[k]} />
            ))}
          </Section>
        );
      })}

      <div style={{ marginTop: 20, padding: 12, background: '#F8FAFC', borderRadius: 10, fontSize: 11.5, color: '#64748B', lineHeight: 1.7 }}>
        <b>Audit</b><br />
        Created at {c.created_at?.slice(0, 19).replace('T', ' ')} by user_id={c.created_by_user_id ?? '—'}<br />
        Last updated {c.updated_at?.slice(0, 19).replace('T', ' ')}<br />
        Onboarded via <code>{c.onboarded_via}</code>
        {c.onboarded_by_user_id && <> by user_id={c.onboarded_by_user_id}</>}
        {c.onboarded_by_partner_id && <> via partner_id={c.onboarded_by_partner_id}</>}<br />
        {!!meta.imported_at && (
          <>Bulk-imported at {String(meta.imported_at).slice(0, 19).replace('T', ' ')}{' '}
          by {String(meta.imported_by_email || '—')}</>
        )}
        {!!meta.archived_on_import_reason && (
          <><br /><span style={{ color: '#92400E' }}>Auto-archived on import: {String(meta.archived_on_import_reason)}</span></>
        )}
      </div>
    </div>
  );
}

function prettyLabel(k: string): string {
  return k.replace(/_/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <h2 style={{ fontSize: 13.5, fontWeight: 800, color: '#0A1628', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>{title}</h2>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '8px 14px' }}>
        {children}
      </div>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', padding: '7px 0', borderBottom: '1px solid #F8FAFC', fontSize: 12.5, gap: 16 }}>
      <div style={{ flex: '0 0 200px', color: '#64748B', fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, color: '#0A1628', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit' }}>{value}</div>
    </div>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span style={{ background: bg, color: fg, padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.4px' }}>
      {children}
    </span>
  );
}

function ConsentChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 11px', borderRadius: 999,
      fontSize: 12, fontWeight: 700,
      background: on ? '#ECFDF5' : '#F1F5F9',
      color: on ? '#065F46' : '#94A3B8',
      border: `1px solid ${on ? '#A7F3D0' : '#E2E8F0'}`,
    }}>
      {on ? '✓' : '○'} {label}
    </span>
  );
}

const th: React.CSSProperties = { textAlign: 'left', fontSize: 9.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', padding: '8px 10px', borderBottom: '1px solid #E2E8F0' };
const td: React.CSSProperties = { padding: '7px 10px', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' };
