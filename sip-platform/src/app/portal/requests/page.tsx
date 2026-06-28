import { redirect } from 'next/navigation';
import { getPortalSessionFromServer } from '@/lib/portal/session';
import PortalShell from '../PortalShell';
import RequestsList from './RequestsList';

export const metadata = { title: 'Service requests — Trustner portal', robots: { index: false, follow: false } };

export default async function PortalRequestsPage() {
  const session = await getPortalSessionFromServer();
  if (!session) redirect('/portal/login');
  return (
    <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
      <RequestsList />
    </PortalShell>
  );
}
