/**
 * /admin/client-master/import — Bulk import wizard.
 *
 * Accepts XLSX / CSV / PDF exports from Investwell, Redvision Wealth
 * Elite, or any RM's ad-hoc Excel. Three-step flow:
 *   1. Upload  → drop file, server parses heuristic + Claude fallback
 *   2. Preview → review rows, fix typos inline, tick dedupe candidates
 *   3. Commit  → server creates clients in a loop; partial success ok
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerActor } from '@/lib/client-master/actor';
import { canWriteClients } from '@/lib/client-master/permissions';
import ImportWizard from './ImportWizard';

export const metadata = { title: 'Bulk import clients — Trustner', robots: { index: false, follow: false } };

export default async function ImportPage() {
  const a = await getServerActor();
  if (!a) redirect('/admin/login?next=/admin/client-master/import');
  if (!canWriteClients(a.role)) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
      You don&apos;t have permission to import clients. <Link href="/admin/client-master" style={{ color: '#1E40AF' }}>← Back</Link>
    </div>;
  }
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        <Link href="/admin" style={{ color: '#1E40AF', textDecoration: 'none' }}>← Dashboard</Link>
        {' / '}<Link href="/admin/client-master" style={{ color: '#1E40AF', textDecoration: 'none' }}>Client master</Link>
        {' / Bulk import'}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A1628', letterSpacing: '-.5px', marginTop: 4 }}>
        Bulk import clients
      </h1>
      <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, maxWidth: 820 }}>
        Drop an Investwell export, Redvision Wealth Elite export, or any RM&apos;s Excel of
        client details. The parser handles common column layouts heuristically; tricky files
        fall back to Claude for column inference. After parsing, review the preview, fix
        anything obvious, and commit.
      </p>
      <div style={{ padding: 12, background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 10, marginTop: 14, marginBottom: 18, fontSize: 12.5, color: '#92400E' }}>
        <b>What we import:</b> name, salutation, DOB, gender, mobile, email, PAN, address,
        occupation, income band, risk profile, residential status, + the source platform&apos;s
        client code (for cross-reference later).<br />
        <b>What we DON&apos;T import:</b> Aadhaar (never via Excel — DPDPA), existing policies,
        or MF holdings.
      </div>
      <ImportWizard />
    </div>
  );
}
