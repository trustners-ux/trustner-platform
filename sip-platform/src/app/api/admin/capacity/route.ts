/**
 * Team Capacity Aggregation API
 *
 * GET /api/admin/capacity
 *
 * Returns per-employee workload:
 *   - drafts in flight (uploaded but not yet approved)
 *   - reviews currently in their queue (status IN_REVIEW / ESCALATED, assigned)
 *   - completed actions in last 7 days
 *   - AUM under their book (sum of currently-published diagnostics they uploaded)
 *
 * Used by /admin/capacity to spot bottlenecks ("Sangeeta has 12 reviews in
 * her queue, Ram has 0 — reassign").
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

export async function GET() {
  const authz = await authorize();
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: authz.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  // ── Pull active employees with their PD role (if any) ──
  const { data: employees } = await supabase
    .from('employees')
    .select(
      `id, employee_code, name, email, designation, level_code, entity, is_active`
    )
    .eq('is_active', true)
    .order('level_code', { ascending: true });

  if (!employees) return NextResponse.json({ rows: [] });

  const empIds = employees.map((e) => e.id as number);

  // ── Pull all PD employee roles for context ──
  const { data: empRoles } = await supabase
    .from('pd_employee_roles')
    .select('employee_id, pending_review_count, role:pd_roles!inner(name, level, can_review, can_approve)')
    .in('employee_id', empIds)
    .eq('is_active', true);

  const roleByEmp = new Map<number, { name: string; level: number; canReview: boolean; canApprove: boolean; queueHint: number }>();
  for (const er of empRoles ?? []) {
    const role = (er as { role?: unknown }).role;
    const r = Array.isArray(role) ? role[0] : role;
    if (!r) continue;
    roleByEmp.set(er.employee_id as number, {
      name: (r as { name?: string }).name ?? '',
      level: ((r as { level?: number }).level as number) ?? 0,
      canReview: Boolean((r as { can_review?: boolean }).can_review),
      canApprove: Boolean((r as { can_approve?: boolean }).can_approve),
      queueHint: ((er as { pending_review_count?: number }).pending_review_count as number) ?? 0,
    });
  }

  // ── Per-employee in-flight workload ──
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [drafts, reviews, recentEvents, publishedRuns] = await Promise.all([
    supabase
      .from('pd_diagnostic_runs')
      .select('uploaded_by_employee_id')
      .in('status', ['DRAFT', 'CHANGES_REQUESTED', 'SUBMITTED'])
      .in('uploaded_by_employee_id', empIds),
    supabase
      .from('pd_diagnostic_runs')
      .select('current_reviewer_employee_id, status, created_at')
      .in('status', ['IN_REVIEW', 'ESCALATED'])
      .in('current_reviewer_employee_id', empIds),
    supabase
      .from('pd_workflow_events')
      .select('actor_employee_id, action, created_at')
      .gte('created_at', sevenDaysAgo)
      .in('actor_employee_id', empIds),
    supabase
      .from('pd_diagnostic_runs')
      .select('uploaded_by_employee_id, current_value_inr')
      .eq('status', 'PUBLISHED')
      .in('uploaded_by_employee_id', empIds),
  ]);

  const draftsBy = new Map<number, number>();
  for (const r of drafts.data ?? []) {
    const id = r.uploaded_by_employee_id as number;
    draftsBy.set(id, (draftsBy.get(id) ?? 0) + 1);
  }

  const reviewsBy = new Map<number, { total: number; oldestCreatedAt: string | null }>();
  for (const r of reviews.data ?? []) {
    const id = r.current_reviewer_employee_id as number;
    const cur = reviewsBy.get(id) ?? { total: 0, oldestCreatedAt: null };
    cur.total += 1;
    const ts = r.created_at as string;
    if (!cur.oldestCreatedAt || new Date(ts).getTime() < new Date(cur.oldestCreatedAt).getTime()) {
      cur.oldestCreatedAt = ts;
    }
    reviewsBy.set(id, cur);
  }

  const eventsBy = new Map<number, { total: number; lastAt: string | null }>();
  for (const e of recentEvents.data ?? []) {
    const id = e.actor_employee_id as number;
    const cur = eventsBy.get(id) ?? { total: 0, lastAt: null };
    cur.total += 1;
    const ts = e.created_at as string;
    if (!cur.lastAt || new Date(ts).getTime() > new Date(cur.lastAt).getTime()) cur.lastAt = ts;
    eventsBy.set(id, cur);
  }

  const aumBy = new Map<number, number>();
  for (const r of publishedRuns.data ?? []) {
    const id = r.uploaded_by_employee_id as number;
    aumBy.set(id, (aumBy.get(id) ?? 0) + (Number(r.current_value_inr) || 0));
  }

  // Build rows — exclude employees without a PD role since they have
  // no workload on this dimension
  const rows = employees
    .filter((e) => roleByEmp.has(e.id as number))
    .map((e) => {
      const id = e.id as number;
      const role = roleByEmp.get(id)!;
      const rv = reviewsBy.get(id);
      const ev = eventsBy.get(id);
      const oldestAgeHours = rv?.oldestCreatedAt
        ? (Date.now() - new Date(rv.oldestCreatedAt).getTime()) / (1000 * 60 * 60)
        : null;
      return {
        id,
        name: e.name as string,
        employeeCode: e.employee_code as string,
        designation: (e.designation as string) ?? '',
        levelCode: (e.level_code as string) ?? '',
        entity: (e.entity as string) ?? '',
        pdRole: role.name,
        pdLevel: role.level,
        canReview: role.canReview,
        canApprove: role.canApprove,
        draftsInFlight: draftsBy.get(id) ?? 0,
        reviewsInQueue: rv?.total ?? 0,
        oldestReviewAgeHours: oldestAgeHours,
        activitiesLast7d: ev?.total ?? 0,
        lastActivityAt: ev?.lastAt ?? null,
        aumUnderBookInr: aumBy.get(id) ?? 0,
      };
    });

  // Sort: highest review queue first (the bottlenecks)
  rows.sort((a, b) => b.reviewsInQueue - a.reviewsInQueue || b.draftsInFlight - a.draftsInFlight);

  return NextResponse.json({ rows });
}

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
