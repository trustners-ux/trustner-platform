/**
 * GET /api/employee/hr/payroll/runs/:id/slips/:slipId         — view JSON
 * GET /api/employee/hr/payroll/runs/:id/slips/:slipId?pdf=1   — stream PDF
 *
 * Generates the salary slip PDF on demand (server-side, no Vercel Blob hop)
 * so payroll admins + the employee themselves can pull a slip with one HTTP
 * call. Marks status='sent' the first time the slip is downloaded.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { renderSalarySlip, type SlipInput } from '@/lib/hr/salary-slip-pdf';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

interface SlipRow {
  id: number;
  salary_run_id: number;
  employee_id: number;
  basic: number; hra: number; special_allowance: number;
  variable_pay: number; other_earnings: number; gross: number;
  pf_employee: number; esi_employee: number;
  professional_tax: number; tds: number;
  loan_recovery: number; other_deductions: number;
  total_deductions: number; net_pay: number;
  paid_days: number | null; lop_days: number | null;
  status: string;
  hr_salary_runs?: { pay_month: string; entity: 'TAS' | 'TIB' } | null;
  hr_employees?: {
    employee_code: string; full_name: string;
    designation: string | null; department: string | null;
    pan: string | null; bank_branch: string | null; ifsc: string | null;
    date_of_joining: string | null; office_code: string | null;
    email: string | null;
  } | null;
}

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; slipId: string }> }) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { slipId } = await ctx.params;

  const { data: slip, error } = await supabase
    .from('hr_salary_slips')
    .select(`
      id, salary_run_id, employee_id,
      basic, hra, special_allowance, variable_pay, other_earnings, gross,
      pf_employee, esi_employee, professional_tax, tds,
      loan_recovery, other_deductions, total_deductions, net_pay,
      paid_days, lop_days, status,
      hr_salary_runs(pay_month, entity),
      hr_employees(employee_code, full_name, designation, department, pan, bank_branch, ifsc, date_of_joining, office_code, email)
    `)
    .eq('id', slipId)
    .single<SlipRow>();
  if (error || !slip) return NextResponse.json({ error: 'Slip not found' }, { status: 404 });

  // Access control: payroll admin OR the slip's owner
  const perms = await getEffectivePermissions(actor.email, actor.role);
  const isPayrollAdmin = perms.can_access_payroll;
  const isOwner = slip.hr_employees?.email?.toLowerCase() === actor.email.toLowerCase();
  if (!isPayrollAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const wantPdf = url.searchParams.get('pdf') === '1';

  if (!wantPdf) return NextResponse.json({ slip });

  // Resolve office city for the slip header
  let officeCity: string | null = null;
  if (slip.hr_employees?.office_code) {
    const { data: office } = await supabase
      .from('hr_offices')
      .select('city')
      .eq('code', slip.hr_employees.office_code)
      .maybeSingle();
    officeCity = office?.city ?? null;
  }

  const input: SlipInput = {
    entity: slip.hr_salary_runs?.entity ?? 'TIB',
    employee_code: slip.hr_employees?.employee_code ?? '',
    full_name: slip.hr_employees?.full_name ?? '',
    designation: slip.hr_employees?.designation ?? null,
    department: slip.hr_employees?.department ?? null,
    office_city: officeCity,
    date_of_joining: slip.hr_employees?.date_of_joining ?? null,
    pan: slip.hr_employees?.pan ?? null,
    bank_branch: slip.hr_employees?.bank_branch ?? null,
    ifsc: slip.hr_employees?.ifsc ?? null,
    pay_month: slip.hr_salary_runs?.pay_month ?? '',
    paid_days: slip.paid_days,
    lop_days: slip.lop_days,
    basic: Number(slip.basic),
    hra: Number(slip.hra),
    special_allowance: Number(slip.special_allowance),
    variable_pay: Number(slip.variable_pay),
    other_earnings: Number(slip.other_earnings),
    gross: Number(slip.gross),
    pf_employee: Number(slip.pf_employee),
    esi_employee: Number(slip.esi_employee),
    professional_tax: Number(slip.professional_tax),
    tds: Number(slip.tds),
    loan_recovery: Number(slip.loan_recovery),
    other_deductions: Number(slip.other_deductions),
    total_deductions: Number(slip.total_deductions),
    net_pay: Number(slip.net_pay),
  };

  const pdfBuffer = await renderSalarySlip(input);

  // Mark slip as 'sent' + record viewed_at the first time it's downloaded.
  if (slip.status !== 'sent') {
    await supabase
      .from('hr_salary_slips')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', slip.id);
  } else if (isOwner) {
    await supabase
      .from('hr_salary_slips')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', slip.id);
  }

  const filename = `Salary-Slip-${input.employee_code}-${input.pay_month}.pdf`;
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
