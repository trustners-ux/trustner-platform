/**
 * GET /api/portal/me/portfolio-review
 *
 * List the logged-in client's portfolio reviews (PD runs linked to their family).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalSessionFromRequest } from '@/lib/portal/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getPortalSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  // Find PD families linked to this client (by mobile or email)
  const { data: client } = await sb
    .from('clients')
    .select('mobile_primary, email_primary, display_name')
    .eq('id', session.clientId)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ ok: true, reviews: [] });
  }

  // Match families by mobile OR email
  let familyQuery = sb.from('pd_client_families').select('id');
  const mobile = (client.mobile_primary as string)?.trim();
  const email = (client.email_primary as string)?.trim();

  if (mobile && email) {
    familyQuery = familyQuery.or(`primary_contact_mobile.eq.${mobile},primary_contact_email.ilike.${email}`);
  } else if (mobile) {
    familyQuery = familyQuery.eq('primary_contact_mobile', mobile);
  } else if (email) {
    familyQuery = familyQuery.ilike('primary_contact_email', email);
  } else {
    return NextResponse.json({ ok: true, reviews: [] });
  }

  const { data: families } = await familyQuery;
  if (!families || families.length === 0) {
    return NextResponse.json({ ok: true, reviews: [] });
  }

  const familyIds = families.map((f) => f.id as number);

  const { data: runs } = await sb
    .from('pd_diagnostic_runs')
    .select('id, document_id, family_name, status, created_at, num_holdings, num_active_sips, current_value_inr, total_invested_inr, unrealised_gain_inr, verdict_star_count, verdict_keep_count, verdict_watch_count, verdict_swap_count, verdict_liquidate_count, rm_profile_label, engine_version')
    .in('family_id', familyIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20);

  const reviews = (runs || []).map((r) => ({
    id: r.id,
    documentId: r.document_id,
    familyName: r.family_name,
    status: r.status,
    createdAt: r.created_at,
    numHoldings: r.num_holdings,
    numActiveSips: r.num_active_sips,
    currentValueInr: r.current_value_inr,
    totalInvestedInr: r.total_invested_inr,
    gainInr: r.unrealised_gain_inr,
    verdicts: {
      star: r.verdict_star_count ?? 0,
      keep: r.verdict_keep_count ?? 0,
      watch: r.verdict_watch_count ?? 0,
      swap: r.verdict_swap_count ?? 0,
      liquidate: r.verdict_liquidate_count ?? 0,
    },
    profileLabel: r.rm_profile_label,
    engineVersion: r.engine_version,
  }));

  return NextResponse.json({ ok: true, reviews });
}
