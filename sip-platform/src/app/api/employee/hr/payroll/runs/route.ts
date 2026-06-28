/**
 * Payroll runs API.
 *
 * GET   /api/employee/hr/payroll/runs
 * POST  /api/employee/hr/payroll/runs     — start a draft run for a month/entity
 * PATCH /api/employee/hr/payroll/runs     — calculate / approve / disburse
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { computePayroll } from '@/lib/hr/payroll-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return perms.can_access_payroll ? actor : null;
}

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
  const { data, error } = await supabase
    .from('hr_salary_runs')
    .select('id, fy, pay_month, entity, status, total_employees, total_gross, total_net, total_pf, total_tds, approved_by, approved_at, disbursed_at, created_at')
    .order('pay_month', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { fy, pay_month, entity } = body;
  if (!fy || !pay_month || !entity) {
    return NextResponse.json({ error: 'fy, pay_month, entity required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('hr_salary_runs')
    .insert({ fy, pay_month, entity, status: 'draft', created_by: actor.email })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ run: data });
}

export async function PATCH(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { id, action } = body as { id?: number; action?: 'calculate' | 'approve' | 'disburse' };
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const { data: run } = await supabase.from('hr_salary_runs').select('*').eq('id', id).single();
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

  if (action === 'calculate') {
    // Pull active employees of entity
    const { data: emps } = await supabase
      .from('hr_employees')
      .select('id, full_name, employee_code, state, basic_monthly, hra_monthly, special_allowance_monthly, pf_monthly, variable_pay_monthly')
      .eq('entity', run.entity)
      .in('status', ['active', 'on_notice']);

    let totalGross = 0, totalNet = 0, totalPf = 0, totalTds = 0, totalEsi = 0, totalPt = 0, totalDed = 0;
    for (const e of emps ?? []) {
      const verdict = computePayroll({
        basic_monthly: Number(e.basic_monthly || 0),
        hra_monthly: Number(e.hra_monthly || 0),
        special_allowance_monthly: Number(e.special_allowance_monthly || 0),
        pf_monthly: Number(e.pf_monthly || 0),
        variable_pay_monthly: Number(e.variable_pay_monthly || 0),
        state: e.state || 'Assam',
        regime: 'new',
      });
      await supabase.from('hr_salary_slips').upsert({
        salary_run_id: id,
        employee_id: e.id,
        basic: verdict.basic, hra: verdict.hra, special_allowance: verdict.special_allowance,
        variable_pay: verdict.variable_pay, other_earnings: 0, gross: verdict.gross,
        pf_employee: verdict.pf_employee, esi_employee: verdict.esi_employee,
        professional_tax: verdict.professional_tax, tds: verdict.tds,
        loan_recovery: 0, other_deductions: 0,
        total_deductions: verdict.total_deductions, net_pay: verdict.net_pay,
        paid_days: verdict.paid_days, lop_days: verdict.lop_days,
        status: 'generated',
      }, { onConflict: 'salary_run_id,employee_id' });
      totalGross += verdict.gross; totalNet += verdict.net_pay;
      totalPf += verdict.pf_employee; totalTds += verdict.tds;
      totalEsi += verdict.esi_employee; totalPt += verdict.professional_tax;
      totalDed += verdict.total_deductions;
    }
    const { data, error } = await supabase
      .from('hr_salary_runs')
      .update({
        status: 'calculated',
        total_employees: (emps?.length || 0),
        total_gross: totalGross, total_net: totalNet,
        total_pf: totalPf, total_tds: totalTds,
        total_esi: totalEsi, total_pt: totalPt,
        total_deductions: totalDed,
      })
      .eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ run: data });
  }

  if (action === 'approve') {
    const { data, error } = await supabase
      .from('hr_salary_runs')
      .update({ status: 'approved', approved_by: actor.email, approved_at: new Date().toISOString() })
      .eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ run: data });
  }

  if (action === 'disburse') {
    const { data, error } = await supabase
      .from('hr_salary_runs')
      .update({ status: 'disbursed', disbursed_at: new Date().toISOString() })
      .eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ run: data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
