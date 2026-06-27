/**
 * PD run visibility gate (audit P0-4).
 *
 * The GET run-detail route already refuses to show a run outside the actor's
 * visibility scope. The MUTATION routes (override / score / workflow action /
 * comments / regenerate) historically checked only authentication + role, NOT
 * run scope — so any authenticated employee could tamper with, re-score, or
 * approve ANOTHER relationship manager's client run by id. This helper applies
 * the SAME gate as the GET route so reads and writes are consistent.
 *
 * Allowed when: a valid admin JWT is present (trusted admin, may have no
 * employees row), OR the actor's scope is firm-wide, OR the run was uploaded by
 * someone in the actor's visible set (own + reports/subtree + explicit PD
 * assignments), OR the actor is this run's current reviewer or approver.
 */
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { getVisibleEmployeeIds } from '@/lib/permissions/hierarchy';

export async function isPdRunInScope(
  supabase: SupabaseClient,
  runId: number,
  opts: { employeeEmail: string | null }
): Promise<boolean> {
  // Trusted admin token → allow (admins may not have an employees row).
  const cookieStore = await cookies();
  const adminTok = cookieStore.get(COOKIE_NAME)?.value;
  if (adminTok && (await verifyToken(adminTok))) return true;

  const email = (opts.employeeEmail || '').trim();
  if (!email) return false;

  const { data: run } = await supabase
    .from('pd_diagnostic_runs')
    .select('uploaded_by_employee_id, current_reviewer_employee_id, approved_by_employee_id')
    .eq('id', runId)
    .maybeSingle();
  if (!run) return false;

  const { data: actor } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  const actorId = (actor?.id as number) ?? 0;

  const scope = await getVisibleEmployeeIds({ employeeId: actorId, email });
  if (scope.includeAll) return true;

  const up = run.uploaded_by_employee_id as number | null;
  return (
    (up != null && scope.employeeIds.includes(up)) ||
    (actorId > 0 &&
      (run.current_reviewer_employee_id === actorId ||
        run.approved_by_employee_id === actorId))
  );
}
