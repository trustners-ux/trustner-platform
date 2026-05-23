/**
 * Trustner Agent Platform — Generic Agent Queries
 *
 * Reusable query helpers that work across all 5 agents. Each agent's
 * dashboard route imports these to avoid duplicating boilerplate.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import type {
  AgentDashboardCounts,
  AgentWorkflowStatus,
} from './types';

/**
 * Get dashboard counts for any agent's table.
 *
 * @param table — the SQL table name (e.g. 'mp_meeting_briefs',
 *               'ip_investment_proposals', etc.)
 */
export async function getAgentDashboardCounts(
  table: string,
  employeeId: number
): Promise<AgentDashboardCounts> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      myDrafts: 0,
      awaitingMyReview: 0,
      approvedNotYetPublished: 0,
      publishedThisMonth: 0,
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [drafts, awaiting, approved, published] = await Promise.all([
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('uploaded_by_employee_id', employeeId)
      .in('status', ['DRAFT', 'CHANGES_REQUESTED']),
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('current_reviewer_employee_id', employeeId)
      .in('status', ['IN_REVIEW', 'ESCALATED']),
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .or(`approved_by_employee_id.eq.${employeeId},uploaded_by_employee_id.eq.${employeeId}`)
      .eq('status', 'APPROVED'),
    supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED')
      .gte('published_at', startOfMonth.toISOString()),
  ]);

  return {
    myDrafts: drafts.count ?? 0,
    awaitingMyReview: awaiting.count ?? 0,
    approvedNotYetPublished: approved.count ?? 0,
    publishedThisMonth: published.count ?? 0,
  };
}

/**
 * Generic queue listing helper. Returns rows filtered by status set
 * and optional employee constraint. Caller maps to their specific
 * agent's ListItem type.
 */
export async function queryAgentQueue<TRow extends Record<string, unknown>>(opts: {
  table: string;
  selectCols: string;
  statuses: AgentWorkflowStatus[];
  filter?: 'uploaded_by_me' | 'reviewer_is_me' | 'approved_by_me_or_uploader';
  employeeId?: number;
  orderBy: string;
  limit?: number;
}): Promise<TRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let query = supabase
    .from(opts.table)
    .select(opts.selectCols)
    .in('status', opts.statuses);

  if (opts.filter && opts.employeeId !== undefined) {
    if (opts.filter === 'uploaded_by_me') {
      query = query.eq('uploaded_by_employee_id', opts.employeeId);
    } else if (opts.filter === 'reviewer_is_me') {
      query = query.eq('current_reviewer_employee_id', opts.employeeId);
    } else if (opts.filter === 'approved_by_me_or_uploader') {
      query = query.or(
        `approved_by_employee_id.eq.${opts.employeeId},uploaded_by_employee_id.eq.${opts.employeeId}`
      );
    }
  }

  const { data, error } = await query
    .order(opts.orderBy, { ascending: false, nullsFirst: false })
    .limit(opts.limit ?? 20);

  if (error || !data) return [];
  return data as unknown as TRow[];
}

// ─────────────────────────────────────────────────────────────────
// EMPLOYEE EMAIL → DB ID RESOLUTION (canonical for all agents)
// ─────────────────────────────────────────────────────────────────

export async function resolveEmployeeIdByEmail(
  email: string
): Promise<number | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  // Case-insensitive lookup — JWT-carried email casing can vary from
  // what's stored in the employees table.
  const { data } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();
  return (data?.id as number) ?? null;
}

// ─────────────────────────────────────────────────────────────────
// FIRM-PRINCIPAL FALLBACK — Ram + Sangeeta sit at the top of the
// approval matrix. If the DB lookup ever fails (missing employees
// row, missing pd_employee_roles row, transient connection), give
// them a synthesized Admin-level workbench so they cannot be
// locked out of their own approval system.
// ─────────────────────────────────────────────────────────────────

import { APPROVER_EMAILS } from '@/lib/auth/config';

export function isApproverEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return APPROVER_EMAILS.includes(email.trim().toLowerCase());
}

interface ApproverFallback {
  employee: {
    id: number;
    name: string;
    email: string;
    role: {
      name: 'admin';
      level: 5;
      canUpload: true;
      canReview: true;
      canApprove: true;
      canPublish: true;
    };
    certifications: string[];
  };
  counts: {
    myDrafts: number;
    awaitingMyReview: number;
    approvedNotYetPublished: number;
    publishedThisMonth: number;
    totalThisMonth: number;
  };
  myDrafts: never[];
  awaiting: never[];
  approvedPending: never[];
  recent: never[];
}

/**
 * Build a synthetic Admin dashboard response for firm principals
 * when the DB can't (yet) produce one. Queues are returned empty —
 * the principal can still see the layout, role, and create new
 * diagnostics. A subsequent refresh after a proper DB row is added
 * will replace this with live counts.
 */
export function buildApproverFallbackResponse(
  email: string,
  nameHint?: string
): ApproverFallback {
  const displayName =
    nameHint ||
    (email.toLowerCase() === 'ram@trustner.in'
      ? 'Ram Shah'
      : email.toLowerCase() === 'sangeeta@trustner.in'
      ? 'Sangeeta Shah'
      : email);
  return {
    employee: {
      id: 0,
      name: displayName,
      email,
      role: {
        name: 'admin' as const,
        level: 5 as const,
        canUpload: true as const,
        canReview: true as const,
        canApprove: true as const,
        canPublish: true as const,
      },
      certifications: ['CFP'],
    },
    counts: {
      myDrafts: 0,
      awaitingMyReview: 0,
      approvedNotYetPublished: 0,
      publishedThisMonth: 0,
      totalThisMonth: 0,
    },
    myDrafts: [],
    awaiting: [],
    approvedPending: [],
    recent: [],
  };
}
