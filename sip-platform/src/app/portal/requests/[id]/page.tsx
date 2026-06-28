import { redirect } from 'next/navigation';
import { getPortalSessionFromServer } from '@/lib/portal/session';
import PortalShell from '../../PortalShell';
import RequestThread from './RequestThread';

export const metadata = { title: 'Service request — Trustner portal', robots: { index: false, follow: false } };

interface Props { params: Promise<{ id: string }> }

export default async function RequestDetailPage({ params }: Props) {
  const session = await getPortalSessionFromServer();
  if (!session) redirect('/portal/login');
  const { id } = await params;
  return (
    <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
      <RequestThread id={id} />
    </PortalShell>
  );
}
