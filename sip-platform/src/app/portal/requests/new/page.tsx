import { redirect } from 'next/navigation';
import { getPortalSessionFromServer } from '@/lib/portal/session';
import PortalShell from '../../PortalShell';
import NewRequestForm from './NewRequestForm';

export const metadata = { title: 'New service request — Trustner portal', robots: { index: false, follow: false } };

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function NewRequestPage({ searchParams }: PageProps) {
  const session = await getPortalSessionFromServer();
  if (!session) redirect('/portal/login');
  const sp = await searchParams;
  return (
    <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
      <NewRequestForm initialCategory={sp.category || 'other'} />
    </PortalShell>
  );
}
