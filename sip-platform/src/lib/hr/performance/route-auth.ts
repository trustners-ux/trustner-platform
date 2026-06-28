/**
 * Performance Management — shared auth helpers for API routes.
 *
 * Two gates:
 *   - canManagePerformance(perms)  — HR-admin (cycle setup, calibration, finalize, PIP)
 *   - resolveActorEmployee(req)    — Employee self-service: returns actor + hr_employees row
 *
 * Manager-review and skip-review use email-match on hr_manager_review.manager_email
 * (employee A is allowed to write manager_review for employee B if their actor.email
 * equals hr_employees.reporting_manager_email of B, or if they are HR-admin).
 */
import { NextRequest } from 'next/server';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions, type HrPermissions } from '@/lib/hr/permissions';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export function canManagePerformance(perms: HrPermissions): boolean {
  if (perms.can_access_performance === true) return true;
  // Until performance permission is widely seeded, payroll-ops gate is the fallback.
  return perms.can_access_payroll === true;
}

export interface ActorContext {
  email: string;
  role?: string;
  perms: HrPermissions;
  isAdmin: boolean;
}

export async function getActorContext(req: NextRequest): Promise<
  | { ok: true; ctx: ActorContext }
  | { ok: false; error: string; status: 401 | 403 | 503 }
> {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return { ok: false, error: 'Unauthenticated', status: 401 };
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return { ok: false, error: 'Invalid session', status: 401 };
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return {
    ok: true,
    ctx: {
      email: actor.email.toLowerCase(),
      role: actor.role,
      perms,
      isAdmin: canManagePerformance(perms),
    },
  };
}

export async function requireAdmin(req: NextRequest) {
  const r = await getActorContext(req);
  if (!r.ok) return r;
  if (!r.ctx.isAdmin) {
    return {
      ok: false as const,
      error: 'Need can_access_performance permission',
      status: 403 as const,
    };
  }
  return r;
}

/** Resolve the hr_employees row for the calling actor. */
export async function resolveActorEmployee(req: NextRequest) {
  const r = await getActorContext(req);
  if (!r.ok) return r;
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false as const, error: 'DB not configured', status: 503 as const };
  const { data: emp } = await supabase
    .from('hr_employees')
    .select('id, full_name, email, phone, entity, designation, reporting_manager_id, reporting_manager_name')
    .eq('email', r.ctx.email)
    .maybeSingle();
  if (!emp) {
    return {
      ok: false as const,
      error: 'No employee record for your email',
      status: 400 as const,
    };
  }
  return { ok: true as const, ctx: r.ctx, employee: emp };
}

/** FY label from a date string ('YYYY-MM-DD'). e.g. 2026-04-01 → 'FY26'. */
export function fyFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `FY${String(year).slice(-2)}`;
}
