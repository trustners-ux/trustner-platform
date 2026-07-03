/**
 * Investment Proposal — Get/Update single proposal
 *
 * GET  /api/admin/investment-proposal/[id]
 * PUT  /api/admin/investment-proposal/[id]   (partial update of editable fields)
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { ALLOCATION_TEMPLATES } from '@/lib/investment-proposal/types';
import type { RiskProfile } from '@/lib/investment-proposal/types';
import { isAdvisoryRecordInScope } from '@/lib/advisory/visibility';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // DPDP need-to-know: only show proposals within the actor's scope.
  if (!(await isAdvisoryRecordInScope(supabase, 'ip_investment_proposals', numericId, { employeeEmail: email }))) {
    return NextResponse.json({ error: 'Not authorised for this proposal' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('ip_investment_proposals')
    .select(
      `*,
       uploader:employees!ip_investment_proposals_uploaded_by_employee_id_fkey(name, email),
       reviewer:employees!ip_investment_proposals_current_reviewer_employee_id_fkey(name, email),
       approver:employees!ip_investment_proposals_approved_by_employee_id_fkey(name, email),
       recommendations:ip_proposal_recommendations(*)`
    )
    .eq('id', numericId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  return NextResponse.json({ proposal: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // DPDP need-to-know: only edit proposals within the actor's scope.
  if (!(await isAdvisoryRecordInScope(supabase, 'ip_investment_proposals', numericId, { employeeEmail: email }))) {
    return NextResponse.json({ error: 'Not authorised for this proposal' }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Whitelist of editable fields
  const editable: Record<string, string> = {
    purpose: 'purpose',
    customPurposeNote: 'custom_purpose_note',
    proposedAmountInr: 'proposed_amount_inr',
    proposedLumpSumInr: 'proposed_lump_sum_inr',
    proposedMonthlySipInr: 'proposed_monthly_sip_inr',
    horizon: 'horizon',
    riskProfile: 'risk_profile',
    goalStatement: 'goal_statement',
    expected5yConservativeInr: 'expected_5y_conservative_inr',
    expected5yBaseInr: 'expected_5y_base_inr',
    expected5yOptimisticInr: 'expected_5y_optimistic_inr',
    expected10yBaseInr: 'expected_10y_base_inr',
    expectedLtcgAt5yInr: 'expected_ltcg_at_5y_inr',
    elssSavingsInr: 'elss_savings_inr',
  };

  const update: Record<string, unknown> = {};
  for (const [k, dbCol] of Object.entries(editable)) {
    if (body[k] !== undefined) update[dbCol] = body[k];
  }

  // Allocation fields (object form: { largeCap, midCap, ... })
  if (body.allocation && typeof body.allocation === 'object') {
    const alloc = body.allocation as Record<string, number>;
    const allocMap: Record<string, string> = {
      largeCap: 'alloc_large_cap_pct',
      midCap: 'alloc_mid_cap_pct',
      smallCap: 'alloc_small_cap_pct',
      flexiCap: 'alloc_flexi_cap_pct',
      multiCap: 'alloc_multi_cap_pct',
      largeAndMid: 'alloc_large_and_mid_pct',
      hybrid: 'alloc_hybrid_pct',
      debt: 'alloc_debt_pct',
      international: 'alloc_international_pct',
      gold: 'alloc_gold_pct',
    };
    for (const [k, dbCol] of Object.entries(allocMap)) {
      if (alloc[k] !== undefined) update[dbCol] = alloc[k];
    }
  }

  // If reset_allocation_from_template = true, copy template
  if (body.resetAllocationFromTemplate && typeof body.riskProfile === 'string') {
    const tpl = ALLOCATION_TEMPLATES[body.riskProfile as RiskProfile];
    if (tpl) {
      update.alloc_large_cap_pct = tpl.largeCap;
      update.alloc_mid_cap_pct = tpl.midCap;
      update.alloc_small_cap_pct = tpl.smallCap;
      update.alloc_flexi_cap_pct = tpl.flexiCap;
      update.alloc_multi_cap_pct = tpl.multiCap;
      update.alloc_large_and_mid_pct = tpl.largeAndMid;
      update.alloc_hybrid_pct = tpl.hybrid;
      update.alloc_debt_pct = tpl.debt;
      update.alloc_international_pct = tpl.international;
      update.alloc_gold_pct = tpl.gold;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('ip_investment_proposals')
    .update(update)
    .eq('id', numericId);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p) return p.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const p = await verifyEmployeeToken(empToken);
    if (p) return p.email;
  }
  return null;
}
