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
import type {
  RawHolding,
  RawSip,
  ClientSegment,
} from '@/lib/portfolio-diagnostic/types';
import { METHODOLOGY_VERSION } from '@/lib/portfolio-diagnostic/methodology';

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

interface DraftBody {
  family: FamilyForm;
  holdings: RawHolding[];
  sips: RawSip[];
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
          primary_contact_email: body.family.primaryContactEmail,
          primary_contact_mobile: body.family.primaryContactMobile,
          primary_contact_pan_encrypted: body.family.primaryContactPan, // TODO: encrypt before storage
          segment: body.family.segment,
          notes: body.family.notes,
        })
        .select('id')
        .single();

      if (famErr || !newFamily) {
        return NextResponse.json(
          { error: `Failed to create family: ${famErr?.message}` },
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
        total_invested_inr: totalInvested,
        current_value_inr: totalCurrent,
        unrealised_gain_inr: totalCurrent - totalInvested,
        monthly_sip_flow_inr: monthlySipFlow,
        annual_sip_flow_inr: monthlySipFlow * 12,
      })
      .select('id')
      .single();

    if (runErr || !run) {
      return NextResponse.json(
        { error: `Failed to create diagnostic run: ${runErr?.message}` },
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
          fund_name: h.fundName,
          folio_number: h.folioNumber,
          units: h.units,
          invested_inr: h.investedAmount,
          current_value_inr: h.currentValue,
          unrealised_gain_inr: h.currentValue - h.investedAmount,
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
    return NextResponse.json(
      { error: `Server error: ${(e as Error).message}` },
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
  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('email', email)
    .single();
  return (data?.id as number) ?? null;
}
