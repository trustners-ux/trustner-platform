/**
 * Portfolio Diagnostic — admin access management (User Management bridge).
 *
 * The user-management permission editor is keyed to the login DIRECTORY, but PD
 * access lives in the database `pd_employee_roles` table (keyed to employees.id,
 * bridged by email). These helpers read/write that real store so an admin can
 * turn PD access on/off — and choose Uploader vs Reviewer — from one screen.
 *
 *   getPdAccessByEmail()  → current { hasAccess, canReview } for the toggle state
 *   setPdAccessByEmail()  → ensure an employees row exists, then upsert the grant
 *
 * Role mapping: Reviewer → mid_reviewer (upload+edit+review+approve, no publish);
 * Uploader → junior_analyst (upload+edit only). Turning access OFF deactivates
 * the grant (is_active=false) — never deletes history.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Employee } from '@/lib/employee/employee-directory';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { isApprover } from '@/lib/auth/config';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getVisibleEmployeeIds } from '@/lib/permissions/hierarchy';

/**
 * Can this employee (by email) VIEW this PD run? An RM may only see runs within
 * their visibility scope — own + reports/subtree + explicit PD assignments;
 * firm for admins/approvers; plus the run's own reviewer/approver. Fail closed.
 * `isAdminToken` short-circuits true for classic /admin-login admins.
 */
export async function canViewPdRun(
  runId: number,
  email: string,
  isAdminToken = false
): Promise<boolean> {
  if (isAdminToken) return true;
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { data: run } = await sb
    .from('pd_diagnostic_runs')
    .select('uploaded_by_employee_id, current_reviewer_employee_id, approved_by_employee_id')
    .eq('id', runId)
    .maybeSingle();
  if (!run) return false;
  const { data: actor } = await sb
    .from('employees').select('id').ilike('email', email.trim()).maybeSingle();
  const actorId = (actor?.id as number) ?? 0;
  const scope = await getVisibleEmployeeIds({ employeeId: actorId, email });
  if (scope.includeAll) return true;
  const up = run.uploaded_by_employee_id as number | null;
  return (
    (up != null && scope.employeeIds.includes(up)) ||
    (actorId > 0 &&
      (run.current_reviewer_employee_id === actorId || run.approved_by_employee_id === actorId))
  );
}

/**
 * Resolve the caller as a PD admin, accepting EITHER an admin JWT OR an employee
 * JWT — because Ram/Sangeeta sign in through the EMPLOYEE portal (employee
 * cookie), not the admin login. An employee session qualifies when the email is
 * an approver (Ram/Sangeeta) or holds the PD `admin` role. Returns {email} or
 * null. Fixes: "delete asks for a reason then won't delete" — the old check
 * accepted admin-token only, so it 403'd every employee-session admin.
 */
export async function requirePdAdmin(): Promise<{ email: string } | null> {
  const c = await cookies();

  // 1) Admin JWT (classic /admin login)
  const a = c.get(COOKIE_NAME)?.value;
  if (a) {
    const p = await verifyToken(a);
    if (p) return { email: p.email };
  }

  // 2) Employee JWT — allow approvers or PD-admins
  const e = c.get(EMPLOYEE_COOKIE)?.value;
  if (e) {
    const p = await verifyEmployeeToken(e);
    if (p) {
      if (isApprover(p.email)) return { email: p.email };
      const sb = getSupabaseAdmin();
      if (sb) {
        const { data: emp } = await sb
          .from('employees').select('id').ilike('email', p.email.trim()).maybeSingle();
        if (emp?.id) {
          const { data: r } = await sb
            .from('pd_employee_roles')
            .select('role:pd_roles(name)')
            .eq('employee_id', emp.id as number)
            .eq('is_active', true)
            .maybeSingle();
          const raw = (r as Record<string, unknown> | null)?.role;
          const ro = Array.isArray(raw) ? (raw[0] as Record<string, unknown>) : (raw as Record<string, unknown>);
          if ((ro?.name as string) === 'admin') return { email: p.email };
        }
      }
    }
  }
  return null;
}

const ROLE_MID_REVIEWER = 3;
const ROLE_JUNIOR_ANALYST = 2;

export interface PdAccessState {
  hasAccess: boolean;
  canReview: boolean;
}

export async function getPdAccessByEmail(sb: SupabaseClient, email: string): Promise<PdAccessState> {
  const { data: emp } = await sb.from('employees').select('id').ilike('email', email.trim()).maybeSingle();
  if (!emp?.id) return { hasAccess: false, canReview: false };
  const { data: row } = await sb
    .from('pd_employee_roles')
    .select('is_active, can_access_pd, role:pd_roles(can_review)')
    .eq('employee_id', emp.id as number)
    .eq('is_active', true)
    .maybeSingle();
  if (!row) return { hasAccess: false, canReview: false };
  const r = (row as Record<string, unknown>).role;
  const ro = Array.isArray(r) ? (r[0] as Record<string, unknown>) : (r as Record<string, unknown>);
  return {
    hasAccess: (row.can_access_pd as boolean | null) !== false,
    canReview: Boolean(ro?.can_review),
  };
}

function mapEntity(cg: string | undefined): 'TAS' | 'TIB' { return cg === 'TAS' ? 'TAS' : cg === 'TIB' ? 'TIB' : 'TAS'; }
function mapSegment(role: string | undefined): string {
  switch (role) {
    case 'cdo': case 'regional_manager': case 'branch_head': return 'Area Manager';
    case 'cdm': return 'CDM/POSP RM';
    case 'sr_rm': case 'rm': return 'Direct Sales';
    default: return 'Support';
  }
}
function mapDoj(d: string | undefined): string {
  if (!d) return '2024-01-01';
  const m = d.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '2024-01-01';
}

/**
 * Ensure a database employees row exists for this directory employee (bridged by
 * email). Adopts a same-name null-email seed row if present, else inserts. Returns
 * the employees.id, or null if it couldn't be resolved/created.
 */
async function ensureEmployeeRow(sb: SupabaseClient, dirEmp: Employee): Promise<number | null> {
  const email = dirEmp.email.trim();
  // 1) by email
  const byEmail = (await sb.from('employees').select('id').ilike('email', email).maybeSingle()).data;
  if (byEmail?.id) return byEmail.id as number;
  // 2) adopt a same-name, null-email seed row
  const seed = (await sb.from('employees').select('id').ilike('name', dirEmp.name).is('email', null).maybeSingle()).data;
  const fields = {
    name: dirEmp.name, email, designation: dirEmp.designation, department: dirEmp.department,
    entity: mapEntity(dirEmp.companyGroup), segment: mapSegment(dirEmp.role), doj: mapDoj(dirEmp.doj),
    is_active: true,
  };
  if (seed?.id) {
    await sb.from('employees').update(fields).eq('id', seed.id);
    return seed.id as number;
  }
  // 3) insert new
  const code = `${fields.entity}-PD-${dirEmp.id}`;
  const ins = (await sb.from('employees').insert({ ...fields, employee_code: code }).select('id').maybeSingle()).data;
  return (ins?.id as number) ?? null;
}

/**
 * Turn PD access on/off for a directory employee and set the Uploader/Reviewer
 * level. Idempotent. Returns the resolved state.
 */
export async function setPdAccessByEmail(
  sb: SupabaseClient,
  dirEmp: Employee,
  opts: { access: boolean; canReview: boolean }
): Promise<PdAccessState> {
  const empId = await ensureEmployeeRow(sb, dirEmp);
  if (!empId) return { hasAccess: false, canReview: false };

  const roleId = opts.canReview ? ROLE_MID_REVIEWER : ROLE_JUNIOR_ANALYST;
  const existing = (await sb.from('pd_employee_roles').select('id').eq('employee_id', empId).maybeSingle()).data;

  if (existing?.id) {
    await sb.from('pd_employee_roles').update({
      role_id: roleId,
      can_access_pd: opts.access,
      is_active: opts.access,
    }).eq('id', existing.id);
  } else if (opts.access) {
    // Only create a grant when turning access ON.
    await sb.from('pd_employee_roles').insert({
      employee_id: empId,
      role_id: roleId,
      can_access_pd: true,
      is_active: true,
    });
  }
  return { hasAccess: opts.access, canReview: opts.access && opts.canReview };
}
