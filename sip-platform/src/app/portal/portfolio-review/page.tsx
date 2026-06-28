import { redirect } from 'next/navigation';
import { getPortalSessionFromServer } from '@/lib/portal/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import PortalShell from '../PortalShell';
import UploadClient from './UploadClient';

export const metadata = { title: 'Portfolio Health Check — Trustner portal', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PortfolioReviewPage() {
  const session = await getPortalSessionFromServer();
  if (!session) redirect('/portal/login');

  // Fetch past reviews for this client
  let pastReviews: Array<{
    id: number; documentId: string; familyName: string; status: string;
    createdAt: string; numHoldings: number; currentValueInr: number;
    totalInvestedInr: number; gainInr: number;
    verdicts: { star: number; keep: number; watch: number; swap: number; liquidate: number };
  }> = [];

  const sb = getSupabaseAdmin();
  if (sb) {
    const { data: client } = await sb
      .from('clients')
      .select('mobile_primary, email_primary')
      .eq('id', session.clientId)
      .maybeSingle();

    if (client) {
      const mobile = (client.mobile_primary as string)?.trim();
      const email = (client.email_primary as string)?.trim();

      let familyQuery = sb.from('pd_client_families').select('id');
      if (mobile && email) {
        familyQuery = familyQuery.or(`primary_contact_mobile.eq.${mobile},primary_contact_email.ilike.${email}`);
      } else if (mobile) {
        familyQuery = familyQuery.eq('primary_contact_mobile', mobile);
      } else if (email) {
        familyQuery = familyQuery.ilike('primary_contact_email', email);
      }

      const { data: families } = await familyQuery;
      if (families && families.length > 0) {
        const familyIds = families.map((f) => f.id as number);
        const { data: runs } = await sb
          .from('pd_diagnostic_runs')
          .select('id, document_id, family_name, status, created_at, num_holdings, current_value_inr, total_invested_inr, unrealised_gain_inr, verdict_star_count, verdict_keep_count, verdict_watch_count, verdict_swap_count, verdict_liquidate_count')
          .in('family_id', familyIds)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(10);

        pastReviews = (runs || []).map((r) => ({
          id: r.id as number,
          documentId: r.document_id as string,
          familyName: r.family_name as string,
          status: r.status as string,
          createdAt: r.created_at as string,
          numHoldings: r.num_holdings as number,
          currentValueInr: Number(r.current_value_inr) || 0,
          totalInvestedInr: Number(r.total_invested_inr) || 0,
          gainInr: Number(r.unrealised_gain_inr) || 0,
          verdicts: {
            star: (r.verdict_star_count as number) ?? 0,
            keep: (r.verdict_keep_count as number) ?? 0,
            watch: (r.verdict_watch_count as number) ?? 0,
            swap: (r.verdict_swap_count as number) ?? 0,
            liquidate: (r.verdict_liquidate_count as number) ?? 0,
          },
        }));
      }
    }
  }

  return (
    <PortalShell displayName={session.displayName} clientCode={session.clientCode}>
      <UploadClient pastReviews={pastReviews} />
    </PortalShell>
  );
}
