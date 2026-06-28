/**
 * GET  /api/employee/hr/leave        — list my applications (or all, admin)
 * GET  /api/employee/hr/leave?balances=1 — my leave balances
 * POST /api/employee/hr/leave        — apply for leave
 * PATCH /api/employee/hr/leave       — approve / reject (manager only)
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

/** Day-count helper — inclusive, half-day aware */
function calcDays(from: string, to: string, halfDay = false): number {
  const f = new Date(from);
  const t = new Date(to);
  const ms = t.getTime() - f.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  return halfDay && days === 1 ? 0.5 : days;
}

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const balancesMode = url.searchParams.get('balances') === '1';

  // Resolve actor's employee_id by email (if they have a hr_employees record)
  const { data: empRow } = await supabase
    .from('hr_employees')
    .select('id, entity')
    .eq('email', actor.email.toLowerCase())
    .maybeSingle();

  if (balancesMode) {
    if (!empRow) return NextResponse.json({ balances: [] });
    const { data } = await supabase
      .from('hr_leave_balances')
      .select('id, fy, credited, carried_forward, used, available, leave_type_id, hr_leave_types(code,name)')
      .eq('employee_id', empRow.id);
    return NextResponse.json({ balances: data ?? [] });
  }

  if (!empRow) return NextResponse.json({ applications: [] });

  const { data, error } = await supabase
    .from('hr_leave_applications')
    .select('id, from_date, to_date, is_half_day, days, reason, status, approved_by, approved_at, applied_at, leave_type_id, hr_leave_types(code,name)')
    .eq('employee_id', empRow.id)
    .order('applied_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_apply_leave) {
    return NextResponse.json({ error: 'Not permitted to apply leave' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { leave_type_id, from_date, to_date, is_half_day, half_day_session, reason } = body;

  if (!leave_type_id || !from_date || !to_date) {
    return NextResponse.json({ error: 'leave_type_id, from_date, to_date required' }, { status: 400 });
  }

  const { data: empRow } = await supabase
    .from('hr_employees')
    .select('id, employment_status, probation_end_date')
    .eq('email', actor.email.toLowerCase())
    .maybeSingle();

  if (!empRow) {
    return NextResponse.json(
      { error: 'No employee record found for this email. HR must onboard you first.' },
      { status: 400 }
    );
  }

  // Probation gating — confirmed employees only get paid leave (EL/SL/CL).
  // LOP (leave without pay) is always allowed because it doesn't consume
  // the balance. We identify LOP by the leave type code.
  if (empRow.employment_status === 'probation') {
    const { data: lt } = await supabase
      .from('hr_leave_types').select('code').eq('id', leave_type_id).maybeSingle();
    const code = (lt?.code || '').toUpperCase();
    const isLop = code === 'LOP' || code === 'LWP';
    if (!isLop) {
      return NextResponse.json({
        error: `Paid leave (${code}) is not entitled during probation. Probation ends on ${empRow.probation_end_date || 'a date to be confirmed by HR'}. You may apply for LOP if absolutely needed.`,
      }, { status: 403 });
    }
  }

  const days = calcDays(from_date, to_date, is_half_day);

  const { data, error } = await supabase
    .from('hr_leave_applications')
    .insert({
      employee_id: empRow.id,
      leave_type_id,
      from_date,
      to_date,
      is_half_day: !!is_half_day,
      half_day_session: is_half_day ? half_day_session : null,
      days,
      reason: reason || null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data });
}

export async function PATCH(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_approve_leave && !perms.can_access_leave_admin) {
    return NextResponse.json({ error: 'Not permitted to approve / reject leave' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { id, action, rejection_reason } = body as { id?: number; action?: 'approve' | 'reject'; rejection_reason?: string };

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    approved_by: actor.email,
    approved_at: new Date().toISOString(),
    status: action === 'approve' ? 'approved' : 'rejected',
  };
  if (action === 'reject') update.rejection_reason = rejection_reason || null;

  const { data, error } = await supabase
    .from('hr_leave_applications')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If approved, increment used in hr_leave_balances (best-effort)
  if (action === 'approve' && data) {
    const currentFy = `FY${new Date().getFullYear()}`;
    await supabase.rpc('hr_apply_leave_balance', {
      p_employee_id: data.employee_id,
      p_leave_type_id: data.leave_type_id,
      p_fy: currentFy,
      p_days: data.days,
    }).then(() => undefined, () => undefined); // ignore if RPC not present
  }

  return NextResponse.json({ application: data });
}
