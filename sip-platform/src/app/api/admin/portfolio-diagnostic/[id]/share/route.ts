/**
 * Portfolio Diagnostic — Selective Client Share
 *
 * POST /api/admin/portfolio-diagnostic/[id]/share
 *
 * Planner picks which deliverables (1-6 of: one-pager, full, three-pager,
 * action, xlsx, pptx), specifies recipients, optional subject + custom
 * message, and sends. Only callable when diagnostic is APPROVED or
 * PUBLISHED. Every share is logged to pd_workflow_events for audit.
 *
 * GET /api/admin/portfolio-diagnostic/[id]/share
 * Returns history of past shares (for the timeline UI on the review page).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  sendClientShareEmail,
  DELIVERABLE_OPTIONS,
  type DeliverableId,
} from '@/lib/portfolio-diagnostic/send-client-share-email';

const VALID_DELIVERABLE_IDS = new Set(DELIVERABLE_OPTIONS.map((d) => d.id));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ShareBody {
  deliverableIds: string[];
  recipientEmails: string[];
  ccEmails?: string[];
  subject?: string;
  message?: string;
  includeKpiSnapshot?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// POST — send a selective share
// ─────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const employeeEmail = await resolveEmployeeEmail();
  if (!employeeEmail) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Resolve actor
  const { data: actor } = await supabase
    .from('employees')
    .select('id, name, email')
    .ilike('email', employeeEmail.trim())
    .maybeSingle();
  const actorId = actor?.id as number | undefined;
  if (!actorId) {
    return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });
  }

  // Parse + validate body
  let body: ShareBody;
  try {
    body = (await request.json()) as ShareBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.deliverableIds) || body.deliverableIds.length === 0) {
    return NextResponse.json(
      { error: 'Select at least one deliverable to share' },
      { status: 400 }
    );
  }
  const deliverableIds = body.deliverableIds.filter((d): d is DeliverableId =>
    VALID_DELIVERABLE_IDS.has(d as DeliverableId)
  );
  if (deliverableIds.length === 0) {
    return NextResponse.json(
      { error: 'No valid deliverable IDs in selection' },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.recipientEmails) || body.recipientEmails.length === 0) {
    return NextResponse.json(
      { error: 'At least one recipient email is required' },
      { status: 400 }
    );
  }
  const validRecipients = body.recipientEmails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => EMAIL_RE.test(e));
  if (validRecipients.length === 0) {
    return NextResponse.json(
      { error: 'No valid recipient email addresses' },
      { status: 400 }
    );
  }
  const validCcs = (body.ccEmails ?? [])
    .map((e) => e.trim().toLowerCase())
    .filter((e) => EMAIL_RE.test(e));

  // Load the diagnostic to verify share eligibility
  const { data: run, error: runErr } = await supabase
    .from('pd_diagnostic_runs')
    .select('id, status, family_id, family_name')
    .eq('id', parseInt(id, 10))
    .single();
  if (runErr || !run) {
    return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
  }

  if (!['APPROVED', 'PUBLISHED'].includes(run.status as string)) {
    return NextResponse.json(
      {
        error: `Cannot share — diagnostic is in ${run.status}. Must be APPROVED or PUBLISHED.`,
      },
      { status: 400 }
    );
  }

  // Send via Resend
  const sendResult = await sendClientShareEmail({
    diagnosticRunId: parseInt(id, 10),
    deliverableIds,
    recipientEmails: validRecipients,
    ccEmails: validCcs,
    subject: body.subject,
    customMessage: body.message,
    includeKpiSnapshot: body.includeKpiSnapshot,
    sentByName: (actor?.name as string) ?? 'Trustner',
    sentByEmail: (actor?.email as string) ?? 'wecare@merasip.com',
  });

  if (!sendResult.success) {
    return NextResponse.json(
      {
        error: sendResult.error ?? 'Send failed',
        skipped: sendResult.skipped,
      },
      { status: sendResult.skipped ? 503 : 502 }
    );
  }

  // Audit log — store the selection + recipients in the comment column
  // (JSON encoded so we can render the timeline later)
  const auditPayload = {
    deliverables: deliverableIds,
    recipients: validRecipients,
    ccs: validCcs,
    subject: body.subject || null,
    hadCustomMessage: Boolean(body.message?.trim()),
    emailId: sendResult.emailId || null,
  };

  await supabase.from('pd_workflow_events').insert({
    diagnostic_run_id: parseInt(id, 10),
    actor_employee_id: actorId,
    actor_role: 'admin',     // any planner can share; not gated by approve/publish role
    action: 'SHARE_WITH_CLIENT',
    from_status: run.status,
    to_status: run.status,   // no status transition
    comment: JSON.stringify(auditPayload),
  });

  return NextResponse.json({
    success: true,
    sentTo: sendResult.sentTo,
    emailId: sendResult.emailId,
    deliverables: deliverableIds,
  });
}

// ─────────────────────────────────────────────────────────────────
// GET — history of past shares (for review-page timeline)
// ─────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const employeeEmail = await resolveEmployeeEmail();
  if (!employeeEmail) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const { data: events } = await supabase
    .from('pd_workflow_events')
    .select(
      `
      id, created_at, comment,
      actor:employees!pd_workflow_events_actor_employee_id_fkey(name, email)
    `
    )
    .eq('diagnostic_run_id', parseInt(id, 10))
    .eq('action', 'SHARE_WITH_CLIENT')
    .order('created_at', { ascending: false });

  const shares = (events ?? []).map((e) => {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse((e as { comment?: string }).comment ?? '{}');
    } catch {
      payload = {};
    }
    const actorObj = (e as { actor?: unknown }).actor;
    const actor = Array.isArray(actorObj) ? actorObj[0] : actorObj;
    return {
      id: (e as { id: number }).id,
      createdAt: (e as { created_at: string }).created_at,
      actorName: (actor as { name?: string } | undefined)?.name ?? '—',
      actorEmail: (actor as { email?: string } | undefined)?.email ?? '',
      deliverables: (payload.deliverables as string[]) ?? [],
      recipients: (payload.recipients as string[]) ?? [],
      ccs: (payload.ccs as string[]) ?? [],
      hadCustomMessage: Boolean(payload.hadCustomMessage),
    };
  });

  return NextResponse.json({ shares });
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
