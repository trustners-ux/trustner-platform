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
import { randomBytes } from 'crypto';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import {
  sendClientShareEmail,
  DELIVERABLE_OPTIONS,
  type DeliverableId,
} from '@/lib/portfolio-diagnostic/send-client-share-email';

// Tokens expire 90 days from issue. Long enough for a slow-to-respond
// client to still open the report; short enough that abandoned links
// can't be reused indefinitely.
const TOKEN_TTL_DAYS = 90;

function mintToken(): string {
  // 32 url-safe chars: 24 random bytes → base64url → 32 chars
  return randomBytes(24).toString('base64url');
}

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

  // Mint a fresh signed token PER deliverable so clients (who have no
  // employee/admin session) can open the share-email links. Each token
  // is bound to its (diagnostic, deliverable) pair, expires in 90 days,
  // and is revocable by setting revoked_at.
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const tokenByDeliverable: Record<string, string> = {};
  const linkRowsToInsert = deliverableIds.map((dId) => {
    const tok = mintToken();
    tokenByDeliverable[dId] = tok;
    return {
      diagnostic_run_id: parseInt(id, 10),
      deliverable_id: dId,
      token: tok,
      created_by_employee_id: actorId,
      expires_at: expiresAt,
      recipient_emails: validRecipients,
    };
  });

  // Insert all token rows first — if this fails, abort before sending
  // any email (so we don't leak dead links to clients).
  const { error: tokenErr } = await supabase
    .from('pd_share_links')
    .insert(linkRowsToInsert);
  if (tokenErr) {
    return NextResponse.json(
      {
        error: `Could not mint share tokens: ${tokenErr.message}. Has migration 011_pd_share_links.sql been applied?`,
      },
      { status: 500 }
    );
  }

  // Send via Resend
  const sendResult = await sendClientShareEmail({
    diagnosticRunId: parseInt(id, 10),
    deliverableIds,
    deliverableTokens: tokenByDeliverable,
    recipientEmails: validRecipients,
    ccEmails: validCcs,
    subject: body.subject,
    customMessage: body.message,
    includeKpiSnapshot: body.includeKpiSnapshot,
    sentByName: (actor?.name as string) ?? 'Trustner',
    sentByEmail: (actor?.email as string) ?? 'wecare@merasip.com',
  });

  if (!sendResult.success) {
    // Roll back the share-link rows so a failed send doesn't leave
    // orphan tokens around.
    await supabase
      .from('pd_share_links')
      .delete()
      .in('token', Object.values(tokenByDeliverable));
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
    expiresAt,
  };

  const { data: eventRow } = await supabase
    .from('pd_workflow_events')
    .insert({
      diagnostic_run_id: parseInt(id, 10),
      actor_employee_id: actorId,
      actor_role: 'admin',     // any planner can share; not gated by approve/publish role
      action: 'SHARE_WITH_CLIENT',
      from_status: run.status,
      to_status: run.status,   // no status transition
      comment: JSON.stringify(auditPayload),
    })
    .select('id')
    .single();

  // Backfill the share_event_id on the token rows so we can join them
  if (eventRow?.id) {
    await supabase
      .from('pd_share_links')
      .update({ share_event_id: eventRow.id })
      .in('token', Object.values(tokenByDeliverable));
  }

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

  // Also pull per-share-event token engagement (opens / first-opened)
  const eventIds = (events ?? []).map((e) => (e as { id: number }).id);
  const tokenRowsByEvent = new Map<
    number,
    Array<{ deliverableId: string; openCount: number; firstOpenedAt: string | null; lastOpenedAt: string | null; expiresAt: string; revokedAt: string | null }>
  >();
  if (eventIds.length > 0) {
    const { data: tokenRows } = await supabase
      .from('pd_share_links')
      .select('share_event_id, deliverable_id, open_count, first_opened_at, last_opened_at, expires_at, revoked_at')
      .in('share_event_id', eventIds);
    for (const t of tokenRows ?? []) {
      const eid = t.share_event_id as number;
      const arr = tokenRowsByEvent.get(eid) ?? [];
      arr.push({
        deliverableId: t.deliverable_id as string,
        openCount: (t.open_count as number) ?? 0,
        firstOpenedAt: (t.first_opened_at as string | null) ?? null,
        lastOpenedAt: (t.last_opened_at as string | null) ?? null,
        expiresAt: t.expires_at as string,
        revokedAt: (t.revoked_at as string | null) ?? null,
      });
      tokenRowsByEvent.set(eid, arr);
    }
  }

  const shares = (events ?? []).map((e) => {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse((e as { comment?: string }).comment ?? '{}');
    } catch {
      payload = {};
    }
    const actorObj = (e as { actor?: unknown }).actor;
    const actor = Array.isArray(actorObj) ? actorObj[0] : actorObj;
    const eventId = (e as { id: number }).id;
    const tokens = tokenRowsByEvent.get(eventId) ?? [];
    const totalOpens = tokens.reduce((sum, t) => sum + t.openCount, 0);
    const openedDeliverables = tokens.filter((t) => t.openCount > 0).map((t) => t.deliverableId);
    return {
      id: eventId,
      createdAt: (e as { created_at: string }).created_at,
      actorName: (actor as { name?: string } | undefined)?.name ?? '—',
      actorEmail: (actor as { email?: string } | undefined)?.email ?? '',
      deliverables: (payload.deliverables as string[]) ?? [],
      recipients: (payload.recipients as string[]) ?? [],
      ccs: (payload.ccs as string[]) ?? [],
      hadCustomMessage: Boolean(payload.hadCustomMessage),
      engagement: {
        totalOpens,
        openedDeliverables,
        deliverables: tokens.map((t) => ({
          id: t.deliverableId,
          opens: t.openCount,
          firstOpenedAt: t.firstOpenedAt,
          lastOpenedAt: t.lastOpenedAt,
          expiresAt: t.expiresAt,
          revoked: Boolean(t.revokedAt),
        })),
      },
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
