/**
 * Permission Hierarchy & Scope Resolver
 *
 * Single source of truth for "given this user, which employees' work
 * can they see?" Used by every list endpoint (PD dashboard, MP queue,
 * IP queue, etc.) so the same scope rules apply everywhere.
 *
 * Design:
 *   - The user holds a role (from pd_roles via pd_employee_roles).
 *   - The role declares a visibility_scope: own / direct_reports /
 *     subtree / firm.
 *   - Scope resolves to a list of employee IDs (or 'all') whose
 *     uploaded/owned artefacts the user can read.
 *
 * Why a library: keeps the SQL recursion + caching + APPROVER_EMAILS
 * fallback in one place. Endpoints just call getVisibleEmployeeIds()
 * and pass the result to their queries.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

export type VisibilityScope = 'own' | 'direct_reports' | 'subtree' | 'firm';

export interface ResolvedScope {
  scope: VisibilityScope;
  /**
   * Employee IDs whose work this user can read. If `includeAll` is
   * true, ignore this list — the user sees everything.
   */
  employeeIds: number[];
  includeAll: boolean;
  /** Reason for the resolved scope (for debugging + audit log). */
  reason: string;
}

export interface ActorContext {
  employeeId: number;
  email: string;
  roleName?: string;
  visibilityScope?: VisibilityScope;
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

/**
 * Resolve the visible employee scope for a given actor. Cached for
 * the duration of the request via the closure inside Next.js's per-
 * request lambda — no module-level caching (different users hit
 * different scopes).
 */
export async function getVisibleEmployeeIds(
  actor: ActorContext
): Promise<ResolvedScope> {
  // ── Approver shortcut: Ram + Sangeeta always see everything ──
  if (APPROVER_EMAILS.includes(actor.email.toLowerCase())) {
    return {
      scope: 'firm',
      employeeIds: [],
      includeAll: true,
      reason: 'approver-email-bypass',
    };
  }

  const scope = actor.visibilityScope ?? (await loadActorScope(actor.employeeId));

  let base: ResolvedScope;
  switch (scope) {
    case 'firm':
      // Firm scope already sees everyone — explicit assignments are moot.
      return {
        scope: 'firm',
        employeeIds: [],
        includeAll: true,
        reason: 'role-grants-firm-scope',
      };
    case 'subtree': {
      const ids = await getDescendantEmployeeIds(actor.employeeId);
      base = {
        scope: 'subtree',
        employeeIds: ids,
        includeAll: false,
        reason: `role-grants-subtree-(${ids.length} employees)`,
      };
      break;
    }
    case 'direct_reports': {
      const direct = await getDirectReportIds(actor.employeeId);
      base = {
        scope: 'direct_reports',
        employeeIds: [actor.employeeId, ...direct],
        includeAll: false,
        reason: `role-grants-direct-reports-(${direct.length} reports)`,
      };
      break;
    }
    case 'own':
    default:
      base = {
        scope: 'own',
        employeeIds: [actor.employeeId],
        includeAll: false,
        reason: 'role-grants-own-only',
      };
      break;
  }

  // ── Explicit PD review assignments (Phase-2 fine-grained oversight) ──
  // A reviewer (e.g. CA Ishika) can be granted visibility of specific people
  // who do NOT report up through them in the HR tree. Additive only — widens
  // the visible set, never narrows it. (pd_review_assignments, migration 045.)
  const assigned = await getPdAssignedSubjectIds(actor.employeeId);
  if (assigned.length > 0) {
    const merged = Array.from(new Set([...base.employeeIds, ...assigned]));
    return {
      ...base,
      employeeIds: merged,
      reason: `${base.reason}+pd-assigned-(${assigned.length})`,
    };
  }
  return base;
}

/**
 * Subjects this reviewer is explicitly assigned to oversee in the PD
 * (pd_review_assignments). Returns [] if the table is absent or empty so a
 * partial rollout never breaks visibility resolution.
 */
export async function getPdAssignedSubjectIds(reviewerId: number): Promise<number[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('pd_review_assignments')
    .select('subject_employee_id')
    .eq('reviewer_employee_id', reviewerId)
    .eq('is_active', true);
  if (error || !data) return [];
  return data.map((r) => r.subject_employee_id as number);
}

/**
 * Direct reports = employees whose `reporting_manager_id = actorId`.
 */
export async function getDirectReportIds(actorId: number): Promise<number[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('reporting_manager_id', actorId)
    .eq('is_active', true);
  return (data ?? []).map((r) => r.id as number);
}

/**
 * Full subtree = the actor + every employee under them (transitive).
 * Uses the v_employee_subtree recursive view created in migration 012.
 */
export async function getDescendantEmployeeIds(actorId: number): Promise<number[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [actorId];
  const { data, error } = await supabase
    .from('v_employee_subtree')
    .select('descendant_id')
    .eq('ancestor_id', actorId);
  if (error || !data) {
    // Fallback: if the view doesn't exist yet (migration not run),
    // walk manually via repeated direct-reports queries. Slower but
    // keeps the platform from breaking during a partial rollout.
    return walkSubtreeFallback(actorId);
  }
  return data.map((r) => r.descendant_id as number);
}

/**
 * Reporting chain = the actor + every manager above them, up to the root.
 * Used to determine "who can see this artefact" inversely.
 */
export async function getReportingChain(employeeId: number): Promise<number[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [employeeId];
  const chain: number[] = [employeeId];
  let currentId: number | null = employeeId;
  const seen = new Set<number>();
  while (currentId !== null && !seen.has(currentId)) {
    seen.add(currentId);
    const result: { data: { reporting_manager_id: number | null } | null } = await supabase
      .from('employees')
      .select('reporting_manager_id')
      .eq('id', currentId)
      .maybeSingle();
    const next: number | null = result.data?.reporting_manager_id ?? null;
    if (next === null) break;
    chain.push(next);
    currentId = next;
  }
  return chain;
}

/**
 * Log a view event to the audit log. Fire-and-forget — never blocks
 * the request that triggered it.
 */
export async function logArtefactView(input: {
  viewerEmployeeId: number;
  artefactType:
    | 'portfolio_diagnostic'
    | 'meeting_brief'
    | 'investment_proposal'
    | 'client_orientation'
    | 'periodic_review'
    | 'client_family'
    | 'employee_profile';
  artefactId: number;
  scopeUsed?: VisibilityScope;
  userAgent?: string;
  requestId?: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  // Best-effort, never await: we don't want a slow audit log to
  // delay a user-facing read.
  void supabase.from('app_artefact_views').insert({
    viewer_employee_id: input.viewerEmployeeId,
    artefact_type: input.artefactType,
    artefact_id: input.artefactId,
    scope_used: input.scopeUsed ?? null,
    user_agent_hash: input.userAgent ? simpleHash(input.userAgent) : null,
    request_id: input.requestId ?? null,
  });
}

// ─────────────────────────────────────────────────────────────────
// INTERNAL
// ─────────────────────────────────────────────────────────────────

/**
 * Load the actor's visibility_scope by joining their employee row →
 * active pd_employee_roles → pd_roles.
 */
async function loadActorScope(employeeId: number): Promise<VisibilityScope> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 'own';
  const { data } = await supabase
    .from('pd_employee_roles')
    .select('role:pd_roles!inner(visibility_scope)')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) return 'own';
  const role = (data as { role?: unknown }).role;
  const r = Array.isArray(role) ? role[0] : role;
  const scope = (r as { visibility_scope?: string } | undefined)?.visibility_scope;
  if (scope === 'firm' || scope === 'subtree' || scope === 'direct_reports' || scope === 'own') {
    return scope;
  }
  return 'own';
}

/**
 * Fallback subtree walker if v_employee_subtree view is missing
 * (e.g. during a partial migration rollout). BFS-style.
 */
async function walkSubtreeFallback(rootId: number): Promise<number[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [rootId];
  const seen = new Set<number>([rootId]);
  let frontier: number[] = [rootId];
  // Hard cap: 10 levels deep to avoid runaway in case of a cycle
  for (let depth = 0; depth < 10 && frontier.length > 0; depth++) {
    const { data } = await supabase
      .from('employees')
      .select('id, reporting_manager_id')
      .in('reporting_manager_id', frontier)
      .eq('is_active', true);
    const next: number[] = [];
    for (const row of data ?? []) {
      const id = row.id as number;
      if (!seen.has(id)) {
        seen.add(id);
        next.push(id);
      }
    }
    frontier = next;
  }
  return Array.from(seen);
}

/** Lightweight hash for UA strings — not cryptographic; just enough to compare. */
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}
