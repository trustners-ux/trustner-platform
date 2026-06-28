/**
 * GET /api/employee/hr/letters/prefill?employee_id=123
 *   Returns the letter-form data for an existing employee, so "pick employee +
 *   entity" fills the whole form. Gated by can_access_letters (exposes PII).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { employeeToLetterData } from '@/lib/hr/letter-prefill';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function actorOk(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return perms.can_access_letters ? actor : null;
}

export async function GET(req: NextRequest) {
  const actor = await actorOk(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);

  // Search mode: ?q=<name|code> → minimal list for the picker.
  const q = url.searchParams.get('q');
  if (q && q.trim()) {
    const safe = q.replace(/[%,()]/g, ' ').trim();
    const { data: rows } = await supabase
      .from('hr_employees')
      .select('id, full_name, entity, designation, employee_code')
      .or(`full_name.ilike.%${safe}%,employee_code.ilike.%${safe}%`)
      .order('full_name', { ascending: true })
      .limit(20);
    return NextResponse.json({ results: rows ?? [] });
  }

  const employeeId = url.searchParams.get('employee_id');
  if (!employeeId) return NextResponse.json({ error: 'employee_id or q required' }, { status: 400 });

  const { data: emp, error } = await supabase
    .from('hr_employees')
    .select('*')
    .eq('id', Number(employeeId))
    .single();
  if (error || !emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const data = employeeToLetterData(emp);
  return NextResponse.json({ entity: data.entity, employee_id: emp.id, data });
}
