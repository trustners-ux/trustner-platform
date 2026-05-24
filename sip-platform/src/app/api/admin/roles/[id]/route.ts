/**
 * PATCH /api/admin/roles/[id]
 *
 * Update a role's permission flags / scope / aum ceiling. Every
 * change is destructive — no history kept here (the history that
 * matters is who held the role when, captured in app_role_assignments).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

interface PatchBody {
  canUpload?: boolean;
  canEditDraft?: boolean;
  canReview?: boolean;
  canApprove?: boolean;
  canPublish?: boolean;
  canOverrideHierarchy?: boolean;
  canManageUsers?: boolean;
  canCreateMeetingBrief?: boolean;
  canCreateProposal?: boolean;
  canCreateOrientation?: boolean;
  canCreatePeriodicReview?: boolean;
  canViewPii?: boolean;
  canExport?: boolean;
  visibilityScope?: 'own' | 'direct_reports' | 'subtree' | 'firm';
  approvalAumCeilingInr?: number | null;
}

const VALID_SCOPES = new Set(['own', 'direct_reports', 'subtree', 'firm']);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roleId = parseInt(id, 10);
  if (Number.isNaN(roleId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const authz = await authorize();
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: authz.status });

  const body = (await req.json().catch(() => ({}))) as PatchBody;
  if (body.visibilityScope && !VALID_SCOPES.has(body.visibilityScope)) {
    return NextResponse.json(
      { error: `visibilityScope must be one of: ${[...VALID_SCOPES].join(', ')}` },
      { status: 400 }
    );
  }

  // Map camelCase -> snake_case for the DB
  const update: Record<string, unknown> = {};
  const mapping: Record<keyof PatchBody, string> = {
    canUpload: 'can_upload',
    canEditDraft: 'can_edit_draft',
    canReview: 'can_review',
    canApprove: 'can_approve',
    canPublish: 'can_publish',
    canOverrideHierarchy: 'can_override_hierarchy',
    canManageUsers: 'can_manage_users',
    canCreateMeetingBrief: 'can_create_meeting_brief',
    canCreateProposal: 'can_create_proposal',
    canCreateOrientation: 'can_create_orientation',
    canCreatePeriodicReview: 'can_create_periodic_review',
    canViewPii: 'can_view_pii',
    canExport: 'can_export',
    visibilityScope: 'visibility_scope',
    approvalAumCeilingInr: 'approval_aum_ceiling_inr',
  };
  for (const [k, v] of Object.entries(body)) {
    const dbCol = mapping[k as keyof PatchBody];
    if (dbCol && v !== undefined) update[dbCol] = v;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const { error } = await supabase.from('pd_roles').update(update).eq('id', roleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

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
