/**
 * Portfolio Diagnostic — Detail API
 *
 * GET /api/admin/portfolio-diagnostic/[id]
 *
 * Returns the full diagnostic + holdings + sips + comments,
 * and the list of workflow actions the current user can perform.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logArtefactView } from '@/lib/permissions/hierarchy';
import type { Verdict } from '@/lib/portfolio-diagnostic/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const employeeEmail = await resolveEmployeeEmail();
  if (!employeeEmail) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // ── Load diagnostic ────────────────────────────────────────
  const { data: run, error: runErr } = await supabase
    .from('pd_diagnostic_runs')
    .select(`
      id, document_id, family_id, family_name, status, methodology_version,
      uploaded_by_employee_id, current_reviewer_employee_id, approved_by_employee_id,
      approved_at, published_at, created_at, updated_at,
      num_entities, num_holdings, num_active_sips, num_unique_funds, num_amcs,
      total_invested_inr, current_value_inr, unrealised_gain_inr,
      family_xirr_pct, monthly_sip_flow_inr, annual_sip_flow_inr,
      verdict_star_count, verdict_keep_count, verdict_watch_count,
      verdict_swap_count, verdict_liquidate_count,
      uploader:employees!pd_diagnostic_runs_uploaded_by_employee_id_fkey(name),
      reviewer:employees!pd_diagnostic_runs_current_reviewer_employee_id_fkey(name)
    `)
    .eq('id', parseInt(id, 10))
    .single();

  if (runErr || !run) {
    return NextResponse.json(
      { error: `Diagnostic not found: ${runErr?.message}` },
      { status: 404 }
    );
  }

  // ── Audit log: record this read ──
  // Fire-and-forget — never blocks the user-facing response.
  // Resolves the viewer's employees.id by email asynchronously and
  // writes one row to app_artefact_views with the artefact link.
  void (async () => {
    const sb = getSupabaseAdmin();
    if (!sb) return;
    const { data: emp } = await sb
      .from('employees')
      .select('id')
      .ilike('email', employeeEmail.trim())
      .maybeSingle();
    if (emp?.id) {
      await logArtefactView({
        viewerEmployeeId: emp.id as number,
        artefactType: 'portfolio_diagnostic',
        artefactId: parseInt(id, 10),
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
    }
  })();

  // ── Load holdings ─────────────────────────────────────────
  const { data: holdings } = await supabase
    .from('pd_diagnostic_holdings')
    .select(`
      id, entity_id, fund_name, amfi_code, folio_number, category,
      units, invested_inr, current_value_inr, unrealised_gain_inr,
      xirr_pct, holding_period_months, first_investment_date,
      cagr_1y, cagr_3y, cagr_5y, category_median_3y, category_median_5y,
      category_quartile, composite_score, verdict, verdict_rationale,
      original_verdict, override_reason,
      entity:pd_family_entities(id, entity_name, entity_type)
    `)
    .eq('diagnostic_run_id', parseInt(id, 10))
    .order('id');

  // ── Load SIPs ─────────────────────────────────────────────
  const { data: sips } = await supabase
    .from('pd_diagnostic_sips')
    .select(`
      id, entity_id, fund_name, amfi_code, folio_number, category,
      monthly_amount_inr, actual_amount_inr, frequency, sip_day_of_month,
      start_date, end_date, status, has_step_up, step_up_pct, step_up_frequency,
      installments_completed, total_installments, next_installment_date,
      bank_mandate_status, age_in_months, expected_annual_inflow_inr,
      expected_5y_inflow_inr, fund_verdict, recommended_action, recommended_redirect_fund,
      entity:pd_family_entities(id, entity_name)
    `)
    .eq('diagnostic_run_id', parseInt(id, 10))
    .order('monthly_amount_inr', { ascending: false });

  // ── Load comments ─────────────────────────────────────────
  const { data: comments } = await supabase
    .from('pd_review_comments')
    .select(`
      id, holding_id, sip_id, comment_text, created_at, resolved_at,
      author:employees!pd_review_comments_author_employee_id_fkey(name),
      author_role:employees!pd_review_comments_author_employee_id_fkey(designation)
    `)
    .eq('diagnostic_run_id', parseInt(id, 10))
    .order('created_at', { ascending: false })
    .limit(200);

  // ── Available actions for current user ────────────────────
  const availableActions = computeAvailableActions(run.status as string);

  // ── Format response ──────────────────────────────────────
  const verdictCounts: Record<Verdict, number> = {
    STAR: (run.verdict_star_count as number) || 0,
    KEEP: (run.verdict_keep_count as number) || 0,
    WATCH: (run.verdict_watch_count as number) || 0,
    SWAP: (run.verdict_swap_count as number) || 0,
    LIQUIDATE: (run.verdict_liquidate_count as number) || 0,
  };

  return NextResponse.json({
    diagnostic: {
      id: run.id,
      documentId: run.document_id,
      familyName: run.family_name,
      status: run.status,
      uploadedByName: extractName(run.uploader),
      currentReviewerName: extractName(run.reviewer),
      totalInvestedInr: Number(run.total_invested_inr) || 0,
      currentValueInr: Number(run.current_value_inr) || 0,
      familyXirrPct: run.family_xirr_pct as number | null,
      monthlySipFlowInr: Number(run.monthly_sip_flow_inr) || 0,
      numHoldings: (run.num_holdings as number) || 0,
      numActiveSips: (run.num_active_sips as number) || 0,
      verdictCounts,
      holdings: (holdings ?? []).map((h) => ({
        id: String(h.id),
        entityId: String(h.entity_id),
        entityName: extractEntityName(h.entity),
        entityType: 'Individual',
        fundName: h.fund_name,
        amfiCode: h.amfi_code,
        category: h.category,
        folioNumber: h.folio_number,
        units: Number(h.units) || 0,
        investedInr: Number(h.invested_inr) || 0,
        currentValueInr: Number(h.current_value_inr) || 0,
        unrealisedGainInr: Number(h.unrealised_gain_inr) || 0,
        xirrPct: h.xirr_pct as number | null,
        holdingPeriodMonths: (h.holding_period_months as number) || 0,
        firstInvestmentDate: h.first_investment_date,
        cagr1y: h.cagr_1y as number | null,
        cagr3y: h.cagr_3y as number | null,
        cagr5y: h.cagr_5y as number | null,
        categoryMedian3y: h.category_median_3y as number | null,
        categoryMedian5y: h.category_median_5y as number | null,
        categoryQuartile: h.category_quartile as 1 | 2 | 3 | 4 | null,
        compositeScore: h.composite_score as number | null,
        verdict: h.verdict as Verdict,
        verdictRationale: h.verdict_rationale ?? '',
      })),
      sips: (sips ?? []).map((s) => ({
        id: String(s.id),
        entityId: String(s.entity_id),
        entityName: extractEntityName(s.entity),
        fundName: s.fund_name,
        amfiCode: s.amfi_code,
        category: s.category,
        folioNumber: s.folio_number,
        monthlyAmountInr: Number(s.monthly_amount_inr) || 0,
        actualAmountInr: Number(s.actual_amount_inr) || 0,
        frequency: s.frequency,
        sipDayOfMonth: s.sip_day_of_month,
        startDate: s.start_date,
        endDate: s.end_date,
        status: s.status,
        hasStepUp: s.has_step_up,
        stepUpPct: s.step_up_pct,
        stepUpFrequency: s.step_up_frequency,
        installmentsCompleted: s.installments_completed,
        totalInstallments: s.total_installments,
        nextInstallmentDate: s.next_installment_date,
        bankMandateStatus: s.bank_mandate_status,
        ageInMonths: (s.age_in_months as number) || 0,
        expectedAnnualInflowInr: Number(s.expected_annual_inflow_inr) || 0,
        expected5YInflowInr: Number(s.expected_5y_inflow_inr) || 0,
        fundVerdict: s.fund_verdict as Verdict | null,
        recommendedAction: s.recommended_action,
        recommendedRedirectFund: s.recommended_redirect_fund,
      })),
      availableActions,
    },
    comments: (comments ?? []).map((c) => ({
      id: c.id,
      authorName: extractName(c.author),
      authorRole: extractName(c.author_role, 'designation') ?? '',
      holdingId: c.holding_id,
      sipId: c.sip_id,
      commentText: c.comment_text,
      createdAt: c.created_at,
      resolvedAt: c.resolved_at,
    })),
  });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return payload.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) return payload.email;
  }
  return null;
}

function extractName(emp: unknown, key = 'name'): string | null {
  if (!emp) return null;
  if (Array.isArray(emp)) {
    return emp.length > 0 ? ((emp[0] as Record<string, string>)[key] ?? null) : null;
  }
  if (typeof emp === 'object' && emp !== null && key in emp) {
    return ((emp as Record<string, string>)[key]) ?? null;
  }
  return null;
}

function extractEntityName(entity: unknown): string {
  if (!entity) return 'Unknown';
  if (Array.isArray(entity)) {
    return entity.length > 0 ? ((entity[0] as { entity_name?: string }).entity_name ?? 'Unknown') : 'Unknown';
  }
  if (typeof entity === 'object' && entity !== null && 'entity_name' in entity) {
    return (entity as { entity_name?: string }).entity_name ?? 'Unknown';
  }
  return 'Unknown';
}

function computeAvailableActions(status: string): string[] {
  // Simplified — full permission check is in workflow-state-machine.ts.
  // The UI uses these to render the right buttons.
  switch (status) {
    case 'DRAFT':
    case 'CHANGES_REQUESTED':
      return ['EDIT_DRAFT', 'SUBMIT'];
    case 'SUBMITTED':
      return ['ASSIGN_REVIEWER', 'REJECT'];
    case 'IN_REVIEW':
    case 'ESCALATED':
      return ['APPROVE', 'REQUEST_CHANGES', 'REJECT', 'COMMENT'];
    case 'APPROVED':
      return ['PUBLISH', 'COMMENT'];
    case 'PUBLISHED':
      return ['ARCHIVE', 'COMMENT'];
    default:
      return ['COMMENT'];
  }
}
