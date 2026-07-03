/**
 * Advisory Workbench — client share links + email.
 *
 * Generalizes Portfolio Diagnostic's signed-share-link pattern
 * (pd_share_links + send-client-share-email.ts) across Periodic Review,
 * Client Orientation and Investment Proposal — each of which has exactly
 * ONE client deliverable (unlike PD's six), so no per-deliverable-type
 * column is needed; the link is keyed by (module, record_id).
 *
 * Closes the "preview-then-manually-print" gap: an RM can now email a
 * tracked, expiring, revocable link a client opens with no session.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { isAdvisoryRecordInScope, type AdvisoryTable } from '@/lib/advisory/visibility';
import { writeAuditEvent } from '@/lib/trustner-agent-platform/workflow-actions';

export type AdvisoryModule = 'periodic_review' | 'client_orientation' | 'investment_proposal';

export interface ModuleConfig {
  module: AdvisoryModule;
  table: AdvisoryTable;
  routeBase: string; // URL segment under /api/admin/
  docSegment: string; // 'note' | 'summary' | 'document'
  label: string; // human label for email subject/body
}

export const MODULES: Record<AdvisoryModule, ModuleConfig> = {
  periodic_review: {
    module: 'periodic_review',
    table: 'pr_periodic_reviews',
    routeBase: 'periodic-review',
    docSegment: 'note',
    label: 'Periodic Review',
  },
  client_orientation: {
    module: 'client_orientation',
    table: 'co_client_orientations',
    routeBase: 'client-orientation',
    docSegment: 'summary',
    label: 'Financial Orientation Summary',
  },
  investment_proposal: {
    module: 'investment_proposal',
    table: 'ip_investment_proposals',
    routeBase: 'investment-proposal',
    docSegment: 'document',
    label: 'Investment Proposal',
  },
};

const TOKEN_TTL_DAYS = 90;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merasip.com';
const FROM = 'Trustner Asset Services <reports@merasip.com>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mintToken(): string {
  return randomBytes(24).toString('base64url');
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br/>');
}

function dedupeEmails(arr: string[]): string[] {
  return arr
    .map((s) => s.trim().toLowerCase())
    .filter((s) => EMAIL_RE.test(s))
    .filter((s, i, a) => a.indexOf(s) === i);
}

export async function resolveEmployeeEmail(): Promise<string | null> {
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
// SEND
// ─────────────────────────────────────────────────────────────────

export interface ShareResult {
  success: boolean;
  error?: string;
  sentTo?: string[];
  emailId?: string;
  skipped?: boolean;
}

export async function shareAdvisoryDeliverable(
  sb: SupabaseClient,
  opts: {
    cfg: ModuleConfig;
    recordId: number;
    actorId: number;
    actorName: string;
    actorEmail: string;
    recipientEmails: string[];
    ccEmails?: string[];
    subject?: string;
    message?: string;
  }
): Promise<ShareResult> {
  const { data: rec } = await sb
    .from(opts.cfg.table)
    .select('family_name, status')
    .eq('id', opts.recordId)
    .maybeSingle();
  if (!rec) return { success: false, error: 'Record not found' };
  if (!['APPROVED', 'PUBLISHED'].includes(String(rec.status))) {
    return {
      success: false,
      error: `Cannot share — this ${opts.cfg.label} is ${rec.status}. It must be Approved or Published first.`,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, skipped: true, error: 'RESEND_API_KEY not configured' };

  const to = dedupeEmails(opts.recipientEmails);
  const cc = dedupeEmails(opts.ccEmails ?? []);
  if (to.length === 0) return { success: false, error: 'No valid recipient email(s)' };

  const token = mintToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error: tokErr } = await sb.from('advisory_share_links').insert({
    module: opts.cfg.module,
    record_id: opts.recordId,
    token,
    created_by_employee_id: opts.actorId,
    expires_at: expiresAt,
    recipient_emails: to,
  });
  if (tokErr) {
    return {
      success: false,
      error: `Could not mint share token: ${tokErr.message}. Has migration 054_advisory_share_links.sql been applied?`,
    };
  }

  const url = `${SITE_URL}/api/admin/${opts.cfg.routeBase}/${opts.recordId}/${opts.cfg.docSegment}?token=${encodeURIComponent(token)}`;
  const subject = opts.subject?.trim() || `Your ${opts.cfg.label} — ${rec.family_name}`;
  const intro = opts.message?.trim()
    ? `<p style="font-size: 14px; line-height: 1.6;">${nl2br(opts.message)}</p>`
    : `<p style="font-size: 14px; line-height: 1.55;">Please find your ${escapeHtml(opts.cfg.label.toLowerCase())} below.</p>`;

  const html = `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1A1A2E;">
  <div style="background: #15233B; color: white; padding: 24px;">
    <div style="font-size: 22px; font-weight: 700;">${escapeHtml(opts.cfg.label)}</div>
    <div style="font-size: 13px; margin-top: 6px; opacity: 0.9;">Trustner Asset Services · AMFI ARN-286886</div>
  </div>
  <div style="padding: 24px; border: 1px solid #E5E5E5; border-top: 0;">
    <p style="font-size: 15px;">Dear ${escapeHtml(rec.family_name as string)} family,</p>
    ${intro}
    <p style="margin: 24px 0;">
      <a href="${url}" style="display:inline-block; background:#9A7B4F; color:#fff; font-weight:700; font-size:14px; text-decoration:none; padding: 12px 22px; border-radius: 4px;">View your ${escapeHtml(opts.cfg.label)}</a>
    </p>
    <p style="font-size: 12px; color: #6B5F54;">This link opens in your browser — use Cmd+P / Ctrl+P to save it as a PDF. It expires in ${TOKEN_TTL_DAYS} days.</p>
    <p style="font-size: 13px; color: #6B5F54; margin-top: 24px;">
      Please reach out with any questions before acting on anything in this document.
    </p>
    <p style="font-size: 13px; margin-top: 24px;">
      Warm regards,<br/>
      <strong>${escapeHtml(opts.actorName)}</strong><br/>
      <span style="color: #6B5F54;">Trustner Asset Services Pvt. Ltd. · ARN-286886</span>
    </p>
  </div>
  <div style="background: #15233B; color: #94A3B8; padding: 16px; font-size: 11px; text-align: center;">
    Trustner Asset Services Pvt. Ltd. · CIN: U66301AS2023PTC025505 · AMFI Registered Mutual Fund Distributor.<br/>
    Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
  </div>
</body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, cc: cc.length ? cc : undefined, subject, html, reply_to: opts.actorEmail }),
    });
    if (!res.ok) {
      await sb.from('advisory_share_links').delete().eq('token', token);
      const errBody = await res.text();
      return { success: false, error: `Resend API ${res.status}: ${errBody.slice(0, 200)}` };
    }
    const result = await res.json().catch(() => ({} as { id?: string }));
    return { success: true, sentTo: [...to, ...cc], emailId: result.id };
  } catch (e) {
    await sb.from('advisory_share_links').delete().eq('token', token);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ─────────────────────────────────────────────────────────────────
// TOKEN VALIDATION (for the doc-serving routes)
// ─────────────────────────────────────────────────────────────────

/** Validates a share token for (module, recordId) and tracks the open. */
export async function validateShareToken(
  sb: SupabaseClient,
  moduleKey: AdvisoryModule,
  recordId: number,
  token: string
): Promise<boolean> {
  const { data } = await sb
    .from('advisory_share_links')
    .select('id, expires_at, revoked_at, open_count, first_opened_at')
    .eq('module', moduleKey)
    .eq('record_id', recordId)
    .eq('token', token)
    .maybeSingle();
  if (!data) return false;
  if (data.revoked_at) return false;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return false;

  const nowIso = new Date().toISOString();
  await sb
    .from('advisory_share_links')
    .update({
      last_opened_at: nowIso,
      first_opened_at: (data.first_opened_at as string | null) ?? nowIso,
      open_count: ((data.open_count as number) ?? 0) + 1,
    })
    .eq('id', data.id as number);
  return true;
}

// ─────────────────────────────────────────────────────────────────
// SHARED ROUTE HANDLERS (each module's share/route.ts calls these)
// ─────────────────────────────────────────────────────────────────

interface ShareBody {
  recipientEmails: string[];
  ccEmails?: string[];
  subject?: string;
  message?: string;
}

export async function handleShareRequest(
  cfg: ModuleConfig,
  request: NextRequest,
  params: { id: string }
): Promise<NextResponse> {
  const employeeEmail = await resolveEmployeeEmail();
  if (!employeeEmail) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const recordId = parseInt(params.id, 10);
  if (Number.isNaN(recordId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  if (!(await isAdvisoryRecordInScope(supabase, cfg.table, recordId, { employeeEmail }))) {
    return NextResponse.json({ error: 'You do not have access to this record' }, { status: 403 });
  }

  const { data: actor } = await supabase
    .from('employees')
    .select('id, name, email')
    .ilike('email', employeeEmail.trim())
    .maybeSingle();
  const actorId = actor?.id as number | undefined;
  if (!actorId) return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });

  let body: ShareBody;
  try {
    body = (await request.json()) as ShareBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!Array.isArray(body.recipientEmails) || body.recipientEmails.length === 0) {
    return NextResponse.json({ error: 'At least one recipient email is required' }, { status: 400 });
  }

  const result = await shareAdvisoryDeliverable(supabase, {
    cfg,
    recordId,
    actorId,
    actorName: (actor?.name as string) ?? 'Trustner',
    actorEmail: (actor?.email as string) ?? 'wecare@trustner.in',
    recipientEmails: body.recipientEmails,
    ccEmails: body.ccEmails,
    subject: body.subject,
    message: body.message,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error, skipped: result.skipped }, { status: result.skipped ? 503 : 400 });
  }

  await writeAuditEvent({
    entityType: cfg.module,
    entityId: recordId,
    fromStatus: null,
    toStatus: 'SHARED',
    action: 'SHARE_WITH_CLIENT',
    actorEmployeeId: actorId,
    actorName: (actor?.name as string) ?? 'Trustner',
    actorEmail: employeeEmail,
    metadata: { recipients: result.sentTo, emailId: result.emailId },
  });

  return NextResponse.json({ success: true, sentTo: result.sentTo, emailId: result.emailId });
}

export async function handleShareHistory(cfg: ModuleConfig, params: { id: string }): Promise<NextResponse> {
  const employeeEmail = await resolveEmployeeEmail();
  if (!employeeEmail) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const recordId = parseInt(params.id, 10);
  if (Number.isNaN(recordId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  if (!(await isAdvisoryRecordInScope(supabase, cfg.table, recordId, { employeeEmail }))) {
    return NextResponse.json({ error: 'You do not have access to this record' }, { status: 403 });
  }

  const { data } = await supabase
    .from('advisory_share_links')
    .select('id, created_at, recipient_emails, open_count, first_opened_at, last_opened_at, expires_at, revoked_at')
    .eq('module', cfg.module)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false });

  const shares = (data ?? []).map((s) => ({
    id: s.id,
    createdAt: s.created_at,
    recipients: s.recipient_emails ?? [],
    opens: s.open_count ?? 0,
    firstOpenedAt: s.first_opened_at,
    lastOpenedAt: s.last_opened_at,
    expiresAt: s.expires_at,
    revoked: Boolean(s.revoked_at),
  }));

  return NextResponse.json({ shares });
}
