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
import { writeAuditEvent } from '@/lib/trustner-agent-platform/workflow-actions';
import { ALLOCATION_TEMPLATES } from '@/lib/investment-proposal/types';
import type { RiskProfile, ProposalPurpose, HorizonBand, AssetAllocation } from '@/lib/investment-proposal/types';

/**
 * Scale a template allocation so the equity sleeves sum to `targetEq`% and the
 * defensive sleeves (hybrid/debt/gold) make up the rest, preserving each group's
 * relative weights. Rounding drift is absorbed within the SAME group it came from
 * (equity drift → an equity sleeve, defensive drift → a defensive sleeve) — never
 * across groups, so a genuine 0%-equity (fully de-risked) target can't pick up a
 * stray 1% equity sleeve from the other group's rounding.
 */
function blendToTargetEquity(a: AssetAllocation, targetEq: number): AssetAllocation {
  const eqKeys: (keyof AssetAllocation)[] = ['largeCap', 'midCap', 'smallCap', 'flexiCap', 'multiCap', 'largeAndMid', 'international'];
  const defKeys: (keyof AssetAllocation)[] = ['hybrid', 'debt', 'gold'];
  const eqSum = eqKeys.reduce((s, k) => s + a[k], 0);
  const defSum = defKeys.reduce((s, k) => s + a[k], 0);
  const defTarget = 100 - targetEq;
  const out: AssetAllocation = { ...a };
  if (eqSum > 0) for (const k of eqKeys) out[k] = Math.round((a[k] / eqSum) * targetEq);
  else out.flexiCap = targetEq;
  if (defSum > 0) for (const k of defKeys) out[k] = Math.round((a[k] / defSum) * defTarget);
  else out.hybrid = defTarget;

  const eqDrift = targetEq - eqKeys.reduce((s, k) => s + out[k], 0);
  if (eqDrift !== 0) {
    const big = eqKeys.reduce((m, k) => (out[k] > out[m] ? k : m), eqKeys[0]);
    out[big] += eqDrift;
  }
  const defDrift = defTarget - defKeys.reduce((s, k) => s + out[k], 0);
  if (defDrift !== 0) {
    const big = defKeys.reduce((m, k) => (out[k] > out[m] ? k : m), defKeys[0]);
    out[big] += defDrift;
  }
  return out;
}

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

  // Seed allocation, grounded in the client's PD risk model where available:
  // start from the risk-profile template, then scale the equity/defensive split to
  // the diagnostic's target equity % (keeping the template's relative sleeve
  // weights). Falls back to the plain template. Reviewer can override later.
  let alloc = { ...ALLOCATION_TEMPLATES[body.riskProfile] };
  try {
    const { data: run } = await supabase
      .from('pd_diagnostic_runs')
      .select('rm_target_equity_pct')
      .eq('family_id', body.familyId)
      .in('status', ['APPROVED', 'PUBLISHED'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const targetEq = run?.rm_target_equity_pct as number | null | undefined;
    if (targetEq != null && targetEq >= 0 && targetEq <= 100) {
      alloc = blendToTargetEquity(alloc, targetEq);
    }
  } catch {
    // Grounding is opportunistic — fall back to the template on any miss.
  }

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
    console.error(error?.message ?? 'Failed to create investment-proposal draft');
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }

  await writeAuditEvent({
    entityType: 'investment_proposal',
    entityId: row.id,
    fromStatus: null,
    toStatus: 'DRAFT',
    action: 'CREATE',
    actorEmployeeId: employeeId,
    actorName: emp.name,
    actorEmail: email,
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
