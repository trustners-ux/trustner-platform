/**
 * Admin Roles API
 *
 * GET  /api/admin/roles         → list all roles + permission flags + scope
 * PATCH /api/admin/roles/[id]   → edit a role's permission flags / scope / aum ceiling
 *
 * Returns the role-permission grid that powers /admin/roles UI and
 * /admin/permission-matrix.
 *
 * Auth: principals OR can_manage_users.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

export interface RoleRow {
  id: number;
  name: string;
  level: number;
  // Workflow permissions
  canUpload: boolean;
  canEditDraft: boolean;
  canReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
  canOverrideHierarchy: boolean;
  canManageUsers: boolean;
  // Cross-agent creation permissions
  canCreateMeetingBrief: boolean;
  canCreateProposal: boolean;
  canCreateOrientation: boolean;
  canCreatePeriodicReview: boolean;
  // Sensitive data
  canViewPii: boolean;
  canExport: boolean;
  // Scope + caps
  visibilityScope: 'own' | 'direct_reports' | 'subtree' | 'firm';
  approvalAumCeilingInr: number | null;
}

export async function GET() {
  const ok = await authorize();
  if (!ok.allowed) return NextResponse.json({ error: ok.reason }, { status: ok.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const { data } = await supabase
    .from('pd_roles')
    .select(
      `id, name, level,
       can_upload, can_edit_draft, can_review, can_approve, can_publish,
       can_override_hierarchy, can_manage_users,
       can_create_meeting_brief, can_create_proposal,
       can_create_orientation, can_create_periodic_review,
       can_view_pii, can_export,
       visibility_scope, approval_aum_ceiling_inr`
    )
    .order('level', { ascending: true });

  const roles: RoleRow[] = (data ?? []).map((r) => ({
    id: r.id as number,
    name: r.name as string,
    level: r.level as number,
    canUpload: Boolean(r.can_upload),
    canEditDraft: Boolean(r.can_edit_draft),
    canReview: Boolean(r.can_review),
    canApprove: Boolean(r.can_approve),
    canPublish: Boolean(r.can_publish),
    canOverrideHierarchy: Boolean(r.can_override_hierarchy),
    canManageUsers: Boolean(r.can_manage_users),
    canCreateMeetingBrief: Boolean(r.can_create_meeting_brief),
    canCreateProposal: Boolean(r.can_create_proposal),
    canCreateOrientation: Boolean(r.can_create_orientation),
    canCreatePeriodicReview: Boolean(r.can_create_periodic_review),
    canViewPii: Boolean(r.can_view_pii),
    canExport: Boolean(r.can_export),
    visibilityScope: ((r.visibility_scope as string) ?? 'own') as RoleRow['visibilityScope'],
    approvalAumCeilingInr: (r.approval_aum_ceiling_inr as number | null) ?? null,
  }));

  return NextResponse.json({ roles });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function authorize(): Promise<{ allowed: true } | { allowed: false; status: number; reason: string }> {
  const cookieStore = await cookies();
  let email: string | null = null;
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p?.email) email = p.email;
  }
  if (!email) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const p = await verifyEmployeeToken(empToken);
      if (p?.email) email = p.email;
    }
  }
  if (!email) return { allowed: false, status: 401, reason: 'Not authenticated' };

  if (APPROVER_EMAILS.includes(email.toLowerCase())) return { allowed: true };

  const supabase = getSupabaseAdmin();
  if (!supabase) return { allowed: false, status: 500, reason: 'Database unavailable' };
  const { data: empRow } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();
  if (!empRow?.id) return { allowed: false, status: 403, reason: 'Employee row not found' };
  const { data: roleRow } = await supabase
    .from('pd_employee_roles')
    .select('role:pd_roles!inner(can_manage_users)')
    .eq('employee_id', empRow.id)
    .eq('is_active', true)
    .maybeSingle();
  const role = (roleRow as { role?: unknown })?.role;
  const r = Array.isArray(role) ? role[0] : role;
  if (!Boolean((r as { can_manage_users?: boolean } | undefined)?.can_manage_users)) {
    return { allowed: false, status: 403, reason: 'Need can_manage_users' };
  }
  return { allowed: true };
}
