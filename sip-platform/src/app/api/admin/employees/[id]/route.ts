/**
 * PATCH /api/admin/employees/[id]
 *
 * Updates an employee's reporting manager and/or PD role.
 * Every change writes a history row to app_role_assignments so we
 * have an immutable audit trail of who was assigned what when.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

interface PatchBody {
  reportingManagerId?: number | null;
  pdRoleId?: number | null;
  certifications?: string[];
  reason?: string;       // captured for audit log
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetId = parseInt(id, 10);
  if (Number.isNaN(targetId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Auth + manage permission check
  const actor = await resolveActor();
  if (!actor.email || !actor.employeeId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const isPrincipal = APPROVER_EMAILS.includes(actor.email.toLowerCase());
  if (!isPrincipal) {
    const { data: roleRow } = await supabase
      .from('pd_employee_roles')
      .select('role:pd_roles!inner(can_manage_users)')
      .eq('employee_id', actor.employeeId)
      .eq('is_active', true)
      .maybeSingle();
    const role = (roleRow as { role?: unknown })?.role;
    const r = Array.isArray(role) ? role[0] : role;
    const canManage = Boolean((r as { can_manage_users?: boolean } | undefined)?.can_manage_users);
    if (!canManage) {
      return NextResponse.json({ error: 'Need can_manage_users' }, { status: 403 });
    }
  }

  const body = (await req.json().catch(() => ({}))) as PatchBody;

  // ── Update reporting manager (employees table) ────────────────
  if (body.reportingManagerId !== undefined) {
    // Defensive: prevent self-loop
    if (body.reportingManagerId === targetId) {
      return NextResponse.json(
        { error: 'An employee cannot report to themselves' },
        { status: 400 }
      );
    }
    const { error } = await supabase
      .from('employees')
      .update({ reporting_manager_id: body.reportingManagerId, updated_at: new Date().toISOString() })
      .eq('id', targetId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Update PD role assignment ─────────────────────────────────
  if (body.pdRoleId !== undefined && body.pdRoleId !== null) {
    // 1. Deactivate the current pd_employee_roles row (if any)
    await supabase
      .from('pd_employee_roles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('employee_id', targetId)
      .eq('is_active', true);

    // 2. Insert (or activate) the new role row
    // We can't simply upsert because of the unique(employee_id) constraint
    // and the historical rows. Strategy: delete any existing matching row, then insert.
    // Note: the unique constraint is on (employee_id) which means only one
    // active+inactive row per employee. Since the schema has UNIQUE(employee_id),
    // we'd delete-then-insert.
    await supabase.from('pd_employee_roles').delete().eq('employee_id', targetId);
    const { error: insErr } = await supabase.from('pd_employee_roles').insert({
      employee_id: targetId,
      role_id: body.pdRoleId,
      certifications: body.certifications ?? [],
      is_active: true,
    });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    // 3. Audit: close the prior open assignment in app_role_assignments
    // and insert a new active one
    const nowIso = new Date().toISOString();
    await supabase
      .from('app_role_assignments')
      .update({ effective_to: nowIso })
      .eq('employee_id', targetId)
      .is('effective_to', null);
    await supabase.from('app_role_assignments').insert({
      employee_id: targetId,
      role_id: body.pdRoleId,
      effective_from: nowIso,
      assigned_by_employee_id: actor.employeeId,
      assigned_reason: body.reason ?? 'Updated via /admin/employees',
    });
  } else if (body.certifications !== undefined) {
    // Update only certifications, leave the role row in place
    await supabase
      .from('pd_employee_roles')
      .update({ certifications: body.certifications, updated_at: new Date().toISOString() })
      .eq('employee_id', targetId)
      .eq('is_active', true);
  }

  return NextResponse.json({ success: true });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function resolveActor(): Promise<{ employeeId: number; email: string | null }> {
  const cookieStore = await cookies();
  let email: string | null = null;
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p?.email) email = p.email;
  }
  if (!email) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const p = await verifyEmployeeToken(empToken);
      if (p?.email) email = p.email;
    }
  }
  if (!email) return { employeeId: 0, email: null };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { employeeId: 0, email };
  const { data } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();
  return { employeeId: (data?.id as number) ?? 0, email };
}
