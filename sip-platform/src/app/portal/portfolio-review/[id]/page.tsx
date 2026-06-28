import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getPortalSessionFromServer } from '@/lib/portal/session';
import PortalShell from '../../PortalShell';
import ReviewClient from './ReviewClient';

export const metadata = { title: 'Portfolio Health Report — Trustner portal', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ReviewResultPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getPortalSessionFromServer();
  if (!session) redirect('/portal/login');

  const { id } = await params;

  // Fetch review data from the API (reuses the auth + ownership check)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  // Server-side fetch needs to forward cookies for auth
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const res = await fetch(`${baseUrl}/api/portal/me/portfolio-review/${id}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
        <div style={{ padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Review not found</h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>
            This review may not exist or you may not have access to it.
          </p>
          <Link href="/portal/portfolio-review" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', background: '#1E40AF', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
            Upload New CAS
          </Link>
        </div>
      </PortalShell>
    );
  }

  const data = await res.json();

  return (
    <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
      <ReviewClient review={data.review} />
    </PortalShell>
  );
}
