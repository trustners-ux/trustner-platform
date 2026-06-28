/**
 * Portfolio Diagnostic — shared audit / time-log helper.
 *
 * Writes an immutable row to pd_workflow_events for EVERY meaningful action so
 * there is a complete, tamper-evident time-log of who did what, when — incl. the
 * actions the workflow route didn't previously capture (re-score, verdict
 * override, share, soft-delete). pd_workflow_events is append-only.
 *
 * Best-effort + non-blocking: resolves the actor's employees.id + pd role by
 * email and inserts. If the actor can't be resolved to a NOT-NULL (employee_id,
 * role) pair, it logs a warning and skips rather than breaking the user action.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { APPROVER_EMAILS } from '@/lib/auth/config';

export type PdAuditAction =
  | 'CREATE_DRAFT' | 'EDIT_DRAFT' | 'RE_SCORE' | 'RISK_PROFILE_EDIT'
  | 'VERDICT_OVERRIDE' | 'SHARE' | 'DELETE' | 'RESTORE'
  | 'SUBMIT' | 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'PUBLISH';

interface LogArgs {
  runId: number;
  actorEmail: string | null | undefined;
  action: PdAuditAction;
  fromStatus?: string | null;
  toStatus?: string | null;
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Resolve an actor email → { employeeId, roleName } for the workflow-event row.
 * Falls back to 'admin' role for the hardcoded approver emails so Ram/Sangeeta
 * are never un-loggable.
 */
async function resolveActor(
  sb: SupabaseClient,
  email: string
): Promise<{ employeeId: number; roleName: string } | null> {
  const { data: emp } = await sb
    .from('employees')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();
  if (!emp?.id) return null;
  const employeeId = emp.id as number;

  const { data: roleRow } = await sb
    .from('pd_employee_roles')
    .select('role:pd_roles(name)')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .maybeSingle();
  const raw = (roleRow as Record<string, unknown> | null)?.role;
  const roleObj = Array.isArray(raw) ? (raw[0] as Record<string, unknown>) : (raw as Record<string, unknown>);
  let roleName = (roleObj?.name as string) || null;

  if (!roleName) {
    // No PD role row — approver emails are admins; everyone else defaults to the
    // lowest tier so the NOT-NULL enum column is satisfied (the action itself was
    // already authorised upstream; this is only for the audit label).
    roleName = APPROVER_EMAILS.includes(email.trim().toLowerCase()) ? 'admin' : 'junior_analyst';
  }
  return { employeeId, roleName };
}

/**
 * Append one immutable audit row. Never throws (best-effort logging must not
 * break the user's action). Returns true if a row was written.
 */
export async function logPdEvent(sb: SupabaseClient, args: LogArgs): Promise<boolean> {
  try {
    if (!args.actorEmail) return false;
    const actor = await resolveActor(sb, args.actorEmail);
    if (!actor) return false;
    const { error } = await sb.from('pd_workflow_events').insert({
      diagnostic_run_id: args.runId,
      actor_employee_id: actor.employeeId,
      actor_role: actor.roleName,
      action: args.action,
      from_status: args.fromStatus ?? null,
      to_status: args.toStatus ?? null,
      comment: args.comment ?? null,
      metadata: args.metadata ?? null,
    });
    if (error) { console.warn('[pd-audit] insert failed:', error.message); return false; }
    return true;
  } catch (e) {
    console.warn('[pd-audit] logPdEvent error:', (e as Error).message);
    return false;
  }
}
