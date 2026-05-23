/**
 * Portfolio Diagnostic — Workflow Actions
 *
 * POST /api/admin/portfolio-diagnostic/[id]/[action]
 *   action ∈ { submit, approve, request-changes, reject, publish }
 *
 * Transitions the diagnostic via the workflow state machine,
 * logs an event, and (for PUBLISH) triggers PDF generation.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { WorkflowStatus, WorkflowAction } from '@/lib/portfolio-diagnostic/types';

interface ActionBody {
  comment?: string;
  assigneeEmployeeId?: number;
}

// Map URL slug → WorkflowAction enum + target status
const ACTION_MAP: Record<
  string,
  { action: WorkflowAction; from: WorkflowStatus[]; to: WorkflowStatus; requiresComment?: boolean }
> = {
  submit:            { action: 'SUBMIT',          from: ['DRAFT', 'CHANGES_REQUESTED'], to: 'SUBMITTED' },
  approve:           { action: 'APPROVE',         from: ['IN_REVIEW', 'ESCALATED', 'SUBMITTED'], to: 'APPROVED' },
  'request-changes': { action: 'REQUEST_CHANGES', from: ['IN_REVIEW', 'ESCALATED', 'SUBMITTED'], to: 'CHANGES_REQUESTED', requiresComment: true },
  reject:            { action: 'REJECT',          from: ['SUBMITTED', 'IN_REVIEW', 'ESCALATED'], to: 'REJECTED', requiresComment: true },
  publish:           { action: 'PUBLISH',         from: ['APPROVED'], to: 'PUBLISHED' },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { id, action: actionSlug } = await params;

  // Validate action
  const actionDef = ACTION_MAP[actionSlug];
  if (!actionDef) {
    return NextResponse.json({ error: `Unknown action: ${actionSlug}` }, { status: 400 });
  }

  // Auth
  const employeeEmail = await resolveEmployeeEmail();
  if (!employeeEmail) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Resolve actor's employees.id
  const { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('email', employeeEmail)
    .single();
  const actorEmployeeId = emp?.id as number | undefined;
  if (!actorEmployeeId) {
    return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });
  }

  // Get actor's PD role
  const { data: roleData } = await supabase
    .from('pd_employee_roles')
    .select('role:pd_roles(name, can_approve, can_publish, can_review, approval_aum_ceiling_inr)')
    .eq('employee_id', actorEmployeeId)
    .single();

  const role = extractRole(roleData?.role);
  if (!role) {
    return NextResponse.json({ error: 'No PD role assigned' }, { status: 403 });
  }

  // Parse body
  const body: ActionBody = await request.json().catch(() => ({}));
  if (actionDef.requiresComment && !body.comment) {
    return NextResponse.json(
      { error: 'This action requires a comment' },
      { status: 400 }
    );
  }

  // Load current diagnostic
  const { data: run, error: runErr } = await supabase
    .from('pd_diagnostic_runs')
    .select('id, status, family_id, family_name')
    .eq('id', parseInt(id, 10))
    .single();

  if (runErr || !run) {
    return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
  }

  const currentStatus = run.status as WorkflowStatus;

  // Check transition is valid
  if (!actionDef.from.includes(currentStatus)) {
    return NextResponse.json(
      { error: `Cannot ${actionSlug} from status ${currentStatus}` },
      { status: 400 }
    );
  }

  // Role permission check
  if (actionSlug === 'approve' && !role.can_approve) {
    return NextResponse.json({ error: 'Your role cannot approve' }, { status: 403 });
  }
  if (actionSlug === 'publish' && !role.can_publish) {
    return NextResponse.json({ error: 'Your role cannot publish' }, { status: 403 });
  }
  if ((actionSlug === 'request-changes' || actionSlug === 'reject') && !role.can_review) {
    return NextResponse.json({ error: 'Your role cannot review' }, { status: 403 });
  }

  // Build update
  const update: Record<string, unknown> = { status: actionDef.to };
  if (actionDef.to === 'APPROVED') {
    update.approved_by_employee_id = actorEmployeeId;
    update.approved_at = new Date().toISOString();
  }
  if (actionDef.to === 'PUBLISHED') {
    update.published_at = new Date().toISOString();
    // NOTE: actual PDF generation should happen in a worker / queue.
    // For MVP we just mark as PUBLISHED. Phase 3 will add the
    // generation pipeline.
  }
  if (actionDef.to === 'SUBMITTED') {
    // Auto-assign the next reviewer. Routing rules (in priority order):
    //   1. If uploader is L5 (admin) — self-assign (admin can also review)
    //   2. Find uploader's reporting manager who has canReview = true
    //   3. Find the lowest-level employee with canReview = true,
    //      preferring the one with smallest pending review queue
    const assigneeId = await pickReviewer({
      supabase,
      uploaderEmployeeId: actorEmployeeId,
      uploaderRoleName: role.name,
    });
    if (assigneeId) {
      update.current_reviewer_employee_id = assigneeId;
      // If we pick a reviewer, move directly to IN_REVIEW (skip the
      // SUBMITTED-with-no-reviewer limbo state)
      update.status = 'IN_REVIEW';
    }
  }

  const { error: updErr } = await supabase
    .from('pd_diagnostic_runs')
    .update(update)
    .eq('id', parseInt(id, 10));

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Log workflow event
  await supabase.from('pd_workflow_events').insert({
    diagnostic_run_id: parseInt(id, 10),
    actor_employee_id: actorEmployeeId,
    actor_role: role.name,
    action: actionDef.action,
    from_status: currentStatus,
    to_status: actionDef.to,
    comment: body.comment ?? null,
  });

  return NextResponse.json({
    success: true,
    diagnosticRunId: parseInt(id, 10),
    fromStatus: currentStatus,
    toStatus: actionDef.to,
    action: actionDef.action,
  });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return payload.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) return payload.email;
  }
  return null;
}

async function pickReviewer(input: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>;
  uploaderEmployeeId: number;
  uploaderRoleName: string;
}): Promise<number | null> {
  const { supabase, uploaderEmployeeId, uploaderRoleName } = input;

  // Rule 1: admin can self-assign
  if (uploaderRoleName === 'admin') return uploaderEmployeeId;

  // Get uploader's reporting manager
  const { data: uploader } = await supabase
    .from('employees')
    .select('reporting_manager_id')
    .eq('id', uploaderEmployeeId)
    .single();

  if (uploader?.reporting_manager_id) {
    // Check if manager has a PD role that can review
    const { data: mgrRole } = await supabase
      .from('pd_employee_roles')
      .select('employee_id, role:pd_roles(can_review)')
      .eq('employee_id', uploader.reporting_manager_id)
      .eq('is_active', true)
      .single();

    const canReview = extractCanReview(mgrRole?.role);
    if (canReview) return uploader.reporting_manager_id as number;
  }

  // Rule 3: fall back to lowest-level reviewer with smallest queue
  const { data: candidates } = await supabase
    .from('pd_employee_roles')
    .select('employee_id, pending_review_count, role:pd_roles!inner(name, level, can_review)')
    .eq('is_active', true)
    .neq('employee_id', uploaderEmployeeId)
    .order('pending_review_count', { ascending: true })
    .limit(20);

  if (candidates) {
    // Filter for reviewers, sort by (level ascending, pending_review_count ascending)
    const eligible = candidates
      .filter((c) => extractCanReview(c.role))
      .sort((a, b) => {
        const lvlA = extractRoleField(a.role, 'level') ?? 99;
        const lvlB = extractRoleField(b.role, 'level') ?? 99;
        if (lvlA !== lvlB) return lvlA - lvlB;
        return (a.pending_review_count ?? 0) - (b.pending_review_count ?? 0);
      });
    if (eligible.length > 0) return eligible[0].employee_id as number;
  }

  return null;
}

function extractCanReview(role: unknown): boolean {
  if (!role) return false;
  const r = Array.isArray(role) ? role[0] : role;
  if (!r || typeof r !== 'object') return false;
  return Boolean((r as Record<string, unknown>).can_review);
}

function extractRoleField(role: unknown, field: string): number | null {
  if (!role) return null;
  const r = Array.isArray(role) ? role[0] : role;
  if (!r || typeof r !== 'object') return null;
  const v = (r as Record<string, unknown>)[field];
  return typeof v === 'number' ? v : null;
}

function extractRole(role: unknown): {
  name: 'trainee' | 'junior_analyst' | 'mid_reviewer' | 'senior_reviewer' | 'admin';
  can_approve: boolean;
  can_publish: boolean;
  can_review: boolean;
  approval_aum_ceiling_inr: number | null;
} | null {
  if (!role) return null;
  const r = Array.isArray(role) ? role[0] : role;
  if (!r || typeof r !== 'object') return null;
  const obj = r as Record<string, unknown>;
  return {
    name: obj.name as 'trainee' | 'junior_analyst' | 'mid_reviewer' | 'senior_reviewer' | 'admin',
    can_approve: Boolean(obj.can_approve),
    can_publish: Boolean(obj.can_publish),
    can_review: Boolean(obj.can_review),
    approval_aum_ceiling_inr: obj.approval_aum_ceiling_inr as number | null,
  };
}
