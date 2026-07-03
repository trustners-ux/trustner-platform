/**
 * Attendance API.
 *
 * GET   /api/employee/hr/attendance?month=YYYY-MM[&employee_id=N]   — my month
 * POST  /api/employee/hr/attendance/punch                            — punch in/out
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
  return verifyEmployeeToken(tok);
}

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM
  const employeeIdParam = url.searchParams.get('employee_id');

  let employeeId: number | null = null;
  if (employeeIdParam) {
    // Admin view of another employee — gate
    const perms = await getEffectivePermissions(actor.email, actor.role);
    if (!perms.can_access_attendance_admin) {
      return NextResponse.json({ error: 'Need can_access_attendance_admin permission' }, { status: 403 });
    }
    employeeId = parseInt(employeeIdParam, 10);
  } else {
    // Self view — look up employee_id from actor email
    const { data: emp } = await supabase.from('hr_employees').select('id').eq('email', actor.email.toLowerCase()).maybeSingle();
    if (!emp) return NextResponse.json({ rows: [], note: 'No employee record found for your email.' });
    employeeId = emp.id;
  }

  const monthStart = `${month}-01`;
  const next = new Date(month + '-01T00:00:00Z');
  next.setUTCMonth(next.getUTCMonth() + 1);
  const monthEnd = next.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('hr_attendance_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('log_date', monthStart)
    .lt('log_date', monthEnd)
    .order('log_date');

  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ rows: data ?? [] });
}
