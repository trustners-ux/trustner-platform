/**
 * POST /api/employee/hr/exits/:id/calculate
 *
 * Runs the F&F engine against:
 *   - hr_employees (snapshot + salary structure)
 *   - last 3 hr_salary_slips for the employee (most-recent first)
 *   - hr_leave_balances for the employee
 *   - pending recoveries (loan, asset, advance) — sourced from
 *     hr_separation_checklist.recovery_amount + any open hr_loans rows if the
 *     table exists.
 *   - pending reimbursements — best-effort from hr_reimbursements if present.
 *
 * Upserts an hr_fnf row (status='computed') and sets hr_separation.fnf_id.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions, type HrPermissions } from '@/lib/hr/permissions';
import {
  computeFnF,
  type FnFInput,
  type SalarySlipSnapshot,
  type LeaveBalanceSnapshot,
  type PendingRecovery,
  type PendingReimbursement,
  type SeparationType,
  type EmploymentType,
} from '@/lib/hr/fnf-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

function canManageSeparation(perms: HrPermissions): boolean {
  const anyPerm = perms as unknown as Record<string, boolean>;
  if (anyPerm.can_manage_separation === true) return true;
  return perms.can_access_payroll === true;
}

async function getAdminActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return { error: 'Unauthenticated', status: 401 as const, actor: null };
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return { error: 'Invalid session', status: 401 as const, actor: null };
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!canManageSeparation(perms)) {
    return { error: 'Need can_manage_separation permission', status: 403 as const, actor };
  }
  return { error: null as null, status: 200 as const, actor };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const g = await getAdminActor(req);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  // 1. Load separation + employee
  const { data: sep, error: sepErr } = await supabase
    .from('hr_separation')
    .select('*')
    .eq('id', sepId)
    .single();
  if (sepErr || !sep) return NextResponse.json({ error: 'Separation not found' }, { status: 404 });

  const { data: emp, error: empErr } = await supabase
    .from('hr_employees')
    .select(`
      id, employee_code, full_name, entity, employment_type, date_of_joining,
      notice_period_days_contractual,
      basic_monthly, hra_monthly, special_allowance_monthly,
      variable_pay_monthly, pf_monthly
    `)
    .eq('id', sep.employee_id)
    .single();
  if (empErr || !emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const lwd = sep.lwd ?? sep.approved_lwd ?? sep.requested_lwd;
  if (!lwd) {
    return NextResponse.json(
      { error: 'lwd (or approved_lwd / requested_lwd) must be set before computing F&F.' },
      { status: 422 },
    );
  }

  // 2. Last 3 salary slips for this employee
  const { data: slipRows } = await supabase
    .from('hr_salary_slips')
    .select(`
      basic, hra, special_allowance, variable_pay, other_earnings, gross,
      pf_employee, esi_employee, professional_tax, tds,
      salary_run:hr_salary_runs!hr_salary_slips_salary_run_id_fkey ( pay_month )
    `)
    .eq('employee_id', sep.employee_id)
    .order('id', { ascending: false })
    .limit(3);

  const last_3_slips: SalarySlipSnapshot[] = (slipRows ?? []).map(r => {
    const sr = (r as { salary_run?: { pay_month?: string } | Array<{ pay_month?: string }> }).salary_run;
    const pay_month = Array.isArray(sr) ? (sr[0]?.pay_month ?? '') : (sr?.pay_month ?? '');
    return {
      pay_month,
      basic: Number(r.basic ?? 0),
      hra: Number(r.hra ?? 0),
      special_allowance: Number(r.special_allowance ?? 0),
      variable_pay: Number(r.variable_pay ?? 0),
      other_earnings: Number(r.other_earnings ?? 0),
      gross: Number(r.gross ?? 0),
      pf_employee: Number(r.pf_employee ?? 0),
      esi_employee: Number(r.esi_employee ?? 0),
      professional_tax: Number(r.professional_tax ?? 0),
      tds: Number(r.tds ?? 0),
    };
  });

  // 3. Leave balances
  const { data: lbRows } = await supabase
    .from('hr_leave_balances')
    .select('leave_code, is_encashable, available_days, max_carry_forward')
    .eq('employee_id', sep.employee_id);
  const leave_balances: LeaveBalanceSnapshot[] = (lbRows ?? []).map(r => ({
    leave_code: String(r.leave_code ?? ''),
    is_encashable: !!r.is_encashable,
    available_days: Number(r.available_days ?? 0),
    max_carry_forward: Number(r.max_carry_forward ?? 30),
  }));

  // 4. Pending recoveries — best-effort
  const pending_recoveries: PendingRecovery[] = [];
  // Checklist asset recoveries
  const { data: chk } = await supabase
    .from('hr_separation_checklist')
    .select('category, recovery_amount, item_label')
    .eq('separation_id', sepId)
    .gt('recovery_amount', 0);
  for (const r of chk ?? []) {
    pending_recoveries.push({
      kind: r.category === 'assets' || r.category === 'it_clearance' ? 'asset' : 'other',
      amount: Number(r.recovery_amount ?? 0),
      label: r.item_label as string,
    });
  }
  // Loans (best-effort — table may not exist yet)
  try {
    const { data: loans } = await supabase
      .from('hr_loans')
      .select('outstanding_amount, label')
      .eq('employee_id', sep.employee_id)
      .gt('outstanding_amount', 0);
    for (const l of loans ?? []) {
      pending_recoveries.push({
        kind: 'loan',
        amount: Number(l.outstanding_amount ?? 0),
        label: (l as { label?: string }).label,
      });
    }
  } catch { /* table doesn't exist — fine */ }

  // 5. Pending reimbursements — best-effort
  const pending_reimbursements: PendingReimbursement[] = [];
  try {
    const { data: reimb } = await supabase
      .from('hr_reimbursements')
      .select('amount, category')
      .eq('employee_id', sep.employee_id)
      .in('status', ['pending', 'approved']);
    for (const r of reimb ?? []) {
      pending_reimbursements.push({
        amount: Number(r.amount ?? 0),
        category: (r as { category?: string }).category,
      });
    }
  } catch { /* table doesn't exist — fine */ }

  // 6. Build engine input
  const input: FnFInput = {
    employee: {
      id: emp.id,
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      entity: (emp.entity ?? 'TAS') as 'TAS' | 'TIB',
      employment_type: (emp.employment_type ?? 'permanent') as EmploymentType,
      date_of_joining: emp.date_of_joining,
      notice_period_days_contractual:
        Number(emp.notice_period_days_contractual ?? sep.notice_period_days_contractual ?? 60),
    },
    separation: {
      id: sep.id,
      case_code: sep.case_code,
      separation_type: sep.separation_type as SeparationType,
      status: sep.status,
      lwd,
      notice_period_days_contractual: Number(sep.notice_period_days_contractual ?? 60),
      notice_period_days_served: Number(sep.notice_period_days_served ?? 0),
      notice_period_days_waived: Number(sep.notice_period_days_waived ?? 0),
      notice_period_days_shortfall: Number(sep.notice_period_days_shortfall ?? 0),
      bonus_clause_present: !!sep.bonus_clause_present,
      bonus_amount: Number(sep.bonus_amount ?? 0),
    },
    last_3_slips,
    leave_balances,
    salary_structure: {
      basic_monthly: Number(emp.basic_monthly ?? 0),
      hra_monthly: Number(emp.hra_monthly ?? 0),
      special_allowance_monthly: Number(emp.special_allowance_monthly ?? 0),
      variable_pay_monthly: Number(emp.variable_pay_monthly ?? 0),
      pf_monthly: Number(emp.pf_monthly ?? 0),
    },
    pending_recoveries,
    pending_reimbursements,
  };

  // 7. Compute
  const out = computeFnF(input);

  // 8. Upsert hr_fnf — find existing row first
  const { data: existingFnf } = await supabase
    .from('hr_fnf').select('id').eq('separation_id', sepId).maybeSingle();

  const fnfRow = {
    separation_id: sepId,
    employee_id: out.employee_id,
    doj: out.doj,
    lwd: out.lwd,
    fnf_month: out.fnf_month,
    paid_days: out.paid_days,
    lop_days: out.lop_days,
    final_basic: out.final_basic,
    final_hra: out.final_hra,
    final_special: out.final_special,
    final_variable: out.final_variable,
    bonus_prorate: out.bonus_prorate,
    el_balance_days: out.el_balance_days,
    el_encash_amount: out.el_encash_amount,
    gratuity_applicable: out.gratuity_applicable,
    gratuity_years: out.gratuity_years,
    gratuity_amount: out.gratuity_amount,
    gratuity_taxable_excess: out.gratuity_taxable_excess,
    reimbursement_pending: out.reimbursement_pending,
    pf_deduction: out.pf_deduction,
    esi_deduction: out.esi_deduction,
    pt_deduction: out.pt_deduction,
    tds_deduction: out.tds_deduction,
    loan_recovery: out.loan_recovery,
    notice_shortfall_recovery: out.notice_shortfall_recovery,
    asset_recovery: out.asset_recovery,
    other_recovery: out.other_recovery,
    gross_payable: out.gross_payable,
    net_payable: out.net_payable,
    status: 'computed',
    computed_at: new Date().toISOString(),
    computed_by: g.actor?.email ?? 'hr_admin',
    input_snapshot: input as unknown as Record<string, unknown>,
  };

  let fnfId: number;
  if (existingFnf) {
    const { data: updated, error } = await supabase
      .from('hr_fnf').update(fnfRow).eq('id', existingFnf.id).select('id').single();
    if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
    fnfId = updated.id as number;
  } else {
    const { data: inserted, error } = await supabase
      .from('hr_fnf').insert(fnfRow).select('id').single();
    if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
    fnfId = inserted.id as number;
  }

  // 9. Link back to separation
  if (sep.fnf_id !== fnfId) {
    await supabase.from('hr_separation').update({ fnf_id: fnfId }).eq('id', sepId);
  }

  return NextResponse.json({ fnf_id: fnfId, snapshot: out });
}
