/**
 * GET /api/portal/me/portfolio-review/[id]
 *
 * Fetch detailed PD results for a single run. Gated to the client's
 * own family — can't read anyone else's review.
 *
 * Client-facing view: shows verdicts and fund health but gates
 * replacement fund names (shows category hint instead of specific fund).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalSessionFromRequest } from '@/lib/portal/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Verdict = 'STAR' | 'KEEP' | 'WATCH' | 'SWAP' | 'LIQUIDATE';

const VERDICT_CLIENT_LABELS: Record<Verdict, { label: string; color: string; description: string }> = {
  STAR: { label: 'Excellent', color: '#059669', description: 'Top-performing fund — keep investing.' },
  KEEP: { label: 'Good', color: '#0D9488', description: 'Performing well. No action needed.' },
  WATCH: { label: 'Monitor', color: '#D97706', description: 'Needs attention — review with your advisor.' },
  SWAP: { label: 'Needs Change', color: '#EA580C', description: 'Better alternatives available. Talk to your advisor.' },
  LIQUIDATE: { label: 'Exit', color: '#DC2626', description: 'Consider exiting. Consult your advisor for tax-efficient timing.' },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getPortalSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const runId = parseInt(id, 10);
  if (!runId || isNaN(runId)) {
    return NextResponse.json({ ok: false, error: 'Invalid review ID' }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Database unavailable' }, { status: 503 });
  }

  // Load the run
  const { data: run } = await sb
    .from('pd_diagnostic_runs')
    .select('id, document_id, family_id, family_name, status, created_at, num_holdings, num_active_sips, num_unique_funds, num_amcs, total_invested_inr, current_value_inr, unrealised_gain_inr, monthly_sip_flow_inr, verdict_star_count, verdict_keep_count, verdict_watch_count, verdict_swap_count, verdict_liquidate_count, rm_profile_label, rm_target_equity_pct, rm_client_posture, engine_version, v2_consolidation_dupes, v2_tax_est_inr, risk_profile_captured')
    .eq('id', runId)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!run) {
    return NextResponse.json({ ok: false, error: 'Review not found' }, { status: 404 });
  }

  // Verify this run belongs to the client's family
  const { data: client } = await sb
    .from('clients')
    .select('mobile_primary, email_primary')
    .eq('id', session.clientId)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ ok: false, error: 'Client not found' }, { status: 404 });
  }

  const { data: family } = await sb
    .from('pd_client_families')
    .select('id, primary_contact_mobile, primary_contact_email')
    .eq('id', run.family_id as number)
    .maybeSingle();

  if (!family) {
    return NextResponse.json({ ok: false, error: 'Review not found' }, { status: 404 });
  }

  const clientMobile = (client.mobile_primary as string)?.trim();
  const clientEmail = (client.email_primary as string)?.trim()?.toLowerCase();
  const familyMobile = (family.primary_contact_mobile as string)?.trim();
  const familyEmail = (family.primary_contact_email as string)?.trim()?.toLowerCase();

  const isOwner = (clientMobile && familyMobile && clientMobile === familyMobile) ||
    (clientEmail && familyEmail && clientEmail === familyEmail);

  if (!isOwner) {
    return NextResponse.json({ ok: false, error: 'Review not found' }, { status: 404 });
  }

  // Load holdings with fund details
  const { data: holdings } = await sb
    .from('pd_diagnostic_holdings')
    .select('id, fund_name, category, units, invested_inr, current_value_inr, unrealised_gain_inr, verdict, verdict_rationale, v2_action, v2_action_label, v2_rationale, v2_quality_verdict, v2_suitability, v2_fund_risk_tier, v2_quality_gates, entity:pd_family_entities(entity_name)')
    .eq('diagnostic_run_id', runId)
    .order('current_value_inr', { ascending: false });

  // Load SIPs
  const { data: sips } = await sb
    .from('pd_diagnostic_sips')
    .select('id, fund_name, monthly_amount_inr, frequency, status, fund_verdict, recommended_action, entity:pd_family_entities(entity_name)')
    .eq('diagnostic_run_id', runId);

  // Build client-safe response (gate replacement fund names)
  const clientHoldings = (holdings || []).map((h) => {
    const verdict = (h.verdict as Verdict) || 'WATCH';
    const clientVerdict = VERDICT_CLIENT_LABELS[verdict] || VERDICT_CLIENT_LABELS.WATCH;

    return {
      id: h.id,
      fundName: h.fund_name,
      category: h.category,
      entityName: extractEntityName(h.entity),
      investedInr: h.invested_inr,
      currentValueInr: h.current_value_inr,
      gainInr: h.unrealised_gain_inr,
      gainPct: Number(h.invested_inr) > 0
        ? Number(((Number(h.current_value_inr) - Number(h.invested_inr)) / Number(h.invested_inr) * 100).toFixed(1))
        : 0,
      verdict: {
        code: verdict,
        ...clientVerdict,
      },
      action: h.v2_action_label || h.v2_action || null,
      qualityVerdict: h.v2_quality_verdict,
      suitability: h.v2_suitability,
      riskTier: h.v2_fund_risk_tier,
      // Gate: show category-level hint, not specific fund names
      suggestion: (verdict === 'SWAP' || verdict === 'LIQUIDATE')
        ? `Speak with your Trustner advisor for a ${h.category || 'suitable'} alternative.`
        : null,
    };
  });

  const clientSips = (sips || []).map((s) => ({
    id: s.id,
    fundName: s.fund_name,
    monthlyAmountInr: s.monthly_amount_inr,
    frequency: s.frequency,
    status: s.status,
    entityName: extractEntityName(s.entity),
    fundVerdict: s.fund_verdict,
    action: s.recommended_action,
  }));

  const totalInvested = Number(run.total_invested_inr) || 0;
  const currentValue = Number(run.current_value_inr) || 0;

  return NextResponse.json({
    ok: true,
    review: {
      id: run.id,
      documentId: run.document_id,
      familyName: run.family_name,
      status: run.status,
      createdAt: run.created_at,
      riskProfileCaptured: !!run.risk_profile_captured,
      profileLabel: run.rm_profile_label,
      targetEquityPct: run.rm_target_equity_pct,
      clientPosture: run.rm_client_posture,
      summary: {
        numHoldings: run.num_holdings,
        numActiveSips: run.num_active_sips,
        numFunds: run.num_unique_funds,
        numAmcs: run.num_amcs,
        totalInvestedInr: totalInvested,
        currentValueInr: currentValue,
        gainInr: currentValue - totalInvested,
        gainPct: totalInvested > 0 ? Number(((currentValue - totalInvested) / totalInvested * 100).toFixed(1)) : 0,
        monthlySipFlowInr: run.monthly_sip_flow_inr,
        verdicts: {
          star: run.verdict_star_count ?? 0,
          keep: run.verdict_keep_count ?? 0,
          watch: run.verdict_watch_count ?? 0,
          swap: run.verdict_swap_count ?? 0,
          liquidate: run.verdict_liquidate_count ?? 0,
        },
        duplicateFunds: run.v2_consolidation_dupes ?? 0,
        estimatedTaxInr: run.v2_tax_est_inr ?? 0,
      },
      holdings: clientHoldings,
      sips: clientSips,
    },
  });
}

function extractEntityName(entity: unknown): string {
  if (!entity) return 'Unknown';
  if (Array.isArray(entity)) return entity.length > 0 ? (entity[0] as { entity_name?: string })?.entity_name || 'Unknown' : 'Unknown';
  if (typeof entity === 'object' && entity !== null && 'entity_name' in entity) return (entity as { entity_name: string }).entity_name;
  return 'Unknown';
}
