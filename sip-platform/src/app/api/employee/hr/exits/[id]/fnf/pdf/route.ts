/**
 * GET /api/employee/hr/exits/:id/fnf/pdf
 *
 * Streams the F&F settlement statement as application/pdf.
 * HR-admin OR employee-self (the subject of the F&F).
 *
 * Reconstructs an FnFOutput from the hr_fnf row + computes the breakup
 * sub-object the PDF generator expects.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions, type HrPermissions } from '@/lib/hr/permissions';
import { renderFnFStatement } from '@/lib/hr/fnf-pdf';
import type { FnFOutput, FnFInput } from '@/lib/hr/fnf-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

function canManageSeparation(perms: HrPermissions): boolean {
  const anyPerm = perms as unknown as Record<string, boolean>;
  if (anyPerm.can_manage_separation === true) return true;
  return perms.can_access_payroll === true;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: sep } = await supabase
    .from('hr_separation')
    .select(`
      id, case_code, separation_type,
      employee:hr_employees!hr_separation_employee_id_fkey (
        id, employee_code, full_name, entity, designation, department, email,
        date_of_joining, pan, bank_branch, bank_ifsc
      )
    `)
    .eq('id', sepId)
    .single();
  if (!sep) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const emp = (Array.isArray(sep.employee) ? sep.employee[0] : sep.employee) as {
    id: number; employee_code: string; full_name: string; entity: 'TAS' | 'TIB';
    designation?: string | null; department?: string | null; email?: string | null;
    date_of_joining: string; pan?: string | null; bank_branch?: string | null;
    bank_ifsc?: string | null;
  } | null;

  if (!emp) return NextResponse.json({ error: 'Employee missing on separation' }, { status: 500 });

  const isAdmin = canManageSeparation(perms);
  const isSelf = emp.email && actor.email.toLowerCase() === emp.email.toLowerCase();
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: fnf, error: fErr } = await supabase
    .from('hr_fnf').select('*').eq('separation_id', sepId).maybeSingle();
  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });
  if (!fnf) return NextResponse.json({ error: 'F&F not yet computed' }, { status: 404 });

  // Compose FnFOutput from the row
  const out: FnFOutput = {
    separation_id: fnf.separation_id,
    employee_id: fnf.employee_id,
    doj: fnf.doj,
    lwd: fnf.lwd,
    fnf_month: fnf.fnf_month,
    paid_days: Number(fnf.paid_days ?? 0),
    lop_days: Number(fnf.lop_days ?? 0),
    final_basic: Number(fnf.final_basic ?? 0),
    final_hra: Number(fnf.final_hra ?? 0),
    final_special: Number(fnf.final_special ?? 0),
    final_variable: Number(fnf.final_variable ?? 0),
    bonus_prorate: Number(fnf.bonus_prorate ?? 0),
    el_balance_days: Number(fnf.el_balance_days ?? 0),
    el_encash_amount: Number(fnf.el_encash_amount ?? 0),
    gratuity_applicable: !!fnf.gratuity_applicable,
    gratuity_years: Number(fnf.gratuity_years ?? 0),
    gratuity_amount: Number(fnf.gratuity_amount ?? 0),
    gratuity_taxable_excess: Number(fnf.gratuity_taxable_excess ?? 0),
    reimbursement_pending: Number(fnf.reimbursement_pending ?? 0),
    pf_deduction: Number(fnf.pf_deduction ?? 0),
    esi_deduction: Number(fnf.esi_deduction ?? 0),
    pt_deduction: Number(fnf.pt_deduction ?? 0),
    tds_deduction: Number(fnf.tds_deduction ?? 0),
    loan_recovery: Number(fnf.loan_recovery ?? 0),
    notice_shortfall_recovery: Number(fnf.notice_shortfall_recovery ?? 0),
    asset_recovery: Number(fnf.asset_recovery ?? 0),
    other_recovery: Number(fnf.other_recovery ?? 0),
    gross_payable: Number(fnf.gross_payable ?? 0),
    net_payable: Number(fnf.net_payable ?? 0),
    payable_by_date: fnf.payable_by_date ?? '',
    input_snapshot: (fnf.input_snapshot ?? {}) as FnFInput,
    breakup: {
      earnings: {
        final_basic: Number(fnf.final_basic ?? 0),
        final_hra: Number(fnf.final_hra ?? 0),
        final_special: Number(fnf.final_special ?? 0),
        final_variable: Number(fnf.final_variable ?? 0),
        bonus_prorate: Number(fnf.bonus_prorate ?? 0),
        el_encash_amount: Number(fnf.el_encash_amount ?? 0),
        el_balance_days: Number(fnf.el_balance_days ?? 0),
        gratuity_amount: Number(fnf.gratuity_amount ?? 0),
        gratuity_taxable_excess: Number(fnf.gratuity_taxable_excess ?? 0),
        gratuity_applicable: !!fnf.gratuity_applicable,
        gratuity_years: Number(fnf.gratuity_years ?? 0),
        reimbursement_pending: Number(fnf.reimbursement_pending ?? 0),
        gross_payable: Number(fnf.gross_payable ?? 0),
      },
      deductions: {
        pf_deduction: Number(fnf.pf_deduction ?? 0),
        esi_deduction: Number(fnf.esi_deduction ?? 0),
        pt_deduction: Number(fnf.pt_deduction ?? 0),
        tds_deduction: Number(fnf.tds_deduction ?? 0),
        loan_recovery: Number(fnf.loan_recovery ?? 0),
        notice_shortfall_recovery: Number(fnf.notice_shortfall_recovery ?? 0),
        asset_recovery: Number(fnf.asset_recovery ?? 0),
        other_recovery: Number(fnf.other_recovery ?? 0),
        total_deductions:
          Number(fnf.pf_deduction ?? 0) + Number(fnf.esi_deduction ?? 0) +
          Number(fnf.pt_deduction ?? 0) + Number(fnf.tds_deduction ?? 0) +
          Number(fnf.loan_recovery ?? 0) + Number(fnf.notice_shortfall_recovery ?? 0) +
          Number(fnf.asset_recovery ?? 0) + Number(fnf.other_recovery ?? 0),
      },
    },
  };

  const buf = await renderFnFStatement({
    fnf: out,
    entity: (emp.entity ?? 'TAS') as 'TAS' | 'TIB',
    case_code: sep.case_code,
    separation_type: sep.separation_type,
    employee_code: emp.employee_code,
    full_name: emp.full_name,
    designation: emp.designation,
    department: emp.department,
    date_of_joining: emp.date_of_joining,
    pan: emp.pan,
    bank_branch: emp.bank_branch,
    ifsc: emp.bank_ifsc,
  });

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="FnF_${sep.case_code}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
