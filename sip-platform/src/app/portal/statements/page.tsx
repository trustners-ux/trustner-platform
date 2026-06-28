import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPortalSessionFromServer } from '@/lib/portal/session';
import PortalShell from '../PortalShell';

export const metadata = { title: 'Statements — Trustner portal', robots: { index: false, follow: false } };

export default async function StatementsPage() {
  const session = await getPortalSessionFromServer();
  if (!session) redirect('/portal/login');

  return (
    <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Statements</h1>
      <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 18px' }}>Account statements, transaction history, and tax-saving reports.</p>

      <div style={{ padding: '28px 22px', background: 'linear-gradient(135deg, #ECFEFF, #CFFAFE)', border: '1px solid #67E8F9', borderRadius: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0E7490' }}>Self-service statements coming in Phase D</div>
        <p style={{ fontSize: 13, color: '#0F766E', marginTop: 8, lineHeight: 1.6 }}>
          You&apos;ll soon be able to download CAMS / Karvy consolidated statements, capital-gains
          reports for FY-end tax filing, and monthly SIP confirmations — all directly from this
          portal.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/portal/requests/new?category=statement_request" style={{
            display: 'inline-block', padding: '10px 18px',
            background: 'linear-gradient(135deg,#1E40AF,#06B6D4)',
            color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13,
            textDecoration: 'none',
          }}>
            Request a statement now →
          </Link>
        </p>
      </div>
    </PortalShell>
  );
}
