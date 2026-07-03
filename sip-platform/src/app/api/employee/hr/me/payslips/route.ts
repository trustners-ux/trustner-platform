/**
 * GET /api/employee/hr/me/payslips
 * Returns all salary slips for the signed-in actor (no permission needed —
 * employees can always see their own slips, gated by can_view_payslips
 * which defaults to true).
 *
 * Used by /employee/hr/me/payslips listing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_view_payslips) {
    return NextResponse.json({ error: 'Payslip viewing disabled by HR' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: profile } = await supabase
    .from('hr_employees').select('id').eq('email', actor.email.toLowerCase()).maybeSingle();
  if (!profile) return NextResponse.json({ slips: [] });

  const { data, error } = await supabase
    .from('hr_salary_slips')
    .select(`
      id, salary_run_id, gross, net_pay, total_deductions, paid_days, lop_days, status,
      basic, hra, special_allowance, variable_pay,
      pf_employee, esi_employee, professional_tax, tds,
      sent_at, viewed_at,
      hr_salary_runs(pay_month, entity, status)
    `)
    .eq('employee_id', profile.id)
    .order('id', { ascending: false });

  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ slips: data ?? [] });
}
