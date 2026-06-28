/**
 * /admin/client-master — Client master list (Phase A).
 *
 * Distinct from the existing /admin/clients (PD Client-Families).
 * This page is the FULL client master with KYC + bulk import,
 * built from the trustner Phase A spec.
 *
 * Today's surface: search + filter + create-new modal + bulk-import link.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerActor } from '@/lib/client-master/actor';
import { canReadClients, canWriteClients, canViewClientKyc } from '@/lib/client-master/permissions';
import { listClients, maskAadhaar, maskPan } from '@/lib/client-master/clients';
import type { ClientStatus, KycStatus } from '@/lib/client-master/types';
import NewClientButton from './NewClientButton';
import HeuristicLinkButton from './HeuristicLinkButton';

export const metadata = { title: 'Client master — Trustner', robots: { index: false, follow: false } };

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
  searchParams: Promise<{ q?: string; status?: string; kyc?: string; page?: string }>;
}

export default async function ClientMasterPage({ searchParams }: PageProps) {
  const a = await getServerActor();
  if (!a) redirect('/admin/login?next=/admin/client-master');
  if (!canReadClients(a.role)) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
      You don&apos;t have permission to view the client master. <Link href="/admin" style={{ color: '#1E40AF' }}>← Dashboard</Link>
    </div>;
  }
  const canWrite = canWriteClients(a.role);
  const canKyc = canViewClientKyc(a.role);

  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = sp.status as ClientStatus | undefined;
  const kyc = sp.kyc as KycStatus | undefined;
  const page = Math.max(Number(sp.page || '1'), 1);
  const limit = 50;
  const offset = (page - 1) * limit;
  const { rows, total } = await listClients({ q, status, kyc_status: kyc, limit, offset });
  const lastPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        <Link href="/admin" style={{ color: '#1E40AF', textDecoration: 'none' }}>← Dashboard</Link>
        {' / Client master'}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 4, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A1628', letterSpacing: '-.5px' }}>
            Client master <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginLeft: 8 }}>Phase A · early access</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, maxWidth: 820 }}>
            Every person we serve, with KYC, contact, address, consent flags, family
            graph, and imported metadata. Bulk-import from Wealth Elite / Investwell.
          </p>
        </div>
        {canWrite && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <HeuristicLinkButton />
            <Link href="/admin/client-master/import" style={importBtn}>↑ Bulk import</Link>
            <NewClientButton />
          </div>
        )}
      </div>

      {/* Search + filters */}
      <form method="GET" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          name="q"
          placeholder="Search by name, mobile, email, PAN, or MSI-CL code…"
          defaultValue={q ?? ''}
          style={{ flex: 1, minWidth: 240, padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13 }}
        />
        <select name="status" defaultValue={status ?? ''} style={selectStyle}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="dormant">Dormant</option>
          <option value="archived">Archived</option>
        </select>
        <select name="kyc" defaultValue={kyc ?? ''} style={selectStyle}>
          <option value="">All KYC</option>
          <option value="pending">KYC pending</option>
          <option value="in_progress">KYC in progress</option>
          <option value="verified">KYC verified</option>
          <option value="rejected">KYC rejected</option>
          <option value="expired">KYC expired</option>
        </select>
        <button type="submit" style={searchBtn}>Search</button>
        {(q || status || kyc) && (
          <Link href="/admin/client-master" style={{ ...searchBtn, background: '#F1F5F9', color: '#0A1628', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Clear</Link>
        )}
      </form>

      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
        {total} client{total === 1 ? '' : 's'} · page {page} of {lastPage}
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 32, background: '#F8FAFC', borderRadius: 12, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
          {q ? `No clients matched "${q}".` : 'No clients yet.'}
          {canWrite && !q && ' Click + New client to add one, or use Bulk import to drop in a Wealth Elite / Investwell file.'}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={th}>Code</th>
                <th style={th}>Name</th>
                <th style={th}>Mobile</th>
                <th style={th}>Email</th>
                <th style={th}>PAN</th>
                <th style={th}>Aadhaar</th>
                <th style={th}>City</th>
                <th style={th}>KYC</th>
                <th style={th}>Status</th>
                <th style={th}>Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const kycT = KYC_TINT[c.kyc_status] ?? KYC_TINT.pending;
                const statT = STATUS_TINT[c.status] ?? STATUS_TINT.active;
                return (
                  <tr key={c.id}>
                    <td style={td}>
                      <Link href={`/admin/client-master/${c.id}`} style={{ color: '#1E40AF', fontFamily: 'ui-monospace, monospace', fontSize: 11, textDecoration: 'none' }}>
                        {c.code}
                      </Link>
                    </td>
                    <td style={td}>
                      <b>{c.display_name}</b>
                      {c.dob && (
                        <>
                          <br />
                          <span style={{ fontSize: 10.5, color: '#94A3B8' }}>Age {c.age_years ?? '—'}</span>
                        </>
                      )}
                    </td>
                    <td style={td}>{c.mobile_primary || '—'}</td>
                    <td style={td}>{c.email_primary || '—'}</td>
                    <td style={td}>
                      <code style={{ fontSize: 10.5 }}>{canKyc ? c.pan || '—' : maskPan(c.pan)}</code>
                    </td>
                    <td style={td}>
                      <code style={{ fontSize: 10.5 }}>{maskAadhaar(c.aadhaar_last4)}</code>
                    </td>
                    <td style={td}>{c.addr_current_city || '—'}</td>
                    <td style={td}>
                      <span style={{ background: kycT.bg, color: kycT.fg, padding: '2px 8px', borderRadius: 999, fontSize: 9.5, fontWeight: 800 }}>
                        {c.kyc_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ background: statT.bg, color: statT.fg, padding: '2px 8px', borderRadius: 999, fontSize: 9.5, fontWeight: 800 }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 10.5, color: '#94A3B8' }}>{c.created_at?.slice(0, 10)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {lastPage > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16 }}>
          {Array.from({ length: lastPage }).map((_, i) => {
            const p = i + 1;
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            if (status) params.set('status', status);
            if (kyc) params.set('kyc', kyc);
            params.set('page', String(p));
            return (
              <Link
                key={p}
                href={`/admin/client-master?${params.toString()}`}
                style={{
                  padding: '5px 10px',
                  background: p === page ? '#1E40AF' : '#fff',
                  color: p === page ? '#fff' : '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 11,
                  textDecoration: 'none',
                  fontWeight: p === page ? 700 : 500,
                }}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', fontSize: 9.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', padding: '10px 12px', borderBottom: '1px solid #E2E8F0' };
const td: React.CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #F1F5F9', verticalAlign: 'top' };
const selectStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', background: '#fff' };
const searchBtn: React.CSSProperties = { padding: '8px 18px', background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const importBtn: React.CSSProperties = { padding: '8px 18px', background: '#fff', color: '#1E40AF', border: '1.5px solid #1E40AF', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
