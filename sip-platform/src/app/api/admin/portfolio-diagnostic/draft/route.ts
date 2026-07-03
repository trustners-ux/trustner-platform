/**
 * Portfolio Diagnostic — Create Draft API
 *
 * Takes family + holdings + SIPs from the New Diagnostic UI, creates:
 *   - pd_client_families row (if new) OR re-uses existing
 *   - pd_family_entities rows (one per unique entityName)
 *   - pd_diagnostic_runs row (status=DRAFT)
 *   - pd_diagnostic_holdings rows
 *   - pd_diagnostic_sips rows
 *
 * Returns the new diagnosticRunId.
 *
 * Route: POST /api/admin/portfolio-diagnostic/draft
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';
import type {
  RawHolding,
  RawSip,
  ClientSegment,
} from '@/lib/portfolio-diagnostic/types';
import { METHODOLOGY_VERSION } from '@/lib/portfolio-diagnostic/methodology';
import { sanitizeSchemeName } from '@/lib/portfolio-diagnostic/cas-parser';

/**
 * Round an INR amount to whole rupees for storage.
 *
 * All `*_inr` columns in the schema are BIGINT (no decimal places). PDFs
 * give us paise-precision floats (e.g., the family current value
 * "64,87,260.47" parses to 6487260.47). When the float-sum has the
 * usual JS precision residue (6487260.470000001), passing it to a BIGINT
 * column fails with "invalid input syntax for type bigint".
 *
 * We round here so callers can pass float sums directly. Paise are
 * dropped — acceptable for portfolio diagnostics where every number is
 * already in lakhs/crores.
 */
function inrRupees(n: number | null | undefined): number {
  if (n === null || n === undefined || !isFinite(n)) return 0;
  return Math.round(n);
}

interface FamilyForm {
  familyId?: number;
  familyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactMobile: string;
  primaryContactPan?: string;
  segment: ClientSegment;
  notes?: string;
}

interface RiskProfileForm {
  primaryAge?: number;
  lifeStage?: string;
  monthlyIncomeInr?: number;
  monthlyExpenseInr?: number;
  livingDependsOnThis?: boolean;
  netWorthBufferInr?: number;
  longestHorizonYears?: number;
  statedPriority?: string;
  pastDrawdownBehaviour?: string;
  targetCorpusInr?: number;
  yearsToGoal?: number;
}

interface DraftBody {
  family: FamilyForm;
  holdings: RawHolding[];
  sips: RawSip[];
  riskProfile?: RiskProfileForm;
}

export async function POST(request: NextRequest) {
  const employeeId = await resolveEmployeeId();
  if (!employeeId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const body = (await request.json()) as DraftBody;

  if (!body.family.familyName || (body.holdings.length === 0 && body.sips.length === 0)) {
    return NextResponse.json(
      { error: 'Family name + at least one holding/SIP required' },
      { status: 400 }
    );
  }

  try {
    // ── Step 1: Resolve or create family ─────────────────────
    let familyId = body.family.familyId;

    if (!familyId) {
      const familyCode = `${body.family.familyName.replace(/\s/g, '').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { data: newFamily, error: famErr } = await supabase
        .from('pd_client_families')
        .insert({
          family_code: familyCode,
          family_name: body.family.familyName,
          primary_contact_name: body.family.primaryContactName,
          // Either email or mobile is required (not both). Pass null when blank
          // so the column stores NULL instead of an empty string.
          primary_contact_email: body.family.primaryContactEmail?.trim() || null,
          primary_contact_mobile: body.family.primaryContactMobile?.trim() || null,
          primary_contact_pan_encrypted: body.family.primaryContactPan, // TODO: encrypt before storage
          segment: body.family.segment,
          notes: body.family.notes,
        })
        .select('id')
        .single();

      if (famErr || !newFamily) {
        console.error(famErr?.message ?? 'Failed to create family');
        return NextResponse.json(
          { error: 'Failed to create family' },
          { status: 500 }
        );
      }
      familyId = newFamily.id;
    }

    // ── Step 2: Create / find entities (one per unique entityName) ─
    const uniqueEntityNames = new Set([
      ...body.holdings.map((h) => h.entityName),
      ...body.sips.map((s) => s.entityName),
    ]);

    const entityIdByName = new Map<string, number>();

    for (const entityName of uniqueEntityNames) {
      if (!entityName.trim()) continue;

      // Try to find existing entity for this family
      const { data: existing } = await supabase
        .from('pd_family_entities')
        .select('id')
        .eq('family_id', familyId)
        .eq('entity_name', entityName)
        .maybeSingle();

      if (existing) {
        entityIdByName.set(entityName, existing.id as number);
        continue;
      }

      // Find entity_type from one of the holdings
      const entityType =
        body.holdings.find((h) => h.entityName === entityName)?.entityType ?? 'Individual';

      const { data: newEntity, error: entErr } = await supabase
        .from('pd_family_entities')
        .insert({
          family_id: familyId,
          entity_name: entityName,
          entity_type: entityType,
        })
        .select('id')
        .single();

      if (entErr || !newEntity) continue;
      entityIdByName.set(entityName, newEntity.id as number);
    }

    // ── Step 3: Compute snapshot totals ──────────────────────
    const totalInvested = body.holdings.reduce((s, h) => s + h.investedAmount, 0);
    const totalCurrent = body.holdings.reduce((s, h) => s + h.currentValue, 0);
    const activeSips = body.sips.filter((s) => s.status === 'Active');
    const monthlySipFlow = activeSips.reduce((s, sip) => s + sip.monthlyAmountInr, 0);
    const uniqueFunds = new Set(body.holdings.map((h) => h.fundName));
    const uniqueAmcs = new Set(body.holdings.map((h) => h.amcName ?? '').filter(Boolean));

    // ── Step 4: Generate document ID ─────────────────────────
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const familyShort = body.family.familyName.replace(/\s/g, '').slice(0, 3).toUpperCase();
    const documentId = `${familyShort}-PDR-${dateStr}-${Math.floor(Math.random() * 900 + 100)}`;

    // ── Step 5: Create diagnostic run ────────────────────────
    const { data: run, error: runErr } = await supabase
      .from('pd_diagnostic_runs')
      .insert({
        document_id: documentId,
        family_id: familyId,
        methodology_version: METHODOLOGY_VERSION,
        status: 'DRAFT',
        uploaded_by_employee_id: employeeId,
        family_name: body.family.familyName,
        num_entities: entityIdByName.size,
        num_holdings: body.holdings.length,
        num_active_sips: activeSips.length,
        num_unique_funds: uniqueFunds.size,
        num_amcs: uniqueAmcs.size,
        total_invested_inr: inrRupees(totalInvested),
        current_value_inr: inrRupees(totalCurrent),
        unrealised_gain_inr: inrRupees(totalCurrent - totalInvested),
        monthly_sip_flow_inr: inrRupees(monthlySipFlow),
        annual_sip_flow_inr: inrRupees(monthlySipFlow * 12),
        // ── v2 risk-intake (drives the Verdict Engine) ──
        ...(body.riskProfile ? {
          risk_profile_captured: true,
          rp_primary_age: body.riskProfile.primaryAge ?? null,
          rp_life_stage: body.riskProfile.lifeStage ?? null,
          rp_monthly_income_inr: body.riskProfile.monthlyIncomeInr != null ? inrRupees(body.riskProfile.monthlyIncomeInr) : null,
          rp_monthly_expense_inr: body.riskProfile.monthlyExpenseInr != null ? inrRupees(body.riskProfile.monthlyExpenseInr) : null,
          rp_living_depends_on_this: body.riskProfile.livingDependsOnThis ?? null,
          rp_net_worth_buffer_inr: body.riskProfile.netWorthBufferInr != null ? inrRupees(body.riskProfile.netWorthBufferInr) : null,
          rp_longest_horizon_years: body.riskProfile.longestHorizonYears ?? null,
          rp_stated_priority: body.riskProfile.statedPriority ?? null,
          rp_past_drawdown_behaviour: body.riskProfile.pastDrawdownBehaviour ?? null,
          rp_target_corpus_inr: body.riskProfile.targetCorpusInr != null && body.riskProfile.targetCorpusInr > 0 ? inrRupees(body.riskProfile.targetCorpusInr) : null,
          rp_years_to_goal: body.riskProfile.yearsToGoal != null && body.riskProfile.yearsToGoal > 0 ? body.riskProfile.yearsToGoal : null,
        } : {}),
      })
      .select('id')
      .single();

    if (runErr || !run) {
      console.error(runErr?.message ?? 'Failed to create diagnostic run');
      return NextResponse.json(
        { error: 'Failed to create diagnostic run' },
        { status: 500 }
      );
    }

    const diagnosticRunId = run.id as number;

    // ── Step 6: Insert holdings ──────────────────────────────
    if (body.holdings.length > 0) {
      const holdingRows = body.holdings
        .filter((h) => entityIdByName.has(h.entityName))
        .map((h) => ({
          diagnostic_run_id: diagnosticRunId,
          entity_id: entityIdByName.get(h.entityName)!,
          fund_name: sanitizeSchemeName(h.fundName),
          folio_number: h.folioNumber,
          units: h.units,
          invested_inr: inrRupees(h.investedAmount),
          current_value_inr: inrRupees(h.currentValue),
          unrealised_gain_inr: inrRupees(h.currentValue - h.investedAmount),
          first_investment_date: h.firstInvestmentDate,
          verdict: 'WATCH', // placeholder — scoring engine fills this in later
          verdict_rationale: 'Pending analysis — fund data refresh required.',
        }));

      if (holdingRows.length > 0) {
        await supabase.from('pd_diagnostic_holdings').insert(holdingRows);
      }
    }

    // ── Step 7: Insert SIPs ──────────────────────────────────
    if (body.sips.length > 0) {
      const sipRows = body.sips
        .filter((s) => entityIdByName.has(s.entityName))
        .map((s) => ({
          diagnostic_run_id: diagnosticRunId,
          entity_id: entityIdByName.get(s.entityName)!,
          fund_name: s.fundName,
          folio_number: s.folioNumber,
          monthly_amount_inr: Math.round(s.monthlyAmountInr),
          actual_amount_inr: Math.round(s.actualAmountInr),
          frequency: s.frequency,
          sip_day_of_month: s.sipDayOfMonth,
          start_date: s.startDate,
          end_date: s.endDate,
          status: s.status,
          has_step_up: s.hasStepUp ?? false,
          step_up_pct: s.stepUpPct,
          step_up_frequency: s.stepUpFrequency,
          installments_completed: s.installmentsCompleted,
          total_installments: s.totalInstallments,
          next_installment_date: s.nextInstallmentDate,
          bank_mandate_status: s.bankMandateStatus,
        }));

      if (sipRows.length > 0) {
        await supabase.from('pd_diagnostic_sips').insert(sipRows);
      }
    }

    // ── Step 8: Log the create-draft event ───────────────────
    await supabase.from('pd_workflow_events').insert({
      diagnostic_run_id: diagnosticRunId,
      actor_employee_id: employeeId,
      actor_role: 'junior_analyst', // TODO: look up actual role
      action: 'CREATE_DRAFT',
      to_status: 'DRAFT',
    });

    return NextResponse.json({
      success: true,
      diagnosticRunId,
      documentId,
      familyId,
      numHoldings: body.holdings.length,
      numSips: body.sips.length,
    });
  } catch (e) {
    console.error((e as Error).message);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

async function resolveEmployeeId(): Promise<number | null> {
  // The JWT's `employeeId` field comes from the hardcoded directory
  // (/lib/employee/employee-directory.ts) which uses different IDs
  // than the database `employees` table. Always resolve via email
  // — that's the canonical bridge between the two ID systems.
  const cookieStore = await cookies();
  let email: string | undefined;

  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload?.email) email = payload.email;
  }
  if (!email) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const payload = await verifyEmployeeToken(empToken);
      if (payload?.email) email = payload.email;
    }
  }
  if (!email) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // Case-insensitive lookup — JWT email casing can vary from the DB.
  const { data } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();
  if (data?.id) return data.id as number;

  // Approver fallback — Ram + Sangeeta should never be locked out.
  // If their employees row isn't found by direct email match, try
  // resolving by their canonical APPROVER_EMAILS, which always exist.
  const emailLc = email.trim().toLowerCase();
  if (APPROVER_EMAILS.includes(emailLc)) {
    const { data: approverRow } = await supabase
      .from('employees')
      .select('id')
      .ilike('email', emailLc)
      .maybeSingle();
    if (approverRow?.id) return approverRow.id as number;
    // Final fallback: any employees row matching the lowercased approver email
    // (covers data-entry case mismatches between JWT and DB).
  }

  return null;
}
