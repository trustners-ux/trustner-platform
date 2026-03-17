/**
 * Shared email HTML builders for Financial Planning reports.
 * Used by both generate-report (admin notification) and approve (user delivery).
 */

import { formatINR } from '@/lib/utils/formatters';
import { COMPANY } from '@/lib/constants/company';
import type { FinancialHealthReport, FinancialPlanningData } from '@/types/financial-planning';

// ─── User Report Email (sent on approval) ───
export function buildReportEmailHTML(
  userName: string,
  score: number,
  grade: string,
  insights: string[]
): string {
  const firstName = userName.split(' ')[0];
  const gradeColors: Record<string, string> = {
    'Excellent': '#15803d',
    'Good': '#0f766e',
    'Fair': '#d97706',
    'Needs Improvement': '#ea580c',
    'Critical': '#b91c1c',
  };
  const gradeColor = gradeColors[grade] || '#0f766e';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
<tr><td style="background:linear-gradient(135deg,#0f766e,#134e4a);padding:24px 30px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">Trustner Financial Health Report</h1>
<p style="color:#99f6e4;margin:6px 0 0;font-size:13px;">Your personalized financial wellness assessment is ready</p></td></tr>
<tr><td style="padding:30px;">
<p style="color:#334155;font-size:15px;margin:0 0 20px;">Dear ${firstName},</p>
<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">Thank you for completing the Trustner Financial Wellness Assessment. Your detailed 10-page report is attached as a PDF.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="background:#f0fdfa;border:2px solid #99f6e4;border-radius:12px;padding:20px;text-align:center;">
<p style="color:#64748b;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Your Financial Health Score</p>
<p style="color:${gradeColor};font-size:42px;font-weight:800;margin:0;line-height:1;">${score}</p>
<p style="color:#94a3b8;font-size:13px;margin:4px 0 12px;">out of 900</p>
<span style="display:inline-block;background:${gradeColor};color:#ffffff;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:600;">${grade}</span>
</td></tr></table>
${insights.length > 0 ? `<p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 12px;">Key Insights:</p>
${insights.map(i => `<p style="color:#475569;font-size:13px;line-height:1.5;margin:0 0 8px;padding-left:16px;border-left:3px solid #0f766e;">${i}</p>`).join('')}` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="text-align:center;">
<p style="color:#475569;font-size:13px;margin:0 0 12px;">Ready to turn insights into action?</p>
<a href="tel:+916003903737" style="display:inline-block;background:#0f766e;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Talk to a Trustner Advisor</a>
<p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">or call ${COMPANY.contact.phoneDisplay}</p></td></tr></table>
<p style="color:#64748b;font-size:12px;line-height:1.5;margin:20px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;">Your detailed 10-page Financial Health Report is attached as a PDF. Save it for your records.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 30px;border-top:1px solid #e2e8f0;">
<p style="color:#94a3b8;font-size:11px;margin:0 0 4px;text-align:center;">${COMPANY.mfEntity.name} | ${COMPANY.mfEntity.amfiArn} | CIN: ${COMPANY.mfEntity.cin}</p>
<p style="color:#cbd5e1;font-size:10px;margin:0;text-align:center;">Mutual fund investments are subject to market risks. This assessment is for educational purposes only.</p>
</td></tr></table></body></html>`;
}

// ─── Admin Review Notification Email (sent when report queued) ───
export function buildAdminReviewNotificationHTML(
  userName: string,
  userEmail: string,
  userPhone: string,
  report: Omit<FinancialHealthReport, 'claudeNarrative'>,
  data: FinancialPlanningData,
  reportId: string
): string {
  const score = report.score;
  const actions = report.actionPlan.slice(0, 3);
  const reviewUrl = `https://merasip.com/admin/reports/${reportId}`;

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
<div style="background:#0f766e;padding:16px 20px;"><h2 style="color:#fff;margin:0;font-size:16px;">New Financial Planning Report — Awaiting Review</h2></div>
<div style="padding:20px;">
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
<p style="color:#92400e;font-size:13px;font-weight:600;margin:0;">Action Required: Review and approve this report before it is sent to the user.</p>
</div>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:120px;">Name</td><td style="padding:6px 0;font-weight:600;color:#1e293b;font-size:13px;">${userName}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Email</td><td style="padding:6px 0;color:#1e293b;font-size:13px;">${userEmail}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Phone</td><td style="padding:6px 0;color:#1e293b;font-size:13px;">${userPhone || 'Not provided'}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Score</td><td style="padding:6px 0;font-weight:700;color:#0f766e;font-size:16px;">${score.totalScore}/900 (${score.grade})</td></tr>
<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Net Worth</td><td style="padding:6px 0;color:#1e293b;font-size:13px;">${formatINR(report.netWorth.netWorth)}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Age / City</td><td style="padding:6px 0;color:#1e293b;font-size:13px;">${data.personalProfile.age || '-'} / ${data.personalProfile.city === 'other' ? (data.personalProfile.otherCity || 'Other') : (data.personalProfile.city || '-')}</td></tr>
<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Risk Profile</td><td style="padding:6px 0;color:#1e293b;font-size:13px;">${data.riskProfile.riskCategory || '-'}</td></tr>
</table>
<h3 style="color:#334155;font-size:13px;margin:16px 0 8px;">Pillar Breakdown:</h3>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:4px 0;font-size:12px;color:#64748b;">Cashflow</td><td style="padding:4px 0;font-size:12px;font-weight:600;">${score.pillars.cashflow.score}/180 (${score.pillars.cashflow.grade})</td></tr>
<tr><td style="padding:4px 0;font-size:12px;color:#64748b;">Protection</td><td style="padding:4px 0;font-size:12px;font-weight:600;">${score.pillars.protection.score}/180 (${score.pillars.protection.grade})</td></tr>
<tr><td style="padding:4px 0;font-size:12px;color:#64748b;">Investments</td><td style="padding:4px 0;font-size:12px;font-weight:600;">${score.pillars.investments.score}/180 (${score.pillars.investments.grade})</td></tr>
<tr><td style="padding:4px 0;font-size:12px;color:#64748b;">Debt</td><td style="padding:4px 0;font-size:12px;font-weight:600;">${score.pillars.debt.score}/180 (${score.pillars.debt.grade})</td></tr>
<tr><td style="padding:4px 0;font-size:12px;color:#64748b;">Retirement</td><td style="padding:4px 0;font-size:12px;font-weight:600;">${score.pillars.retirementReadiness.score}/180 (${score.pillars.retirementReadiness.grade})</td></tr>
</table>
${actions.length > 0 ? `<h3 style="color:#334155;font-size:13px;margin:16px 0 8px;">Top Actions:</h3>
${actions.map((a, i) => `<p style="font-size:12px;margin:4px 0;color:#475569;">${i + 1}. [${a.impact}] ${a.action}</p>`).join('')}` : ''}
<div style="text-align:center;margin:20px 0 12px;">
<a href="${reviewUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Review & Approve Report</a>
</div>
<p style="color:#94a3b8;font-size:11px;margin:16px 0 0;padding-top:12px;border-top:1px solid #e2e8f0;">
Report queued at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
</div></div></body></html>`;
}

// ─── Reminder Email for Stale Reports ───
export function buildReminderEmailHTML(
  pendingReports: Array<{
    id: string;
    userName: string;
    totalScore: number;
    grade: string;
    createdAt: string;
    remindersSent: number;
  }>
): string {
  const count = pendingReports.length;
  const urgency = pendingReports.some(r => r.remindersSent >= 2) ? 'URGENT: ' : '';

  const rows = pendingReports
    .map((r) => {
      const age = Math.round(
        (Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60)
      );
      const ageText = age < 1 ? '<1 hour' : age < 24 ? `${age} hours` : `${Math.round(age / 24)} days`;
      const reviewUrl = `https://merasip.com/admin/reports/${r.id}`;
      return `<tr>
<td style="padding:8px 12px;font-size:13px;font-weight:600;color:#1e293b;">${r.userName}</td>
<td style="padding:8px 12px;font-size:13px;color:#0f766e;font-weight:700;">${r.totalScore}/900</td>
<td style="padding:8px 12px;font-size:13px;color:#ea580c;">${ageText}</td>
<td style="padding:8px 12px;"><a href="${reviewUrl}" style="color:#0f766e;font-size:12px;font-weight:600;text-decoration:none;">Review →</a></td>
</tr>`;
    })
    .join('');

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
<div style="background:#d97706;padding:16px 20px;"><h2 style="color:#fff;margin:0;font-size:16px;">${urgency}${count} Report${count > 1 ? 's' : ''} Awaiting Review</h2></div>
<div style="padding:20px;">
<p style="color:#475569;font-size:13px;margin:0 0 16px;">The following financial planning report${count > 1 ? 's are' : ' is'} pending your review. Please approve or take action.</p>
<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
<thead><tr style="background:#f8fafc;">
<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Name</th>
<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Score</th>
<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Waiting</th>
<th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Action</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
<div style="text-align:center;margin:20px 0 0;">
<a href="https://merasip.com/admin/reports" style="display:inline-block;background:#0f766e;color:#ffffff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Open Reports Dashboard</a>
</div>
</div></div></body></html>`;
}
