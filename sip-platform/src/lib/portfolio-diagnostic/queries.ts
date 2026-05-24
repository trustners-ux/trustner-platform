/**
 * Portfolio Diagnostic — Data Access Layer
 *
 * Database queries for the Trustner Portfolio Diagnostic Workbench.
 * Uses the existing Supabase client + admin pattern from /lib/db/.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';
import type {
  WorkflowStatus,
  RoleName,
  Employee,
  Role,
} from './types';

// ─────────────────────────────────────────────────────────────────
// QUEUE COUNTS (for dashboard tiles)
// ─────────────────────────────────────────────────────────────────

export interface DashboardCounts {
  myDrafts: number;
  awaitingMyReview: number;
  approvedNotYetPublished: number;
  publishedThisMonth: number;
  totalThisMonth: number;
}

export async function getDashboardCounts(
  employeeId: number,
  opts?: { showAllTeam?: boolean }
): Promise<DashboardCounts> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      myDrafts: 0,
      awaitingMyReview: 0,
      approvedNotYetPublished: 0,
      publishedThisMonth: 0,
      totalThisMonth: 0,
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // My drafts — for principals (showAllTeam=true), count ALL team drafts
  let draftsQuery = supabase
    .from('pd_diagnostic_runs')
    .select('id', { count: 'exact', head: true })
    .in('status', ['DRAFT', 'CHANGES_REQUESTED']);
  if (!opts?.showAllTeam) {
    draftsQuery = draftsQuery.eq('uploaded_by_employee_id', employeeId);
  }

  const [drafts, awaiting, approved, published, total] = await Promise.all([
    draftsQuery,

    // Awaiting my review
    supabase
      .from('pd_diagnostic_runs')
      .select('id', { count: 'exact', head: true })
      .eq('current_reviewer_employee_id', employeeId)
      .in('status', ['IN_REVIEW', 'ESCALATED']),

    // Approved (mine), not yet published
    supabase
      .from('pd_diagnostic_runs')
      .select('id', { count: 'exact', head: true })
      .or(`approved_by_employee_id.eq.${employeeId},uploaded_by_employee_id.eq.${employeeId}`)
      .eq('status', 'APPROVED'),

    // Published this month
    supabase
      .from('pd_diagnostic_runs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED')
      .gte('published_at', startOfMonth.toISOString()),

    // Total this month (any status, any user)
    supabase
      .from('pd_diagnostic_runs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString()),
  ]);

  return {
    myDrafts: drafts.count ?? 0,
    awaitingMyReview: awaiting.count ?? 0,
    approvedNotYetPublished: approved.count ?? 0,
    publishedThisMonth: published.count ?? 0,
    totalThisMonth: total.count ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────────
// QUEUE LISTINGS
// ─────────────────────────────────────────────────────────────────

export interface DiagnosticListItem {
  id: number;
  documentId: string;
  familyId: number;
  familyName: string;
  status: WorkflowStatus;
  totalInvestedInr: number;
  currentValueInr: number;
  familyXirrPct: number | null;
  numHoldings: number;
  numActiveSips: number;
  verdictSwapCount: number;
  uploadedByName: string | null;
  currentReviewerName: string | null;
  createdAt: string;
  updatedAt: string;
}

const DIAGNOSTIC_SELECT_COLS = `
  id,
  document_id,
  family_id,
  family_name,
  status,
  total_invested_inr,
  current_value_inr,
  family_xirr_pct,
  num_holdings,
  num_active_sips,
  verdict_swap_count,
  uploaded_by_employee:employees!pd_diagnostic_runs_uploaded_by_employee_id_fkey(name),
  reviewer_employee:employees!pd_diagnostic_runs_current_reviewer_employee_id_fkey(name),
  created_at,
  updated_at
`;

export async function getMyDrafts(
  employeeId: number,
  limit = 20,
  opts?: { showAllTeam?: boolean }
): Promise<DiagnosticListItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  // For firm principals (Ram + Sangeeta), showAllTeam=true returns ALL
  // team drafts regardless of who uploaded them. This prevents the
  // "Sangeeta saved a draft but Ram can't see it" gap when both
  // act on the same portfolios.
  let query = supabase
    .from('pd_diagnostic_runs')
    .select(DIAGNOSTIC_SELECT_COLS)
    .in('status', ['DRAFT', 'CHANGES_REQUESTED']);
  if (!opts?.showAllTeam) {
    query = query.eq('uploaded_by_employee_id', employeeId);
  }

  const { data, error } = await query
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapDiagnosticRow);
}

export async function getAwaitingMyReview(
  employeeId: number,
  limit = 20
): Promise<DiagnosticListItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pd_diagnostic_runs')
    .select(DIAGNOSTIC_SELECT_COLS)
    .eq('current_reviewer_employee_id', employeeId)
    .in('status', ['IN_REVIEW', 'ESCALATED'])
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapDiagnosticRow);
}

export async function getRecentlyPublished(
  limit = 20
): Promise<DiagnosticListItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pd_diagnostic_runs')
    .select(DIAGNOSTIC_SELECT_COLS)
    .eq('status', 'PUBLISHED')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapDiagnosticRow);
}

export async function getMyApprovedAwaitingPublish(
  employeeId: number,
  limit = 20
): Promise<DiagnosticListItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pd_diagnostic_runs')
    .select(DIAGNOSTIC_SELECT_COLS)
    .eq('status', 'APPROVED')
    .or(
      `approved_by_employee_id.eq.${employeeId},uploaded_by_employee_id.eq.${employeeId}`
    )
    .order('approved_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapDiagnosticRow);
}

function mapDiagnosticRow(row: Record<string, unknown>): DiagnosticListItem {
  return {
    id: row.id as number,
    documentId: row.document_id as string,
    familyId: row.family_id as number,
    familyName: row.family_name as string,
    status: row.status as WorkflowStatus,
    totalInvestedInr: Number(row.total_invested_inr) || 0,
    currentValueInr: Number(row.current_value_inr) || 0,
    familyXirrPct: row.family_xirr_pct as number | null,
    numHoldings: (row.num_holdings as number) || 0,
    numActiveSips: (row.num_active_sips as number) || 0,
    verdictSwapCount: (row.verdict_swap_count as number) || 0,
    uploadedByName: extractName(row.uploaded_by_employee),
    currentReviewerName: extractName(row.reviewer_employee),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function extractName(emp: unknown): string | null {
  if (!emp) return null;
  if (Array.isArray(emp)) {
    return emp.length > 0 ? ((emp[0] as { name?: string }).name ?? null) : null;
  }
  if (typeof emp === 'object' && emp !== null && 'name' in emp) {
    return (emp as { name?: string }).name ?? null;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// CURRENT EMPLOYEE + ROLE LOOKUP
// ─────────────────────────────────────────────────────────────────

export interface EmployeeWithRole {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  managerId?: number;
  role: Role;
  certifications: string[];
  pendingReviewCount: number;
}

export async function getEmployeeWithPdRole(
  employeeId: number
): Promise<EmployeeWithRole | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // ── 1. Fetch the base employee row ────────────────────────────
  const { data: emp, error: empErr } = await supabase
    .from('employees')
    .select('id, employee_code, name, email, reporting_manager_id')
    .eq('id', employeeId)
    .single();

  if (empErr || !emp) return null;

  // ── 2. Try to fetch the active PD role assignment ─────────────
  const { data: empRoleRow } = await supabase
    .from('pd_employee_roles')
    .select(`
      certifications,
      pending_review_count,
      is_active,
      pd_role:pd_roles!inner(
        id,
        name,
        level,
        can_upload,
        can_edit_draft,
        can_review,
        can_approve,
        can_publish,
        can_override_hierarchy,
        can_manage_users,
        approval_aum_ceiling_inr
      )
    `)
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .maybeSingle();

  let roleRow: Record<string, unknown> | null = null;
  let certifications: string[] = [];
  let pendingReviewCount = 0;

  if (empRoleRow) {
    const rawRole = (empRoleRow as Record<string, unknown>).pd_role;
    roleRow = Array.isArray(rawRole)
      ? (rawRole[0] as Record<string, unknown>)
      : (rawRole as Record<string, unknown>);
    certifications = ((empRoleRow as Record<string, unknown>).certifications as string[]) ?? [];
    pendingReviewCount = ((empRoleRow as Record<string, unknown>).pending_review_count as number) ?? 0;
  } else {
    // ── 3. Fallback: firm principals (Ram, Sangeeta) auto-promote to Admin ──
    // The Trustner founders sit at the top of the approval matrix and
    // should never be locked out of their own workbenches. If they don't
    // have an explicit pd_employee_roles row yet, synthesize an Admin role
    // from the pd_roles table (level 5, all permissions).
    const emailLc = (emp.email as string).toLowerCase();
    if (APPROVER_EMAILS.includes(emailLc)) {
      const { data: adminRole } = await supabase
        .from('pd_roles')
        .select(
          'id, name, level, can_upload, can_edit_draft, can_review, can_approve, can_publish, can_override_hierarchy, can_manage_users, approval_aum_ceiling_inr'
        )
        .eq('name', 'admin')
        .maybeSingle();
      if (adminRole) {
        roleRow = adminRole as Record<string, unknown>;
        certifications = ['CFP'];
      }
    }
  }

  if (!roleRow) return null;

  const role: Role = {
    id: String(roleRow.id),
    name: roleRow.name as RoleName,
    level: roleRow.level as 1 | 2 | 3 | 4 | 5,
    canUpload: Boolean(roleRow.can_upload),
    canEditDraft: Boolean(roleRow.can_edit_draft),
    canReview: Boolean(roleRow.can_review),
    canApprove: Boolean(roleRow.can_approve),
    canPublish: Boolean(roleRow.can_publish),
    canOverrideHierarchy: Boolean(roleRow.can_override_hierarchy),
    canManageUsers: Boolean(roleRow.can_manage_users),
    approvalAumCeilingInr: roleRow.approval_aum_ceiling_inr as number | null,
  };

  return {
    id: emp.id as number,
    employeeCode: emp.employee_code as string,
    name: emp.name as string,
    email: emp.email as string,
    managerId: emp.reporting_manager_id as number | undefined,
    role,
    certifications,
    pendingReviewCount,
  };
}
