/**
 * GET /api/employee/hr/payroll/runs/:id/slips      — list slips in the run
 * GET /api/employee/hr/payroll/runs/:id/slips?bank=1 — generate bank advice CSV
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const bankMode = url.searchParams.get('bank') === '1';

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: slips } = await supabase
    .from('hr_salary_slips')
    .select('id, employee_id, gross, net_pay, total_deductions, paid_days, lop_days, status, hr_employees(employee_code, full_name, ifsc, bank_branch, email)')
    .eq('salary_run_id', id)
    .order('id');

  if (bankMode) {
    const lines = ['Employee Code,Name,Account/IFSC,Bank Branch,Net Pay (INR)'];
    for (const s of slips || []) {
      const emp = (s as unknown as { hr_employees?: Record<string, unknown> }).hr_employees as Record<string, string> | undefined || {};
      lines.push([
        emp.employee_code || '',
        (emp.full_name || '').replace(/,/g, ' '),
        emp.ifsc || '',
        (emp.bank_branch || '').replace(/,/g, ' '),
        Number(s.net_pay).toFixed(2),
      ].join(','));
    }
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bank-advice-run-${id}.csv"`,
      },
    });
  }

  return NextResponse.json({ slips: slips ?? [] });
}
