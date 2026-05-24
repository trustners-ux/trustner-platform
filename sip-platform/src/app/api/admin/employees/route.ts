/**
 * Admin Employees API
 *
 * GET  /api/admin/employees                     → list all employees + their role + reporting manager
 * PATCH /api/admin/employees/[id]               → update an employee's role / reporting manager
 *
 * Auth: requires admin/employee JWT AND the actor must have
 * `can_manage_users = true` in their PD role (or be a principal).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

interface EmployeeListItem {
  id: number;
  employeeCode: string;
  name: string;
  email: string | null;
  designation: string | null;
  entity: string | null;
  levelCode: string | null;
  isActive: boolean;
  reportingManagerId: number | null;
  reportingManagerName: string | null;
  pdRoleId: number | null;
  pdRoleName: string | null;
  visibilityScope: string | null;
  certifications: string[];
  directReportCount: number;
}

export async function GET() {
  // ── Auth ──────────────────────────────────────────────────────
  const actor = await resolveActor();
  if (!actor.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Authorization: principals always OK; otherwise require can_manage_users
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
      return NextResponse.json({ error: 'You need can_manage_users to view this page' }, { status: 403 });
    }
  }

  // ── Load employees + their active PD role ────────────────────
  const { data: employees } = await supabase
    .from('employees')
    .select(
      `
      id, employee_code, name, email, designation, entity, level_code, is_active,
      reporting_manager_id,
      reporting_manager:employees!employees_reporting_manager_id_fkey(name),
      pd_employee_roles(
        role_id,
        is_active,
        certifications,
        pd_role:pd_roles(id, name, visibility_scope)
      )
    `
    )
    .order('id', { ascending: true });

  // Aggregate direct-report counts in a single query
  const { data: reportCounts } = await supabase
    .from('employees')
    .select('reporting_manager_id')
    .not('reporting_manager_id', 'is', null);

  const reportCountMap = new Map<number, number>();
  for (const r of reportCounts ?? []) {
    const m = r.reporting_manager_id as number;
    reportCountMap.set(m, (reportCountMap.get(m) ?? 0) + 1);
  }

  const list: EmployeeListItem[] = (employees ?? []).map((e) => {
    const mgr = (e as { reporting_manager?: unknown }).reporting_manager;
    const mgrObj = Array.isArray(mgr) ? mgr[0] : mgr;
    const mgrName = (mgrObj as { name?: string } | undefined)?.name ?? null;

    const empRolesRaw = (e as { pd_employee_roles?: unknown[] }).pd_employee_roles ?? [];
    const activeRoleAssignment = (empRolesRaw as Array<{
      is_active?: boolean;
      certifications?: string[];
      pd_role?: { id?: number; name?: string; visibility_scope?: string } | Array<{ id?: number; name?: string; visibility_scope?: string }>;
    }>).find((r) => r.is_active === true);
    const pdRoleRaw = activeRoleAssignment?.pd_role;
    const pdRole = Array.isArray(pdRoleRaw) ? pdRoleRaw[0] : pdRoleRaw;

    return {
      id: e.id as number,
      employeeCode: e.employee_code as string,
      name: e.name as string,
      email: (e.email as string | null) ?? null,
      designation: (e.designation as string | null) ?? null,
      entity: (e.entity as string | null) ?? null,
      levelCode: (e.level_code as string | null) ?? null,
      isActive: Boolean(e.is_active),
      reportingManagerId: (e.reporting_manager_id as number | null) ?? null,
      reportingManagerName: mgrName,
      pdRoleId: (pdRole?.id as number | undefined) ?? null,
      pdRoleName: (pdRole?.name as string | undefined) ?? null,
      visibilityScope: (pdRole?.visibility_scope as string | undefined) ?? null,
      certifications: activeRoleAssignment?.certifications ?? [],
      directReportCount: reportCountMap.get(e.id as number) ?? 0,
    };
  });

  return NextResponse.json({ employees: list });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function resolveActor(): Promise<{ employeeId: number; email: string } | { employeeId: number; email: null }> {
  const cookieStore = await cookies();
  let email: string | null = null;

  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload?.email) email = payload.email;
  }
  if (!email) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const payload = await verifyEmployeeToken(empToken);
      if (payload?.email) email = payload.email;
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
