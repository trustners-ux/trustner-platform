/**
 * Employee Performance Aggregations
 *
 * GET /api/admin/employees/[id]/performance
 *
 * Returns KPIs + activity feed for one employee:
 *   - Diagnostics: drafts created, status breakdown, AUM under their book
 *   - Reviews: completed, avg turnaround hours, currently in queue
 *   - Publications: count, last published date
 *   - Shares: total client shares + last share date
 *   - Activity: last login, last action, current pending workload
 *
 * Auth: principals OR can_manage_users OR self (the employee themselves
 * can see their own dashboard).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetId = parseInt(id, 10);
  if (Number.isNaN(targetId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const authz = await authorize(targetId);
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: authz.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  // Employee identity
  const { data: emp } = await supabase
    .from('employees')
    .select('id, employee_code, name, email, designation, entity, level_code, doj, is_active')
    .eq('id', targetId)
    .maybeSingle();
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  // ── Diagnostics they UPLOADED ──
  const { data: uploaded } = await supabase
    .from('pd_diagnostic_runs')
    .select('id, status, created_at, published_at, current_value_inr, family_id, family_name')
    .eq('uploaded_by_employee_id', targetId);

  // ── Diagnostics they APPROVED ──
  const { data: approved } = await supabase
    .from('pd_diagnostic_runs')
    .select('id, status, approved_at, family_name, current_value_inr')
    .eq('approved_by_employee_id', targetId);

  // ── Drafts CURRENTLY assigned to them for review ──
  const { data: assignedReviews } = await supabase
    .from('pd_diagnostic_runs')
    .select('id, family_name, status, created_at')
    .eq('current_reviewer_employee_id', targetId)
    .in('status', ['IN_REVIEW', 'ESCALATED']);

  // ── Workflow events (for activity + turnaround) ──
  const { data: events } = await supabase
    .from('pd_workflow_events')
    .select('id, action, from_status, to_status, created_at, diagnostic_run_id')
    .eq('actor_employee_id', targetId)
    .order('created_at', { ascending: false })
    .limit(100);

  // ── Shares with client ──
  const shareEvents = (events ?? []).filter((e) => e.action === 'SHARE_WITH_CLIENT');

  // ── Aggregate KPIs ──
  const statusBreakdown: Record<string, number> = {};
  let totalAumUploaded = 0;
  for (const r of uploaded ?? []) {
    statusBreakdown[r.status as string] = (statusBreakdown[r.status as string] ?? 0) + 1;
    totalAumUploaded += Number(r.current_value_inr) || 0;
  }

  let approvedAum = 0;
  for (const r of approved ?? []) approvedAum += Number(r.current_value_inr) || 0;

  // Avg review turnaround: for each APPROVE / REJECT / REQUEST_CHANGES event,
  // find the matching SUBMIT/START_REVIEW for the same diagnostic and compute delta.
  // For simplicity, just compute the time between the assigned-to-them event
  // and the first decision event per diagnostic.
  let totalTurnaroundMs = 0;
  let turnaroundSampleCount = 0;
  const decisionActions = new Set(['APPROVE', 'REJECT', 'REQUEST_CHANGES']);
  const eventsByDiag = new Map<number, Array<{ action: string; created_at: string }>>();
  for (const e of events ?? []) {
    const rid = e.diagnostic_run_id as number;
    const arr = eventsByDiag.get(rid) ?? [];
    arr.push({ action: e.action as string, created_at: e.created_at as string });
    eventsByDiag.set(rid, arr);
  }
  for (const arr of eventsByDiag.values()) {
    arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const start = arr.find((e) => e.action === 'START_REVIEW');
    const decision = arr.find((e) => decisionActions.has(e.action));
    if (start && decision) {
      const delta = new Date(decision.created_at).getTime() - new Date(start.created_at).getTime();
      if (delta > 0) {
        totalTurnaroundMs += delta;
        turnaroundSampleCount += 1;
      }
    }
  }
  const avgTurnaroundHours = turnaroundSampleCount > 0
    ? totalTurnaroundMs / turnaroundSampleCount / (1000 * 60 * 60)
    : null;

  // Last activity
  const lastEvent = events && events.length > 0 ? events[0] : null;

  return NextResponse.json({
    employee: {
      id: emp.id,
      employeeCode: emp.employee_code,
      name: emp.name,
      email: emp.email,
      designation: emp.designation,
      entity: emp.entity,
      levelCode: emp.level_code,
      doj: emp.doj,
      isActive: emp.is_active,
    },
    diagnostics: {
      uploadedTotal: (uploaded ?? []).length,
      uploadedAumInr: totalAumUploaded,
      statusBreakdown,
      approvedTotal: (approved ?? []).length,
      approvedAumInr: approvedAum,
      currentlyAssignedForReview: (assignedReviews ?? []).map((r) => ({
        id: r.id, familyName: r.family_name, status: r.status, createdAt: r.created_at,
      })),
    },
    reviews: {
      avgTurnaroundHours,
      turnaroundSampleCount,
    },
    shares: {
      total: shareEvents.length,
      lastShareAt: shareEvents[0]?.created_at ?? null,
    },
    activity: {
      lastEventAt: lastEvent?.created_at ?? null,
      lastEventAction: lastEvent?.action ?? null,
      lastEventDiagId: lastEvent?.diagnostic_run_id ?? null,
      recentEvents: (events ?? []).slice(0, 20).map((e) => ({
        id: e.id,
        action: e.action,
        fromStatus: e.from_status,
        toStatus: e.to_status,
        createdAt: e.created_at,
        diagnosticId: e.diagnostic_run_id,
      })),
    },
  });
}

async function authorize(targetId: number): Promise<{ allowed: true } | { allowed: false; status: number; reason: string }> {
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

  // Self-view always allowed
  if ((empRow.id as number) === targetId) return { allowed: true };

  const { data: roleRow } = await supabase
    .from('pd_employee_roles')
    .select('role:pd_roles!inner(can_manage_users)')
    .eq('employee_id', empRow.id)
    .eq('is_active', true)
    .maybeSingle();
  const role = (roleRow as { role?: unknown })?.role;
  const r = Array.isArray(role) ? role[0] : role;
  if (!Boolean((r as { can_manage_users?: boolean } | undefined)?.can_manage_users)) {
    return { allowed: false, status: 403, reason: 'Need can_manage_users to view others' };
  }
  return { allowed: true };
}
