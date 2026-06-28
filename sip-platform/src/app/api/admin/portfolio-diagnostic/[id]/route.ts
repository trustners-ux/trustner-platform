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
import { logArtefactView, getVisibleEmployeeIds } from '@/lib/permissions/hierarchy';
import type { Verdict } from '@/lib/portfolio-diagnostic/types';
import { loadBuyList, matchBuyList, bestOpenReplacement } from '@/lib/portfolio-diagnostic/v2/buylist';
import { subCategoryKey } from '@/lib/portfolio-diagnostic/v2/fund-engine';
import { logPdEvent } from '@/lib/portfolio-diagnostic/audit';
import { runPrePublishQa } from '@/lib/portfolio-diagnostic/qa';
import { requirePdAdmin } from '@/lib/portfolio-diagnostic/access-admin';
import { createSupabaseHoldingsProvider } from '@/lib/portfolio-diagnostic/holdings/provider';
import { aggregateFamilyStockOverlap } from '@/lib/portfolio-diagnostic/holdings/overlap-aggregator';

const SELL_ACTIONS = new Set(['SWITCH_BETTER', 'EXIT_UNSUITABLE', 'SWITCH_MODE', 'REDUCE', 'REDEEM_TINY']);

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
      risk_profile_captured, rm_capacity_score, rm_tolerance_score, rm_required_return_pct,
      rm_binding_constraint, rm_target_equity_pct, rm_age_rule_equity_pct, rm_capacity_overrode_age,
      rm_within_equity_ceiling, rm_profile_label, rm_client_posture, rm_rationale, engine_version,
      rp_primary_age, rp_life_stage, rp_monthly_income_inr, rp_monthly_expense_inr,
      rp_living_depends_on_this, rp_net_worth_buffer_inr, rp_longest_horizon_years,
      rp_stated_priority, rp_past_drawdown_behaviour, rp_target_corpus_inr, rp_years_to_goal,
      v2_consolidation, v2_consolidation_dupes, v2_consolidation_value_inr,
      v2_tax_summary, v2_tax_est_inr,
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

  // ── PRIVACY GATE — an RM must only open runs within their visibility scope ──
  // Without this any PD employee could open ANY run by id and see the full
  // client data (e.g. another RM's Bihani Family). Allow if: admin JWT (trusted
  // admin), OR firm scope, OR the run was uploaded by someone in the actor's
  // visible set (own + reports/subtree + explicit PD assignments), OR the actor
  // is this run's reviewer/approver.
  {
    const cookieStore = await cookies();
    const adminTok = cookieStore.get(COOKIE_NAME)?.value;
    const isAdminToken = adminTok ? !!(await verifyToken(adminTok)) : false;
    let allowed = isAdminToken;
    if (!allowed) {
      const { data: actor } = await supabase
        .from('employees').select('id').ilike('email', employeeEmail.trim()).maybeSingle();
      const actorId = (actor?.id as number) ?? 0;
      const scope = await getVisibleEmployeeIds({ employeeId: actorId, email: employeeEmail });
      if (scope.includeAll) {
        allowed = true;
      } else {
        const up = run.uploaded_by_employee_id as number | null;
        allowed =
          (up != null && scope.employeeIds.includes(up)) ||
          (actorId > 0 &&
            (run.current_reviewer_employee_id === actorId || run.approved_by_employee_id === actorId));
      }
    }
    if (!allowed) {
      return NextResponse.json(
        { error: 'You do not have access to this diagnostic — it belongs to another relationship manager.' },
        { status: 403 }
      );
    }
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
      v2_quality_verdict, v2_quality_gates, v2_suitability, v2_fund_risk_tier,
      v2_forward_aum, v2_forward_downside, v2_action, v2_action_label, v2_rationale, v2_fund_option, v2_rolling_3y_pct,
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

  // Does the viewer's PD role let them review? Drives the "Review it myself"
  // vs "Send to senior for review" choice on the edit page.
  let viewerCanReview = false;
  {
    const { data: emp } = await supabase
      .from('employees').select('id').ilike('email', employeeEmail.trim()).maybeSingle();
    if (emp?.id) {
      const { data: vr } = await supabase
        .from('pd_employee_roles')
        .select('role:pd_roles(can_review)')
        .eq('employee_id', emp.id as number)
        .eq('is_active', true)
        .maybeSingle();
      const rr = (vr as Record<string, unknown> | null)?.role;
      const ro = Array.isArray(rr) ? (rr[0] as Record<string, unknown>) : (rr as Record<string, unknown>);
      viewerCanReview = Boolean(ro?.can_review);
    }
  }

  // ── Format response ──────────────────────────────────────
  const verdictCounts: Record<Verdict, number> = {
    STAR: (run.verdict_star_count as number) || 0,
    KEEP: (run.verdict_keep_count as number) || 0,
    WATCH: (run.verdict_watch_count as number) || 0,
    SWAP: (run.verdict_swap_count as number) || 0,
    LIQUIDATE: (run.verdict_liquidate_count as number) || 0,
  };

  // Trustner Approved Buy-List (graceful: empty if the table isn't seeded yet)
  const buyList = await loadBuyList(supabase);

  // Pre-publish QA readiness — computed for review-stage runs so the UI can show
  // blockers/warnings before a reviewer clicks Publish.
  const prePublishQa = ['SUBMITTED', 'IN_REVIEW', 'ESCALATED', 'APPROVED'].includes(run.status as string)
    ? await runPrePublishQa(supabase, parseInt(id, 10))
    : null;

  // Stock-level look-through — true single-stock concentration across the family
  // (only the funds with disclosed holdings; graceful null otherwise).
  let stockLookThrough = null;
  try {
    const provider = createSupabaseHoldingsProvider();
    const fam = (holdings ?? [])
      .filter((h) => h.amfi_code && Number(h.current_value_inr) > 0)
      .map((h) => ({ amfiCode: h.amfi_code as string, valueInr: Number(h.current_value_inr), fundName: h.fund_name as string }));
    if (fam.length > 0) {
      const agg = await aggregateFamilyStockOverlap(fam, provider.getRichHoldings, { topN: 15, asOfDateByFund: provider.getAsOfDate });
      if (agg.hasData) stockLookThrough = agg;
    }
  } catch { /* holdings data unavailable → omit */ }

  return NextResponse.json({
    diagnostic: {
      id: run.id,
      documentId: run.document_id,
      prePublishQa,
      stockLookThrough,
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
      engineVersion: (run.engine_version as string) || '1.0.0',
      // True only if a REAL client profile was captured (vs the engine's generic
      // default). Computed from the raw intake so it's correct even for older runs
      // whose stored risk_profile_captured flag was set unconditionally.
      riskProfileCaptured:
        run.rp_primary_age != null || run.rp_stated_priority != null || run.rp_life_stage != null,
      riskProfile: {
        primaryAge: run.rp_primary_age as number | null,
        lifeStage: (run.rp_life_stage as string | null) ?? '',
        monthlyIncomeInr: Number(run.rp_monthly_income_inr) || 0,
        monthlyExpenseInr: Number(run.rp_monthly_expense_inr) || 0,
        livingDependsOnThis: (run.rp_living_depends_on_this as boolean | null) ?? true,
        netWorthBufferInr: Number(run.rp_net_worth_buffer_inr) || 0,
        longestHorizonYears: run.rp_longest_horizon_years as number | null,
        statedPriority: (run.rp_stated_priority as string | null) ?? '',
        pastDrawdownBehaviour: (run.rp_past_drawdown_behaviour as string | null) ?? '',
        targetCorpusInr: Number(run.rp_target_corpus_inr) || 0,
        yearsToGoal: run.rp_years_to_goal as number | null,
      },
      riskModel: run.rm_capacity_score != null ? {
        capacityScore: run.rm_capacity_score as number | null,
        toleranceScore: run.rm_tolerance_score as number | null,
        requiredReturnPct: run.rm_required_return_pct as number | null,
        bindingConstraint: run.rm_binding_constraint as string | null,
        targetEquityPct: run.rm_target_equity_pct as number | null,
        ageRuleEquityPct: run.rm_age_rule_equity_pct as number | null,
        capacityOverrodeAge: run.rm_capacity_overrode_age as boolean | null,
        withinEquityCeiling: run.rm_within_equity_ceiling as string | null,
        profileLabel: run.rm_profile_label as string | null,
        clientPosture: run.rm_client_posture as string | null,
        rationale: (run.rm_rationale as string[] | null) ?? [],
      } : null,
      consolidation: {
        groups: (run.v2_consolidation as unknown[] | null) ?? [],
        duplicateFundCount: (run.v2_consolidation_dupes as number | null) ?? 0,
        totalConsolidatableInr: Number(run.v2_consolidation_value_inr) || 0,
      },
      taxSummary: (run.v2_tax_summary as Record<string, unknown> | null) ?? null,
      trustnerBuyList: buyList.entries.map((e) => ({
        category: e.category, schemeName: e.schemeName, manager: e.manager, aumInrCr: e.aumInrCr,
        cagr5y: e.cagr5y, ter: e.ter, status: e.status, conviction: e.conviction, note: e.note,
      })),
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
        v2: {
          qualityVerdict: (h.v2_quality_verdict as string | null) ?? null,
          gates: (h.v2_quality_gates as { gate: string; status: string; detail: string }[] | null) ?? null,
          suitability: (h.v2_suitability as string | null) ?? null,
          fundRiskTier: (h.v2_fund_risk_tier as string | null) ?? null,
          forwardAum: (h.v2_forward_aum as string | null) ?? null,
          forwardDownside: (h.v2_forward_downside as string | null) ?? null,
          action: (h.v2_action as string | null) ?? null,
          actionLabel: (h.v2_action_label as string | null) ?? null,
          rationale: (h.v2_rationale as string | null) ?? null,
          rolling3yPct: (h.v2_rolling_3y_pct as number | null) ?? null,
        },
        buyList: (() => {
          const onList = matchBuyList(buyList, h.amfi_code as string | null, h.fund_name as string);
          let replacement: { schemeName: string; manager: string | null; cagr5y: number | null; note: string | null } | null = null;
          if (!onList && SELL_ACTIONS.has((h.v2_action as string) ?? '')) {
            const r = bestOpenReplacement(buyList, subCategoryKey((h.fund_name as string) || (h.category as string)), h.amfi_code as string | null);
            if (r) replacement = { schemeName: r.schemeName, manager: r.manager, cagr5y: r.cagr5y, note: r.note };
          }
          return { onList: !!onList, status: onList?.status ?? null, conviction: onList?.conviction ?? null, replacement };
        })(),
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
      viewerCanReview,
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

// ─────────────────────────────────────────────────────────────────
// DELETE — admin-only hard delete of a diagnostic + cascading rows
// ─────────────────────────────────────────────────────────────────
//
// Permission gate: admin-token holders ONLY (Sangeeta / Ram via
// ADMIN_USERS). Employees never get this affordance — the workflow
// model is REJECT (soft) for them.
//
// Cascade behaviour: Supabase relies on FK ON DELETE CASCADE on
// pd_diagnostic_holdings, pd_diagnostic_sips, pd_diagnostic_comments,
// pd_diagnostic_narratives, pd_share_links. Deleting the parent run
// row removes all children automatically. If any FK lacks CASCADE we
// fall back to per-table cleanup below to avoid orphan rows.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // PD admin — accepts admin JWT OR an employee session for Ram/Sangeeta/PD-admin
  // (they sign in via the employee portal, so an admin-token-only check 403'd them).
  const admin = await requirePdAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Delete is restricted to admin accounts. Reviewers should use Reject instead.' },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Capture metadata for the audit-log entry BEFORE we delete
  const { data: run } = await supabase
    .from('pd_diagnostic_runs')
    .select('id, family_name, status, num_holdings, num_active_sips, total_invested_inr, current_value_inr')
    .eq('id', numericId)
    .maybeSingle();

  if (!run) {
    return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
  }

  // SOFT-DELETE: flip the flag + record who/when/why. We deliberately do NOT
  // remove any rows — the run + its holdings/SIPs/comments/narratives/events stay
  // intact and fully recoverable by an admin (migration 042). This protects
  // against work being deleted knowingly or unknowingly.
  let reason: string | null = null;
  try { const b = await request.json(); reason = (b?.reason as string) ?? null; } catch { /* no body */ }

  const { data: actorEmp } = await supabase
    .from('employees').select('id').ilike('email', admin.email.trim()).maybeSingle();

  const { error: delErr } = await supabase
    .from('pd_diagnostic_runs')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by_employee_id: (actorEmp?.id as number) ?? null,
      deletion_reason: reason,
    })
    .eq('id', numericId);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  // Immutable audit entry (who / when / why) in the append-only workflow log —
  // survives because the run is never physically removed.
  await logPdEvent(supabase, {
    runId: numericId,
    actorEmail: admin.email,
    action: 'DELETE',
    fromStatus: run.status as string,
    toStatus: run.status as string,
    comment: reason,
    metadata: { soft_delete: true, family_name: run.family_name },
  });

  return NextResponse.json({
    success: true,
    deletedRunId: numericId,
    familyName: run.family_name,
    formerStatus: run.status,
    deletedBy: admin.email,
    deletedAt: new Date().toISOString(),
  });
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
