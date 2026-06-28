import { redirect } from 'next/navigation';
import { getPortalSessionFromServer } from '@/lib/portal/session';
import { getPortalHoldingsView } from '@/lib/portal/holdings';
import PortalShell from '../PortalShell';
import HoldingsClient from './HoldingsClient';

export const metadata = { title: 'Holdings — Trustner portal', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function HoldingsPage() {
  const session = await getPortalSessionFromServer();
  if (!session) redirect('/portal/login');

  const view = await getPortalHoldingsView(session.clientId);

  return (
    <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
      <HoldingsClient view={view} displayName={session.displayName} />
    </PortalShell>
  );
}
