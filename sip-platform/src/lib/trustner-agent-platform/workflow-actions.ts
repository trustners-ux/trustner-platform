/**
 * Generic workflow-action handler used by ALL 5 agents.
 *
 * Each agent route under /api/admin/{agent}/[id]/[action]/route.ts
 * is a thin wrapper that delegates to handleWorkflowAction() with the
 * table name + workflow event metadata. This keeps the state machine
 * identical across agents and routes audit events through pd_workflow_events.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';

export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'ARCHIVED';

export type WorkflowAction =
  | 'SUBMIT'
  | 'APPROVE'
  | 'REQUEST_CHANGES'
  | 'REJECT'
  | 'PUBLISH'
  | 'ESCALATE';

interface ActionDef {
  action: WorkflowAction;
  from: WorkflowStatus[];
  to: WorkflowStatus;
  requiresComment?: boolean;
  /** Permission key on pd_roles required to perform this action */
  permission: 'canEditDraft' | 'canReview' | 'canApprove' | 'canPublish';
}

const ACTION_MAP: Record<string, ActionDef> = {
  submit: {
    action: 'SUBMIT',
    // After SUBMIT, transition straight to IN_REVIEW so the item appears
    // in reviewer queues (queue filter on current_reviewer OR unassigned).
    from: ['DRAFT', 'CHANGES_REQUESTED'],
    to: 'IN_REVIEW',
    permission: 'canEditDraft',
  },
  approve: {
    action: 'APPROVE',
    from: ['IN_REVIEW', 'ESCALATED', 'SUBMITTED'],
    to: 'APPROVED',
    permission: 'canApprove',
  },
  'request-changes': {
    action: 'REQUEST_CHANGES',
    from: ['IN_REVIEW', 'ESCALATED', 'SUBMITTED'],
    to: 'CHANGES_REQUESTED',
    requiresComment: true,
    permission: 'canReview',
  },
  reject: {
    action: 'REJECT',
    from: ['SUBMITTED', 'IN_REVIEW', 'ESCALATED'],
    to: 'REJECTED',
    requiresComment: true,
    permission: 'canApprove',
  },
  publish: {
    action: 'PUBLISH',
    from: ['APPROVED'],
    to: 'PUBLISHED',
    permission: 'canPublish',
  },
  escalate: {
    action: 'ESCALATE',
    from: ['IN_REVIEW', 'SUBMITTED'],
    to: 'ESCALATED',
    permission: 'canReview',
  },
};

interface RolePermissions {
  name: string;                 // e.g. 'admin', 'senior_reviewer'
  canEditDraft: boolean;
  canReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
}

interface HandleWorkflowOptions {
  /** Supabase table holding the agent rows (e.g. 'ip_investment_proposals') */
  table: string;
  /** Agent name for audit events (e.g. 'investment_proposal') */
  agentName: string;
  /** Payload from the POST request */
  request: NextRequest;
  /** URL params */
  params: { id: string; action: string };
}

export async function handleWorkflowAction(opts: HandleWorkflowOptions) {
  const { table, agentName, request, params } = opts;
  const { id, action: actionSlug } = params;

  const def = ACTION_MAP[actionSlug];
  if (!def) {
    return NextResponse.json(
      { error: `Unknown action: ${actionSlug}` },
      { status: 400 }
    );
  }

  // ── Auth ──
  const email = await resolveEmployeeEmail();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // ── Resolve actor + role ──
  const { data: emp } = await supabase
    .from('employees')
    .select('id, name')
    .ilike('email', email.trim())
    .maybeSingle();
  const actorEmployeeId = emp?.id as number | undefined;
  const actorName = (emp?.name as string | undefined) ?? email;
  const isApprover = APPROVER_EMAILS.includes(email.trim().toLowerCase());

  if (!actorEmployeeId && !isApprover) {
    return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });
  }

  const role = await resolveRolePermissions(actorEmployeeId, isApprover);
  if (!role) {
    return NextResponse.json({ error: 'No workbench role assigned' }, { status: 403 });
  }

  if (!role[def.permission]) {
    return NextResponse.json(
      { error: `Your role lacks permission to ${def.action.toLowerCase()}` },
      { status: 403 }
    );
  }

  // ── Body ──
  const body = (await request.json().catch(() => ({}))) as { comment?: string };
  if (def.requiresComment && (!body.comment || body.comment.trim().length === 0)) {
    return NextResponse.json(
      { error: 'This action requires a comment' },
      { status: 400 }
    );
  }

  // ── Load current row ──
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const { data: row, error: rowErr } = await supabase
    .from(table)
    .select('id, status, family_id, family_name, current_reviewer_employee_id')
    .eq('id', numericId)
    .maybeSingle();
  if (rowErr || !row) {
    return NextResponse.json({ error: 'Row not found' }, { status: 404 });
  }

  const currentStatus = row.status as WorkflowStatus;
  if (!def.from.includes(currentStatus)) {
    return NextResponse.json(
      {
        error: `Cannot ${def.action.toLowerCase()} from status ${currentStatus}`,
        allowedFrom: def.from,
      },
      { status: 409 }
    );
  }

  // ── Perform transition ──
  const updatePayload: Record<string, unknown> = {
    status: def.to,
    updated_at: new Date().toISOString(),
  };

  // Reviewer routing: when the actor reviews/approves an unassigned
  // item, claim it for them so the audit trail records who acted.
  // (For SUBMITTED → IN_REVIEW transitions, current_reviewer stays null
  // so the item appears in every reviewer's open pool — the dashboard
  // queue filter includes null-reviewer rows.)
  if (
    (def.action === 'APPROVE' || def.action === 'REQUEST_CHANGES' || def.action === 'REJECT' || def.action === 'ESCALATE') &&
    actorEmployeeId &&
    !row.current_reviewer_employee_id
  ) {
    updatePayload.current_reviewer_employee_id = actorEmployeeId;
  }

  if (def.action === 'APPROVE') {
    updatePayload.approved_by_employee_id = actorEmployeeId ?? null;
    updatePayload.approved_at = new Date().toISOString();
  }
  if (def.action === 'PUBLISH') {
    updatePayload.published_at = new Date().toISOString();
  }

  const { error: updateErr } = await supabase
    .from(table)
    .update(updatePayload)
    .eq('id', numericId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // ── Audit event (resilient — must never break the workflow) ──
  await writeAuditEvent({
    entityType: agentName,
    entityId: numericId,
    fromStatus: currentStatus,
    toStatus: def.to,
    action: def.action,
    actorEmployeeId: actorEmployeeId ?? null,
    actorName,
    actorEmail: email,
    actorRole: roleName(role),
    comment: body.comment ?? null,
  });

  return NextResponse.json({
    success: true,
    newStatus: def.to,
    id: numericId,
  });
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p) return p.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const p = await verifyEmployeeToken(empToken);
    if (p) return p.email;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
// AUDIT EVENT WRITER (resilient — never throws)
// ─────────────────────────────────────────────────────────────────
//
// Writes to the generic agent_workflow_events table (migration 010).
// If that table doesn't exist yet (migration pending), falls back to
// console.error and continues — the workflow transition still succeeds.
//
// Once migration 010 is applied via Supabase SQL editor, audit writes
// start working immediately with no code change.
// ─────────────────────────────────────────────────────────────────

export interface AuditEventPayload {
  entityType: string;
  entityId: number;
  fromStatus: string | null;
  toStatus: string;
  action: string;
  actorEmployeeId: number | null;
  actorName: string;
  actorEmail: string;
  actorRole?: string | null;
  comment?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function writeAuditEvent(p: AuditEventPayload): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('[audit] No Supabase client available for audit write:', p);
    return;
  }
  try {
    const { error } = await supabase.from('agent_workflow_events').insert({
      entity_type: p.entityType,
      entity_id: p.entityId,
      from_status: p.fromStatus,
      to_status: p.toStatus,
      action: p.action,
      actor_employee_id: p.actorEmployeeId,
      actor_name: p.actorName,
      actor_email: p.actorEmail,
      actor_role: p.actorRole ?? null,
      comment: p.comment ?? null,
      metadata: p.metadata ?? null,
    });
    if (error) {
      // Most likely cause in production today: agent_workflow_events
      // table not yet created (migration 010 pending). Log loudly so
      // Ram sees it in Vercel runtime logs.
      console.error(
        `[audit] Failed to insert agent_workflow_events for ${p.entityType}#${p.entityId} action=${p.action}: ${error.message}. ` +
        `If error mentions "relation does not exist", apply migration 010 via Supabase SQL editor.`
      );
    }
  } catch (e) {
    // Defensive — never throw out of audit
    console.error('[audit] Unexpected audit write error:', e);
  }
}

function roleName(role: RolePermissions | null): string | null {
  return role?.name ?? null;
}

async function resolveRolePermissions(
  employeeId: number | undefined,
  isApprover: boolean
): Promise<RolePermissions | null> {
  if (isApprover) {
    return {
      name: 'admin',
      canEditDraft: true,
      canReview: true,
      canApprove: true,
      canPublish: true,
    };
  }
  if (!employeeId) return null;

  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from('pd_employee_roles')
    .select(
      'pd_role:pd_roles!inner(name, can_edit_draft, can_review, can_approve, can_publish)'
    )
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) return null;
  const raw = (data as Record<string, unknown>).pd_role;
  const r = Array.isArray(raw)
    ? (raw[0] as Record<string, unknown>)
    : (raw as Record<string, unknown>);
  if (!r) return null;
  return {
    name: (r.name as string) ?? 'unknown',
    canEditDraft: Boolean(r.can_edit_draft),
    canReview: Boolean(r.can_review),
    canApprove: Boolean(r.can_approve),
    canPublish: Boolean(r.can_publish),
  };
}
