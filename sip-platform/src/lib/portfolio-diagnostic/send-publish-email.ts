/**
 * Send the Publish-notification email to the client + RM when a
 * Portfolio Diagnostic is published.
 *
 * Uses Resend HTTP API (RESEND_API_KEY env var). If the key is not
 * present, logs and silently returns — never blocks the workflow.
 *
 * The email includes deep links to all 6 client deliverables:
 *   • Full Portfolio Review (HTML→PDF)
 *   • One-Pager Snapshot
 *   • Three-Pager Report
 *   • Action Sheet
 *   • Wealth Math Tracker (XLSX)
 *   • Family Meeting Deck (PPTX)
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { loadReportData, formatInrShort, formatPct } from './report-data';

interface SendOptions {
  diagnosticRunId: number;
  publishedByName: string;
  publishedByEmail: string;
}

interface SendResult {
  success: boolean;
  sentTo?: string[];
  error?: string;
  skipped?: boolean;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.merasip.com';
const FROM = 'Trustner Asset Services <reports@merasip.com>';

function escapeHtml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function sendPublishNotificationEmail(opts: SendOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[publish-email] RESEND_API_KEY missing — skipping email');
    return { success: false, skipped: true, error: 'RESEND_API_KEY not configured' };
  }

  const data = await loadReportData(opts.diagnosticRunId);
  if (!data) {
    return { success: false, error: 'Diagnostic not found' };
  }

  // ── Resolve recipient email(s) from the family record ──
  const supabase = getSupabaseAdmin();
  if (!supabase) return { success: false, error: 'Database unavailable' };
  const { data: family } = await supabase
    .from('pd_client_families')
    .select('primary_contact_name, primary_contact_email, primary_contact_mobile')
    .eq('id', data.familyId)
    .maybeSingle();

  const clientEmail = (family?.primary_contact_email as string | null)?.trim();
  const rmCc = ['wecare@merasip.com', opts.publishedByEmail.toLowerCase()]
    .filter(Boolean)
    .filter((e, i, arr) => arr.indexOf(e) === i);

  const recipients: string[] = [];
  if (clientEmail) recipients.push(clientEmail);
  // If no client email, route to wecare so the published artefact is at
  // least delivered internally and RM can manually forward
  const to = recipients.length > 0 ? recipients : ['wecare@merasip.com'];

  // ── Build email HTML ──
  const baseUrl = `${SITE_URL}/api/admin/portfolio-diagnostic/${opts.diagnosticRunId}/report`;
  const links = [
    { label: '📄 Full Portfolio Review', desc: 'Detailed 2-page tier-by-tier verdict report', url: `${baseUrl}?type=full` },
    { label: '📋 One-Pager Snapshot', desc: 'Single-page bottom-line summary', url: `${baseUrl}?type=one-pager` },
    { label: '📊 Three-Pager Diagnostic', desc: 'Methodology + holdings + wealth projection', url: `${baseUrl}?type=three-pager` },
    { label: '✅ Action Sheet', desc: 'Sign-off ready execution plan with tax estimate', url: `${baseUrl}?type=action` },
    { label: '📈 Wealth Math Tracker', desc: 'Excel workbook with stay-vs-realign math', url: `${baseUrl}?type=xlsx` },
    { label: '🎯 Family Meeting Deck', desc: 'PowerPoint for the in-person review', url: `${baseUrl}?type=pptx` },
  ];

  const subject = `Your Portfolio Diagnostic Report — ${data.familyName} (${data.reportDate})`;
  const greeting = family?.primary_contact_name
    ? `Dear ${escapeHtml(family.primary_contact_name as string)},`
    : 'Dear Client,';

  const htmlBody = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1A1A2E;">
  <div style="background: #0F766E; color: white; padding: 24px;">
    <div style="font-size: 22px; font-weight: 700;">Portfolio Diagnostic Report</div>
    <div style="font-size: 13px; margin-top: 6px; opacity: 0.9;">Trustner Asset Services · AMFI ARN-286886</div>
  </div>

  <div style="padding: 24px; border: 1px solid #E5E5E5; border-top: 0;">
    <p style="font-size: 15px;">${greeting}</p>

    <p style="font-size: 14px; line-height: 1.55;">
      Your portfolio diagnostic has been completed and reviewed. Below is a snapshot followed by
      six client deliverables — choose whichever format suits the conversation you want to have.
    </p>

    <!-- KPI strip -->
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
    </table>

    <!-- Verdict counts -->
    <div style="background: #F0FDFA; border-left: 4px solid #0F766E; padding: 12px 16px; margin: 16px 0;">
      <strong style="color: #0F766E;">Bottom line:</strong>
      ${data.tierTotals.star.count + data.tierTotals.keep.count} of ${data.numHoldings} holdings are STAR/KEEP tier (${(data.tierTotals.star.pctOfPortfolio + data.tierTotals.keep.pctOfPortfolio).toFixed(0)}% of portfolio).
      ${data.swapCount > 0
        ? `Recommended actions: <strong>${data.swapCount} swap${data.swapCount !== 1 ? 's' : ''}${data.liquidateCount > 0 ? ` + ${data.liquidateCount} cleanup${data.liquidateCount !== 1 ? 's' : ''}` : ''}</strong> totalling ${formatInrShort(data.totalReallocationInr)}.`
        : 'No actions required — portfolio is healthy. Continue all existing SIPs.'}
    </div>

    <h3 style="color: #0F766E; font-size: 16px; margin: 24px 0 8px 0;">Your Six Deliverables</h3>
    <p style="font-size: 13px; color: #6B5F54; margin: 0 0 12px 0;">
      Click any link below. HTML reports open in your browser — use Cmd+P / Ctrl+P to save as PDF.
      Excel and PowerPoint files download directly.
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
      All recommendations are subject to MFD regulatory disclosures. The Action Sheet contains the
      sign-off block required before any execution. Please reach out with any questions before
      authorising the actions.
    </p>

    <p style="font-size: 13px; margin-top: 24px;">
      Warm regards,<br/>
      <strong>${escapeHtml(opts.publishedByName)}</strong><br/>
      <span style="color: #6B5F54;">Trustner Asset Services Pvt. Ltd. · ARN-286886</span>
    </p>
  </div>

  <div style="background: #1A1A2E; color: #94A3B8; padding: 16px; font-size: 11px; text-align: center;">
    Trustner Asset Services Pvt. Ltd. · CIN: U66301AS2023PTC025505 · AMFI Registered Mutual Fund Distributor.<br/>
    Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
  </div>
</body></html>
`;

  // ── Send via Resend ──
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
        cc: rmCc,
        subject,
        html: htmlBody,
        reply_to: opts.publishedByEmail,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[publish-email] Resend API error:', res.status, errBody);
      return { success: false, error: `Resend API ${res.status}: ${errBody.slice(0, 200)}` };
    }

    const result = await res.json().catch(() => ({}));
    console.log('[publish-email] Sent successfully to', to.join(','), 'cc', rmCc.join(','), 'id:', result.id);
    return { success: true, sentTo: [...to, ...rmCc] };
  } catch (e) {
    console.error('[publish-email] Unexpected error:', e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}
