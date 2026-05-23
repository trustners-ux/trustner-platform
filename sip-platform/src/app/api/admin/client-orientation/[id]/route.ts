/**
 * Client Orientation — Get/Update single orientation
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { computeRiskCategory } from '@/lib/client-orientation/types';

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

  const { data, error } = await supabase
    .from('co_client_orientations')
    .select(
      `*,
       uploader:employees!co_client_orientations_uploaded_by_employee_id_fkey(name, email),
       reviewer:employees!co_client_orientations_current_reviewer_employee_id_fkey(name, email),
       approver:employees!co_client_orientations_approved_by_employee_id_fkey(name, email),
       risk_responses:co_risk_responses(*),
       goals:co_goals(*)`
    )
    .eq('id', numericId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Orientation not found' }, { status: 404 });
  }

  return NextResponse.json({ orientation: data });
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

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const editable: Record<string, string> = {
    monthlyHouseholdIncomeInr: 'monthly_household_income_inr',
    monthlyHouseholdExpensesInr: 'monthly_household_expenses_inr',
    monthlyExistingSipsInr: 'monthly_existing_sips_inr',
    monthlyEmisInr: 'monthly_emis_inr',
    emergencyFundMonths: 'emergency_fund_months',
    surplusForNewSipsInr: 'surplus_for_new_sips_inr',
    numDependents: 'num_dependents',
    horizonDecisionMaker: 'horizon_decision_maker',
    investmentExperienceYears: 'investment_experience_years',
    priorAdvisorExperience: 'prior_advisor_experience',
    prefChannel: 'pref_channel',
    prefReviewFrequency: 'pref_review_frequency',
    prefLanguage: 'pref_language',
  };

  const update: Record<string, unknown> = {};
  for (const [k, dbCol] of Object.entries(editable)) {
    if (body[k] !== undefined) update[dbCol] = body[k];
  }

  // Risk responses: replace all
  if (Array.isArray(body.riskResponses)) {
    const responses = body.riskResponses as Array<{
      questionCode: string;
      questionText: string;
      responseText: string;
      responseScore: number;
      responseOrder?: number;
    }>;
    const totalScore = responses.reduce((s, r) => s + (r.responseScore ?? 0), 0);
    const category = computeRiskCategory(totalScore);
    update.risk_score = totalScore;
    update.risk_category = category;
    update.risk_questionnaire_completed_at = new Date().toISOString();

    // Replace responses in sub-table
    await supabase.from('co_risk_responses').delete().eq('orientation_id', numericId);
    if (responses.length > 0) {
      await supabase.from('co_risk_responses').insert(
        responses.map((r) => ({
          orientation_id: numericId,
          question_code: r.questionCode,
          question_text: r.questionText,
          response_text: r.responseText,
          response_score: r.responseScore,
          response_order: r.responseOrder ?? null,
        }))
      );
    }
  }

  // Goals: replace all
  if (Array.isArray(body.goals)) {
    const goals = body.goals as Array<{
      goalType: string;
      customGoalName?: string;
      targetYear: number;
      targetCorpusTodayValueInr: number;
      inflationAssumptionPct: number;
      targetCorpusFutureValueInr?: number;
      expectedReturnPct: number;
      requiredMonthlySipInr?: number;
      existingCorpusInr: number;
      priority: 'High' | 'Medium' | 'Low';
      notes?: string;
    }>;

    await supabase.from('co_goals').delete().eq('orientation_id', numericId);
    if (goals.length > 0) {
      await supabase.from('co_goals').insert(
        goals.map((g) => ({
          orientation_id: numericId,
          goal_type: g.goalType,
          custom_goal_name: g.customGoalName ?? null,
          target_year: g.targetYear,
          target_corpus_today_value_inr: g.targetCorpusTodayValueInr,
          inflation_assumption_pct: g.inflationAssumptionPct,
          target_corpus_future_value_inr: g.targetCorpusFutureValueInr ?? null,
          expected_return_pct: g.expectedReturnPct,
          required_monthly_sip_inr: g.requiredMonthlySipInr ?? null,
          existing_corpus_inr: g.existingCorpusInr,
          priority: g.priority,
          notes: g.notes ?? null,
        }))
      );
    }
  }

  if (Object.keys(update).length === 0 && !body.riskResponses && !body.goals) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('co_client_orientations')
    .update(update)
    .eq('id', numericId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
