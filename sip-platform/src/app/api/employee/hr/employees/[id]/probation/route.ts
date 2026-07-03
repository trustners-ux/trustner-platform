/**
 * POST /api/employee/hr/employees/:id/probation
 *
 * Probation lifecycle actions for an employee. Admin or any user with
 * `can_manage_probation` perm can call these. Audit-logged.
 *
 * Body shape:
 *   { action: 'extend', months: 3, notes?: string }                  → +3 months to end-date, count++
 *   { action: 'confirm', notes?: string }                            → status='confirmed', confirmation_date=today
 *   { action: 'not_confirmed', notes?: string }                      → status='exited' (triggers Phase 8 separation flow)
 *   { action: 'shorten', months: 1, notes?: string }                 → -1 month from end-date
 *   { action: 'set', probation_end_date: '2026-12-01', notes?: string } → explicit end-date
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  const actor = tok ? await verifyEmployeeToken(tok) : null;
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_manage_probation) {
    return NextResponse.json({ error: 'You are not permitted to manage probation. Ask the admin to grant can_manage_probation.' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { id } = await ctx.params;
  const employee_id = Number(id);
  if (!employee_id) return NextResponse.json({ error: 'Bad employee id' }, { status: 400 });

  const body = await req.json();
  const { action, months, probation_end_date, notes } = body as {
    action?: 'extend' | 'shorten' | 'confirm' | 'not_confirmed' | 'set';
    months?: number;
    probation_end_date?: string;
    notes?: string;
  };

  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

  const { data: emp, error: empErr } = await supabase
    .from('hr_employees')
    .select('id, full_name, email, employment_status, employment_type, date_of_joining, probation_end_date, probation_extended_count, probation_months')
    .eq('id', employee_id)
    .maybeSingle();
  if (empErr || !emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  if (emp.employment_status === 'exited') {
    return NextResponse.json({ error: 'Cannot change probation — employee is already exited.' }, { status: 409 });
  }

  const today = new Date().toISOString().slice(0, 10);
  let update: Record<string, unknown> = {};

  if (action === 'confirm') {
    if (emp.employment_status === 'confirmed') {
      return NextResponse.json({ error: 'Already confirmed.' }, { status: 409 });
    }
    update = {
      employment_status: 'confirmed',
      confirmation_date: today,
      confirmation_by: actor.email,
      confirmation_notes: notes || null,
    };
  } else if (action === 'not_confirmed') {
    // Triggers Phase 8 separation flow manually — HR will use /employee/hr/exits/new
    // for the formal F&F. Here we just flip the status flag so leave + payroll
    // know to pause.
    update = {
      employment_status: 'exited',
      confirmation_notes: notes || 'Not confirmed at end of probation',
    };
  } else if (action === 'extend' || action === 'shorten') {
    if (emp.employment_status !== 'probation') {
      return NextResponse.json({ error: `Cannot ${action} — employee is not on probation.` }, { status: 409 });
    }
    const m = Math.max(0, Math.min(24, Number(months) || 0));
    if (m === 0) return NextResponse.json({ error: 'months must be > 0' }, { status: 400 });
    const base = emp.probation_end_date ? new Date(emp.probation_end_date) : new Date(emp.date_of_joining || today);
    base.setMonth(base.getMonth() + (action === 'extend' ? m : -m));
    update = {
      probation_end_date: base.toISOString().slice(0, 10),
      probation_extended_count: (emp.probation_extended_count || 0) + 1,
      confirmation_notes: notes || (action === 'extend' ? `Extended by ${m} months` : `Shortened by ${m} months`),
    };
  } else if (action === 'set') {
    if (!probation_end_date) return NextResponse.json({ error: 'probation_end_date required' }, { status: 400 });
    update = {
      probation_end_date,
      probation_extended_count: (emp.probation_extended_count || 0) + 1,
      confirmation_notes: notes || `Probation end date manually set to ${probation_end_date}`,
    };
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('hr_employees')
    .update(update)
    .eq('id', employee_id)
    .select('id, employment_status, probation_end_date, probation_extended_count, confirmation_date')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  // Best-effort audit log (table may not exist in older deployments — swallow)
  try {
    await supabase.from('hr_audit_log').insert({
      actor_email: actor.email,
      action: `probation.${action}`,
      entity_type: 'hr_employees',
      entity_id: employee_id,
      payload: { ...update, employee_name: emp.full_name },
    });
  } catch { /* swallow */ }

  return NextResponse.json({ ok: true, employee: updated });
}
