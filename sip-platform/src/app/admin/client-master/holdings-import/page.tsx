/**
 * /admin/client-master/holdings-import — Bulk import holdings + SIP mandates.
 *
 * Upload Excel/CSV → preview rows with auto-resolved clients →
 * accept resolutions or edit → commit.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerActor } from '@/lib/client-master/actor';
import { canWriteClients } from '@/lib/client-master/permissions';
import HoldingsImportWizard from './HoldingsImportWizard';

export const metadata = { title: 'Holdings Import — Trustner', robots: { index: false, follow: false } };

export default async function HoldingsImportPage() {
  const a = await getServerActor();
  if (!a) redirect('/admin/login?next=/admin/client-master/holdings-import');
  if (!canWriteClients(a.role)) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Forbidden.</div>;
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>
        <Link href="/admin" style={{ color: '#1E40AF', textDecoration: 'none' }}>← Dashboard</Link>
        {' / '}<Link href="/admin/client-master" style={{ color: '#1E40AF', textDecoration: 'none' }}>Client master</Link>
        {' / Holdings import'}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A1628', letterSpacing: '-.5px', marginTop: 4 }}>
        Holdings Import
      </h1>
      <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, maxWidth: 820 }}>
        Upload an Excel or CSV export of mutual-fund holdings &amp; SIP mandates. The wizard
        auto-detects which sheet is which and resolves each row to a client via code, PAN,
        folio, or name. Review the preview, then commit. Existing rows are updated; new
        rows are inserted.
      </p>

      <HoldingsImportWizard />
    </div>
  );
}
