/**
 * Send a selective client-share email when a planner decides to release
 * a Portfolio Diagnostic deliverable set to the client.
 *
 * KEY DESIGN: this is NOT triggered by Publish. Publish only marks the
 * diagnostic as internally approved & ready. The planner separately
 * chooses (a) which of the 6 deliverables to share, (b) who to send to,
 * (c) what subject + message to use. This preserves planner judgement
 * — different clients (Retail vs HNI vs Corporate) get different
 * report mixes; some get nothing until an in-person meeting.
 *
 * Uses Resend HTTP API (RESEND_API_KEY env var). If the key is not
 * present, returns skipped=true; never blocks the workflow.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { loadReportData, formatInrShort, formatPct } from './report-data';

// ─────────────────────────────────────────────────────────────────
// DELIVERABLE CATALOG — single source of truth used by both
// the UI (checkboxes) and the email builder (link list).
// ─────────────────────────────────────────────────────────────────

export type DeliverableId =
  | 'one-pager'
  | 'full'
  | 'three-pager'
  | 'action'
  | 'xlsx'
  | 'pptx';

export interface DeliverableOption {
  id: DeliverableId;
  label: string;
  description: string;
  urlSuffix: string;        // appended to /report?type=...
  format: 'html' | 'xlsx' | 'pptx';
  emoji: string;
}

export const DELIVERABLE_OPTIONS: DeliverableOption[] = [
  { id: 'one-pager',   label: 'One-Pager Snapshot',     description: 'Single-page bottom-line summary — fastest read.',                       urlSuffix: 'one-pager',   format: 'html', emoji: '📋' },
  { id: 'full',        label: 'Full Portfolio Review',  description: 'Detailed 2-page tier-by-tier verdict report with observations.',        urlSuffix: 'full',        format: 'html', emoji: '📄' },
  { id: 'three-pager', label: 'Three-Pager Diagnostic', description: 'Methodology + holdings + wealth projection — deepest context.',       urlSuffix: 'three-pager', format: 'html', emoji: '📊' },
  { id: 'action',      label: 'Action Sheet',           description: 'Sign-off ready execution plan with tax estimate.',                      urlSuffix: 'action',      format: 'html', emoji: '✅' },
  { id: 'xlsx',        label: 'Wealth Math Tracker',    description: 'Excel workbook with stay-vs-realign math + projections.',              urlSuffix: 'xlsx',        format: 'xlsx', emoji: '📈' },
  { id: 'pptx',        label: 'Family Meeting Deck',    description: 'PowerPoint for the in-person review.',                                  urlSuffix: 'pptx',        format: 'pptx', emoji: '🎯' },
];

// Segment-based defaults — these are SUGGESTIONS only; the planner
// can always override. Tuned to what each segment typically values:
//   RETAIL    → bite-sized, clear actions
//   HNI       → full review + meeting deck
//   UHNI      → everything, especially the Excel for their CAs
//   CORPORATE → board-pack feel (deck + XLSX)
export type ClientSegment = 'RETAIL' | 'HNI' | 'UHNI' | 'CORPORATE';

export const SEGMENT_DEFAULTS: Record<ClientSegment, DeliverableId[]> = {
  RETAIL:    ['one-pager', 'action'],
  HNI:       ['full', 'action', 'pptx'],
  UHNI:      ['full', 'three-pager', 'action', 'xlsx', 'pptx'],
  CORPORATE: ['three-pager', 'xlsx', 'pptx'],
};

// ─────────────────────────────────────────────────────────────────
// SEND
// ─────────────────────────────────────────────────────────────────

export interface SendShareOptions {
  diagnosticRunId: number;
  deliverableIds: DeliverableId[];
  recipientEmails: string[];
  ccEmails?: string[];
  subject?: string;
  customMessage?: string;        // planner's custom intro paragraph (replaces default)
  includeKpiSnapshot?: boolean;  // show/hide the KPI strip; default true
  sentByName: string;
  sentByEmail: string;
}

export interface SendShareResult {
  success: boolean;
  sentTo?: string[];
  emailId?: string;
  error?: string;
  skipped?: boolean;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merasip.com';
const FROM = 'Trustner Asset Services <reports@merasip.com>';

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\n/g, '<br/>');
}

export async function sendClientShareEmail(
  opts: SendShareOptions
): Promise<SendShareResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[client-share-email] RESEND_API_KEY missing — skipping email');
    return { success: false, skipped: true, error: 'RESEND_API_KEY not configured' };
  }

  if (!opts.deliverableIds || opts.deliverableIds.length === 0) {
    return { success: false, error: 'No deliverables selected' };
  }
  if (!opts.recipientEmails || opts.recipientEmails.length === 0) {
    return { success: false, error: 'No recipients specified' };
  }

  const data = await loadReportData(opts.diagnosticRunId);
  if (!data) {
    return { success: false, error: 'Diagnostic not found' };
  }

  // Pull the family record for greeting + recipient defaults
  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, error: 'Database unavailable' };
  const { data: family } = await supabase
    .from('pd_client_families')
    .select('primary_contact_name')
    .eq('id', data.familyId)
    .maybeSingle();

  // Filter catalog to only the selected deliverables (preserves order)
  const selectedDeliverables = DELIVERABLE_OPTIONS.filter((d) =>
    opts.deliverableIds.includes(d.id)
  );

  const baseUrl = `${SITE_URL}/api/admin/portfolio-diagnostic/${opts.diagnosticRunId}/report`;
  const links = selectedDeliverables.map((d) => ({
    label: `${d.emoji} ${d.label}`,
    desc: d.description,
    url: `${baseUrl}?type=${d.urlSuffix}`,
  }));

  const subject =
    opts.subject?.trim() ||
    `Your Portfolio Diagnostic Report — ${data.familyName} (${data.reportDate})`;

  const greeting = family?.primary_contact_name
    ? `Dear ${escapeHtml(family.primary_contact_name as string)},`
    : 'Dear Client,';

  // Default intro paragraph if no custom message provided
  const introHtml = opts.customMessage?.trim()
    ? `<p style="font-size: 14px; line-height: 1.6;">${nl2br(opts.customMessage)}</p>`
    : `<p style="font-size: 14px; line-height: 1.55;">
        Your portfolio diagnostic has been completed and reviewed. Please find below
        ${selectedDeliverables.length === 1 ? 'the deliverable' : `${selectedDeliverables.length} deliverables`} we'd like to walk you through.
      </p>`;

  const includeKpi = opts.includeKpiSnapshot !== false;

  const kpiStripHtml = includeKpi
    ? `
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="background: #F0FDFA; border: 1px solid #0F766E; padding: 10px; text-align: center; width: 25%;">
          <div style="font-size: 10px; color: #115E59; font-weight: 700; letter-spacing: 0.3px;">INVESTED</div>
          <div style="font-size: 18px; font-weight: 700; color: #0F766E; margin-top: 4px;">${formatInrShort(data.totalInvestedInr)}</div>
        </td>
        <td style="background: #F0FDFA; border: 1px solid #0F766E; padding: 10px; text-align: center; width: 25%;">
          <div style="font-size: 10px; color: #115E59; font-weight: 700; letter-spacing: 0.3px;">CURRENT VALUE</div>
          <div style="font-size: 18px; font-weight: 700; color: #0F766E; margin-top: 4px;">${formatInrShort(data.currentValueInr)}</div>
        </td>
        <td style="background: #F0FDFA; border: 1px solid #0F766E; padding: 10px; text-align: center; width: 25%;">
          <div style="font-size: 10px; color: #115E59; font-weight: 700; letter-spacing: 0.3px;">GAIN</div>
          <div style="font-size: 18px; font-weight: 700; color: ${data.totalGainInr >= 0 ? '#16A34A' : '#DC2626'}; margin-top: 4px;">${data.totalGainInr >= 0 ? '+' : ''}${formatInrShort(data.totalGainInr)}</div>
        </td>
        <td style="background: #F0FDFA; border: 1px solid #0F766E; padding: 10px; text-align: center; width: 25%;">
          <div style="font-size: 10px; color: #115E59; font-weight: 700; letter-spacing: 0.3px;">XIRR</div>
          <div style="font-size: 18px; font-weight: 700; color: #0F766E; margin-top: 4px;">${formatPct(data.familyXirrPct, 2)}</div>
        </td>
      </tr>
    </table>`
    : '';

  const htmlBody = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1A1A2E;">
  <div style="background: #0F766E; color: white; padding: 24px;">
    <div style="font-size: 22px; font-weight: 700;">Portfolio Diagnostic Report</div>
    <div style="font-size: 13px; margin-top: 6px; opacity: 0.9;">Trustner Asset Services · AMFI ARN-286886</div>
  </div>

  <div style="padding: 24px; border: 1px solid #E5E5E5; border-top: 0;">
    <p style="font-size: 15px;">${greeting}</p>

    ${introHtml}

    ${kpiStripHtml}

    <h3 style="color: #0F766E; font-size: 16px; margin: 24px 0 8px 0;">${selectedDeliverables.length === 1 ? 'Your Report' : `Your ${selectedDeliverables.length} Deliverables`}</h3>
    <p style="font-size: 13px; color: #6B5F54; margin: 0 0 12px 0;">
      Click any link below. HTML reports open in your browser — use Cmd+P / Ctrl+P to save as PDF.
      ${selectedDeliverables.some((d) => d.format !== 'html') ? 'Excel and PowerPoint files download directly.' : ''}
    </p>

    <table style="width: 100%; border-collapse: collapse;">
      ${links.map((l) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5E5E5; vertical-align: top;">
            <a href="${l.url}" style="color: #0F766E; font-weight: 700; font-size: 14px; text-decoration: none;">${l.label}</a>
            <div style="font-size: 12px; color: #6B5F54; margin-top: 2px;">${escapeHtml(l.desc)}</div>
          </td>
        </tr>
      `).join('')}
    </table>

    <p style="font-size: 13px; color: #6B5F54; margin-top: 24px;">
      All recommendations are subject to MFD regulatory disclosures. Please reach out with any
      questions before authorising any actions.
    </p>

    <p style="font-size: 13px; margin-top: 24px;">
      Warm regards,<br/>
      <strong>${escapeHtml(opts.sentByName)}</strong><br/>
      <span style="color: #6B5F54;">Trustner Asset Services Pvt. Ltd. · ARN-286886</span>
    </p>
  </div>

  <div style="background: #1A1A2E; color: #94A3B8; padding: 16px; font-size: 11px; text-align: center;">
    Trustner Asset Services Pvt. Ltd. · CIN: U66301AS2023PTC025505 · AMFI Registered Mutual Fund Distributor.<br/>
    Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
  </div>
</body></html>
`;

  // De-dup and clean recipient/cc lists
  const cleanList = (arr: string[]) =>
    arr
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
      .filter((s, i, a) => a.indexOf(s) === i);

  const to = cleanList(opts.recipientEmails);
  const cc = cleanList(opts.ccEmails ?? []);

  if (to.length === 0) {
    return { success: false, error: 'No valid recipient email(s)' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to,
        cc: cc.length > 0 ? cc : undefined,
        subject,
        html: htmlBody,
        reply_to: opts.sentByEmail,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[client-share-email] Resend API error:', res.status, errBody);
      return { success: false, error: `Resend API ${res.status}: ${errBody.slice(0, 200)}` };
    }

    const result = await res.json().catch(() => ({}));
    console.log('[client-share-email] Sent to', to.join(','), 'cc', cc.join(','), 'id:', result.id);
    return { success: true, sentTo: [...to, ...cc], emailId: result.id };
  } catch (e) {
    console.error('[client-share-email] Unexpected error:', e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
