/**
 * Investment Proposal — Create Draft
 *
 * POST /api/admin/investment-proposal/draft
 *
 * Body: { familyId, familyName, purpose, riskProfile, horizon,
 *         proposedAmountInr, proposedLumpSumInr, proposedMonthlySipInr,
 *         goalStatement, allocation? }
 *
 * Creates a new row in ip_investment_proposals with status DRAFT and
 * the seed allocation copied from ALLOCATION_TEMPLATES[riskProfile].
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { ALLOCATION_TEMPLATES } from '@/lib/investment-proposal/types';
import type { RiskProfile, ProposalPurpose, HorizonBand } from '@/lib/investment-proposal/types';

export async function POST(req: NextRequest) {
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const { data: emp } = await supabase
    .from('employees')
    .select('id, name')
    .ilike('email', email.trim())
    .maybeSingle();
  if (!emp) {
    return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });
  }
  const employeeId = emp.id as number;

  const body = await req.json().catch(() => null) as {
    familyId: number;
    familyName: string;
    purpose: ProposalPurpose;
    customPurposeNote?: string;
    riskProfile: RiskProfile;
    horizon: HorizonBand;
    proposedAmountInr: number;
    proposedLumpSumInr?: number;
    proposedMonthlySipInr?: number;
    goalStatement?: string;
  } | null;

  if (!body || !body.familyId || !body.purpose || !body.riskProfile || !body.horizon || !body.proposedAmountInr) {
    return NextResponse.json(
      { error: 'Missing required fields: familyId, purpose, riskProfile, horizon, proposedAmountInr' },
      { status: 400 }
    );
  }

  // Seed allocation from template — reviewer can override later
  const alloc = ALLOCATION_TEMPLATES[body.riskProfile];

  const documentId = `IP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const { data: row, error } = await supabase
    .from('ip_investment_proposals')
    .insert({
      document_id: documentId,
      family_id: body.familyId,
      family_name: body.familyName,
      methodology_version: '1.0.0',
      status: 'DRAFT',
      uploaded_by_employee_id: employeeId,
      purpose: body.purpose,
      custom_purpose_note: body.customPurposeNote ?? null,
      proposed_amount_inr: body.proposedAmountInr,
      proposed_lump_sum_inr: body.proposedLumpSumInr ?? 0,
      proposed_monthly_sip_inr: body.proposedMonthlySipInr ?? 0,
      horizon: body.horizon,
      risk_profile: body.riskProfile,
      goal_statement: body.goalStatement ?? null,
      alloc_large_cap_pct: alloc.largeCap,
      alloc_mid_cap_pct: alloc.midCap,
      alloc_small_cap_pct: alloc.smallCap,
      alloc_flexi_cap_pct: alloc.flexiCap,
      alloc_multi_cap_pct: alloc.multiCap,
      alloc_large_and_mid_pct: alloc.largeAndMid,
      alloc_hybrid_pct: alloc.hybrid,
      alloc_debt_pct: alloc.debt,
      alloc_international_pct: alloc.international,
      alloc_gold_pct: alloc.gold,
    })
    .select('id, document_id')
    .single();

  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create draft' }, { status: 500 });
  }

  // Audit
  await supabase.from('pd_workflow_events').insert({
    entity_type: 'investment_proposal',
    entity_id: row.id,
    from_status: null,
    to_status: 'DRAFT',
    action: 'CREATE',
    actor_employee_id: employeeId,
    actor_name: emp.name,
    actor_email: email,
    occurred_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    id: row.id,
    documentId: row.document_id,
  });
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
