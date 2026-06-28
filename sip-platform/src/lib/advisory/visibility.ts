/**
 * Advisory Workbench record visibility gate (DPDP need-to-know).
 *
 * The non-PD workbench modules (Meeting Prep, Periodic Review, Client
 * Orientation, Investment Proposal) historically returned/mutated any record by
 * numeric id to ANY authenticated employee — leaking a family's AUM, XIRR,
 * income/expenses, relationship notes and cross-sell ticket sizes across the
 * whole team. PD already gates this (see lib/portfolio-diagnostic/run-scope.ts,
 * audit task #156); this is the same gate, generalised over the shared
 * maker-checker tables, which all carry uploaded_by_employee_id /
 * current_reviewer_employee_id / approved_by_employee_id.
 *
 * Allowed when: a valid admin JWT is present (trusted admin, may have no
 * employees row), OR the actor's visibility scope is firm-wide, OR the record
 * was uploaded by someone in the actor's visible set (own + reports/subtree +
 * explicit assignments), OR the actor is this record's reviewer or approver.
 */
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { getVisibleEmployeeIds } from '@/lib/permissions/hierarchy';

/** Workbench tables whose rows carry the shared workflow ownership columns. */
export type AdvisoryTable =
  | 'mp_meeting_briefs'
  | 'pr_periodic_reviews'
  | 'co_client_orientations'
  | 'ip_investment_proposals';

export async function isAdvisoryRecordInScope(
  supabase: SupabaseClient,
  table: AdvisoryTable,
  recordId: number,
  opts: { employeeEmail: string | null }
): Promise<boolean> {
  // Trusted admin token → allow (admins may not have an employees row).
  const cookieStore = await cookies();
  const adminTok = cookieStore.get(COOKIE_NAME)?.value;
  if (adminTok && (await verifyToken(adminTok))) return true;

  const email = (opts.employeeEmail || '').trim();
  if (!email) return false;

  const { data: rec } = await supabase
    .from(table)
    .select(
      'uploaded_by_employee_id, current_reviewer_employee_id, approved_by_employee_id'
    )
    .eq('id', recordId)
    .maybeSingle();
  if (!rec) return false;

  const { data: actor } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  const actorId = (actor?.id as number) ?? 0;

  const scope = await getVisibleEmployeeIds({ employeeId: actorId, email });
  if (scope.includeAll) return true;

  const up = rec.uploaded_by_employee_id as number | null;
  return (
    (up != null && scope.employeeIds.includes(up)) ||
    (actorId > 0 &&
      (rec.current_reviewer_employee_id === actorId ||
        rec.approved_by_employee_id === actorId))
  );
}
