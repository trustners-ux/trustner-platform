/**
 * Portfolio Diagnostic — Data Access Layer
 *
 * Database queries for the Trustner Portfolio Diagnostic Workbench.
 * Uses the existing Supabase client + admin pattern from /lib/db/.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
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
  employeeId: number
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

  const [drafts, awaiting, approved, published, total] = await Promise.all([
    // My drafts
    supabase
      .from('pd_diagnostic_runs')
      .select('id', { count: 'exact', head: true })
      .eq('uploaded_by_employee_id', employeeId)
      .in('status', ['DRAFT', 'CHANGES_REQUESTED']),

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
  limit = 20
): Promise<DiagnosticListItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('pd_diagnostic_runs')
    .select(DIAGNOSTIC_SELECT_COLS)
    .eq('uploaded_by_employee_id', employeeId)
    .in('status', ['DRAFT', 'CHANGES_REQUESTED'])
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

  const { data, error } = await supabase
    .from('employees')
    .select(`
      id,
      employee_code,
      name,
      email,
      reporting_manager_id,
      pd_employee_role:pd_employee_roles!inner(
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
      )
    `)
    .eq('id', employeeId)
    .single();

  if (error || !data) return null;

  // Supabase returns the joined relationship as a single object when
  // it's a 1:1 (UNIQUE constraint on employee_id), or as an array
  // when 1:N. We handle both shapes defensively.
  const rawEmpRole = data.pd_employee_role as unknown;
  const empRole =
    Array.isArray(rawEmpRole)
      ? (rawEmpRole[0] as Record<string, unknown> | undefined)
      : (rawEmpRole as Record<string, unknown> | undefined);
  if (!empRole) return null;

  const rawRole = empRole.pd_role as unknown;
  const roleRow =
    Array.isArray(rawRole)
      ? (rawRole[0] as Record<string, unknown>)
      : (rawRole as Record<string, unknown>);
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
    id: data.id as number,
    employeeCode: data.employee_code as string,
    name: data.name as string,
    email: data.email as string,
    managerId: data.reporting_manager_id as number | undefined,
    role,
    certifications: (empRole.certifications as string[]) ?? [],
    pendingReviewCount: (empRole.pending_review_count as number) ?? 0,
  };
}
