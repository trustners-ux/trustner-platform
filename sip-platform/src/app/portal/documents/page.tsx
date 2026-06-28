import { redirect } from 'next/navigation';
import { getPortalSessionFromServer } from '@/lib/portal/session';
import PortalShell from '../PortalShell';
import DocumentsClient from './DocumentsClient';

export const metadata = { title: 'Documents — Trustner portal', robots: { index: false, follow: false } };

export default async function PortalDocumentsPage() {
  const session = await getPortalSessionFromServer();
  if (!session) redirect('/portal/login');
  return (
    <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
      <DocumentsClient />
    </PortalShell>
  );
}
