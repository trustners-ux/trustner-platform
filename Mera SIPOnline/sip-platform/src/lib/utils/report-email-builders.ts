/**
 * Shared email HTML builders for Financial Planning reports.
 * Used by both generate-report (admin notification) and approve (user delivery).
 */

import { formatINR } from '@/lib/utils/formatters';
import { COMPANY } from '@/lib/constants/company';
import type { FinancialHealthReport, FinancialPlanningData } from '@/types/financial-planning';
import type { PlanTierLabel } from '@/types/report-queue';

// ─── User Report Email (sent on approval) ───
export function buildReportEmailHTML(
  userName: string,
  score: number,
  grade: string,
  insights: string[],
  adminNotes?: string
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
${adminNotes ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 16px;margin:16px 0;">
<p style="color:#0369a1;font-size:13px;font-weight:600;margin:0 0 6px;">A note from your advisor:</p>
<p style="color:#475569;font-size:13px;line-height:1.6;margin:0;">${adminNotes.replace(/\n/g, '<br/>')}</p>
</div>` : ''}
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

// ─── Tier-Aware Client Report Email (sent on approval) ───

interface ClientReportEmailOptions {
  userName: string;
  tier: PlanTierLabel;
  totalScore: number;
  grade: string;
  netWorth?: number;
  pillarScores?: Record<string, { score: number; grade: string }>;
  topActions: string[];
  goals?: Array<{ name: string; gap: string; status: string }>;
  adminNotes?: string;
  pdfDownloadUrl?: string;
}

const TIER_SUBJECT: Record<PlanTierLabel, (name: string) => string> = {
  basic: () => 'Your Financial Health Check is Ready! | MeraSIP',
  standard: () => 'Your Goal-Based Financial Plan | MeraSIP',
  comprehensive: () => 'Your Comprehensive Financial Blueprint | MeraSIP',
};

const GRADE_COLORS: Record<string, string> = {
  'Excellent': '#15803d',
  'Good': '#0f766e',
  'Fair': '#d97706',
  'Needs Improvement': '#ea580c',
  'Needs Attention': '#ea580c',
  'Critical': '#b91c1c',
};

const PILLAR_LABELS: Record<string, string> = {
  cashflow: 'Cashflow Health',
  protection: 'Protection',
  investments: 'Investments',
  debt: 'Debt Management',
  retirementReadiness: 'Retirement Readiness',
};

function emailHeader(title: string, subtitle: string, premium = false): string {
  const bgGradient = premium
    ? 'background:linear-gradient(135deg,#b45309,#92400e);'
    : 'background:linear-gradient(135deg,#0f766e,#134e4a);';
  return `<tr><td style="${bgGradient}padding:28px 30px;text-align:center;">
${premium ? '<p style="color:#fcd34d;font-size:11px;font-weight:700;letter-spacing:2px;margin:0 0 6px;text-transform:uppercase;">PREMIUM</p>' : ''}
<h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">${title}</h1>
<p style="color:${premium ? '#fde68a' : '#99f6e4'};margin:6px 0 0;font-size:13px;">${subtitle}</p>
</td></tr>`;
}

function emailFooter(): string {
  return `<tr><td style="padding:16px 30px;background:#f0fdfa;border-top:1px solid #ccfbf1;">
<table width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="text-align:center;">
<p style="color:#0f766e;font-size:13px;font-weight:600;margin:0 0 8px;">Have questions? We're here to help.</p>
<a href="https://wa.me/916003903737" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin:0 4px;">WhatsApp Us</a>
<a href="tel:+916003903737" style="display:inline-block;background:#0f766e;color:#ffffff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin:0 4px;">Call Us</a>
</td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 30px;border-top:1px solid #e2e8f0;">
<p style="color:#94a3b8;font-size:11px;margin:0 0 4px;text-align:center;">${COMPANY.mfEntity.name} | ${COMPANY.mfEntity.amfiArn} | CIN: ${COMPANY.mfEntity.cin}</p>
<p style="color:#cbd5e1;font-size:10px;margin:0 0 4px;text-align:center;">AMFI Registered Mutual Fund Distributor | EUIN: ${COMPANY.mfEntity.euin}</p>
<p style="color:#cbd5e1;font-size:10px;margin:0 0 4px;text-align:center;">Mutual fund investments are subject to market risks. Read all scheme-related documents carefully before investing.</p>
<p style="color:#cbd5e1;font-size:10px;margin:0 0 4px;text-align:center;">This report is for educational and planning purposes only and should not be considered as financial advice.</p>
<p style="color:#e2e8f0;font-size:9px;margin:8px 0 0;text-align:center;">You received this email because you completed a financial planning assessment on merasip.com. To unsubscribe, reply with "UNSUBSCRIBE".</p>
</td></tr>`;
}

function scoreBlock(score: number, grade: string): string {
  const color = GRADE_COLORS[grade] || '#0f766e';
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr><td style="background:#f0fdfa;border:2px solid #99f6e4;border-radius:12px;padding:20px;text-align:center;">
<p style="color:#64748b;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Your Financial Health Score</p>
<p style="color:${color};font-size:42px;font-weight:800;margin:0;line-height:1;">${score}</p>
<p style="color:#94a3b8;font-size:13px;margin:4px 0 12px;">out of 900</p>
<span style="display:inline-block;background:${color};color:#ffffff;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:600;">${grade}</span>
</td></tr></table>`;
}

function adminNotesBlock(notes: string): string {
  return `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 16px;margin:16px 0;">
<p style="color:#0369a1;font-size:13px;font-weight:600;margin:0 0 6px;">A note from your advisor:</p>
<p style="color:#475569;font-size:13px;line-height:1.6;margin:0;">${notes.replace(/\n/g, '<br/>')}</p>
</div>`;
}

function actionItemsHTML(actions: string[], maxItems: number): string {
  const items = actions.slice(0, maxItems);
  if (items.length === 0) return '';
  return `<p style="color:#334155;font-size:14px;font-weight:600;margin:20px 0 12px;">Top Action Items:</p>
${items.map((a, i) => `<div style="margin:0 0 8px;padding:8px 12px;background:#f8fafc;border-left:3px solid #0f766e;border-radius:0 6px 6px 0;">
<span style="color:#0f766e;font-size:12px;font-weight:700;">${i + 1}.</span>
<span style="color:#475569;font-size:13px;line-height:1.5;margin-left:4px;">${a}</span>
</div>`).join('')}`;
}

/**
 * Get the email subject line for a tier-aware client report email.
 */
export function getClientReportSubject(opts: Pick<ClientReportEmailOptions, 'userName' | 'tier' | 'totalScore'>): string {
  return TIER_SUBJECT[opts.tier](opts.userName);
}

/**
 * Build tier-aware HTML email for sending the approved report to the client.
 * Each tier has a distinct layout emphasizing different aspects of the report.
 */
export function buildClientReportEmailHTML(opts: ClientReportEmailOptions): string {
  const {
    userName,
    tier,
    totalScore,
    grade,
    netWorth,
    pillarScores,
    topActions,
    goals,
    adminNotes,
    pdfDownloadUrl,
  } = opts;

  const firstName = userName.split(' ')[0];

  if (tier === 'basic') {
    return buildBasicTierEmail(firstName, totalScore, grade, topActions, adminNotes, pdfDownloadUrl);
  }
  if (tier === 'standard') {
    return buildStandardTierEmail(firstName, totalScore, grade, netWorth, pillarScores, topActions, goals, adminNotes, pdfDownloadUrl);
  }
  return buildComprehensiveTierEmail(firstName, totalScore, grade, netWorth, pillarScores, topActions, goals, adminNotes, pdfDownloadUrl);
}

function buildBasicTierEmail(
  firstName: string,
  totalScore: number,
  grade: string,
  topActions: string[],
  adminNotes?: string,
  pdfDownloadUrl?: string,
): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
${emailHeader('Your Financial Health Check', 'A quick snapshot of your financial wellness')}
<tr><td style="padding:30px;">
<p style="color:#334155;font-size:15px;margin:0 0 20px;">Dear ${firstName},</p>
<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">Thank you for completing the Trustner Financial Health Check. Here's a quick summary of your results. Your detailed report is attached as a PDF.</p>
${scoreBlock(totalScore, grade)}
${actionItemsHTML(topActions, 3)}
${adminNotes ? adminNotesBlock(adminNotes) : ''}
${pdfDownloadUrl ? `<div style="text-align:center;margin:20px 0;">
<a href="${pdfDownloadUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Download Your Report</a>
</div>` : '<p style="color:#64748b;font-size:12px;line-height:1.5;margin:20px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;">Your detailed Financial Health Report is attached as a PDF. Save it for your records.</p>'}
<div style="background:#f0fdfa;border:2px solid #99f6e4;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
<p style="color:#0f766e;font-size:14px;font-weight:700;margin:0 0 8px;">Want a more detailed plan?</p>
<p style="color:#475569;font-size:13px;margin:0 0 14px;line-height:1.5;">Upgrade to our <strong>Goal-Based Financial Plan</strong> for personalized investment recommendations, goal tracking, and a dedicated advisor consultation.</p>
<a href="https://merasip.com/financial-planning?tier=standard" style="display:inline-block;background:#0f766e;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Upgrade to Goal-Based Plan</a>
</div>
</td></tr>
${emailFooter()}
</table></body></html>`;
}

function buildStandardTierEmail(
  firstName: string,
  totalScore: number,
  grade: string,
  netWorth?: number,
  pillarScores?: Record<string, { score: number; grade: string }>,
  topActions?: string[],
  goals?: Array<{ name: string; gap: string; status: string }>,
  adminNotes?: string,
  pdfDownloadUrl?: string,
): string {
  const pillarRows = pillarScores
    ? Object.entries(pillarScores)
        .map(([key, p]) => {
          const label = PILLAR_LABELS[key] || key;
          const pct = Math.round((p.score / 180) * 100);
          const color = GRADE_COLORS[p.grade] || '#0f766e';
          return `<tr>
<td style="padding:6px 0;font-size:13px;color:#475569;">${label}</td>
<td style="padding:6px 0;font-size:13px;font-weight:700;color:${color};text-align:right;">${p.score}/180 (${p.grade})</td>
<td style="padding:6px 0;width:100px;">
<div style="width:100%;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
<div style="width:${pct}%;height:100%;background:${color};border-radius:4px;"></div>
</div>
</td></tr>`;
        })
        .join('')
    : '';

  const goalRows = goals?.length
    ? goals
        .map(
          (g) =>
            `<tr><td style="padding:6px 0;font-size:13px;color:#475569;">${g.name}</td><td style="padding:6px 0;font-size:13px;color:#64748b;text-align:center;">${g.gap}</td><td style="padding:6px 0;font-size:13px;font-weight:600;color:${g.status === 'On Track' ? '#15803d' : '#ea580c'};text-align:right;">${g.status}</td></tr>`
        )
        .join('')
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
${emailHeader('Your Goal-Based Financial Plan', 'Personalized investment roadmap tailored to your life goals')}
<tr><td style="padding:30px;">
<p style="color:#334155;font-size:15px;margin:0 0 20px;">Dear ${firstName},</p>
<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">Your comprehensive Goal-Based Financial Plan is ready. Our team has reviewed your data and prepared a detailed report with actionable recommendations. Your full report is attached as a PDF.</p>
${scoreBlock(totalScore, grade)}
${netWorth !== undefined ? `<div style="text-align:center;margin:-12px 0 24px;">
<span style="color:#64748b;font-size:12px;">Estimated Net Worth: </span>
<span style="color:#0f766e;font-size:16px;font-weight:700;">${formatINR(netWorth)}</span>
</div>` : ''}
${pillarRows ? `<p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 12px;">Pillar-wise Breakdown:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${pillarRows}</table>` : ''}
${goalRows ? `<p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 12px;">Goal Summary:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
<thead><tr style="background:#f8fafc;"><th style="padding:8px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Goal</th><th style="padding:8px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;">Gap</th><th style="padding:8px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;">Status</th></tr></thead>
<tbody>${goalRows}</tbody></table>` : ''}
${actionItemsHTML(topActions || [], 5)}
${adminNotes ? adminNotesBlock(adminNotes) : ''}
${pdfDownloadUrl ? `<div style="text-align:center;margin:20px 0;">
<a href="${pdfDownloadUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Download Your Report</a>
</div>` : '<p style="color:#64748b;font-size:12px;line-height:1.5;margin:20px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;">Your detailed Goal-Based Financial Plan is attached as a PDF. Save it for your records.</p>'}
<div style="background:#f0fdfa;border:2px solid #99f6e4;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
<p style="color:#0f766e;font-size:14px;font-weight:700;margin:0 0 8px;">Ready to take the next step?</p>
<p style="color:#475569;font-size:13px;margin:0 0 14px;line-height:1.5;">Book a free consultation call with CFP Ram Shah to discuss your plan and get started on your financial journey.</p>
<a href="https://wa.me/916003903737?text=Hi%2C%20I%20received%20my%20Goal-Based%20Plan%20and%20would%20like%20to%20book%20a%20consultation." style="display:inline-block;background:#0f766e;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Book Free Consultation</a>
</div>
</td></tr>
${emailFooter()}
</table></body></html>`;
}

function buildComprehensiveTierEmail(
  firstName: string,
  totalScore: number,
  grade: string,
  netWorth?: number,
  pillarScores?: Record<string, { score: number; grade: string }>,
  topActions?: string[],
  goals?: Array<{ name: string; gap: string; status: string }>,
  adminNotes?: string,
  pdfDownloadUrl?: string,
): string {
  // Build 5-pillar summary for comprehensive
  const pillarSummary = pillarScores
    ? Object.entries(pillarScores)
        .map(([key, p]) => {
          const label = PILLAR_LABELS[key] || key;
          const color = GRADE_COLORS[p.grade] || '#0f766e';
          return `<td style="text-align:center;padding:8px 4px;">
<div style="width:60px;height:60px;border-radius:50%;border:3px solid ${color};margin:0 auto 6px;display:flex;align-items:center;justify-content:center;">
<span style="color:${color};font-size:16px;font-weight:800;">${p.score}</span>
</div>
<p style="color:#475569;font-size:11px;margin:0;line-height:1.2;">${label}</p>
<p style="color:${color};font-size:10px;font-weight:700;margin:2px 0 0;">${p.grade}</p>
</td>`;
        })
        .join('')
    : '';

  const goalRows = goals?.length
    ? goals
        .map(
          (g) =>
            `<tr><td style="padding:8px 12px;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9;">${g.name}</td><td style="padding:8px 12px;font-size:13px;color:#64748b;text-align:center;border-bottom:1px solid #f1f5f9;">${g.gap}</td><td style="padding:8px 12px;font-size:13px;font-weight:600;color:${g.status === 'On Track' ? '#15803d' : '#ea580c'};text-align:right;border-bottom:1px solid #f1f5f9;">${g.status}</td></tr>`
        )
        .join('')
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;">
${emailHeader('Your Comprehensive Financial Blueprint', 'A complete financial roadmap prepared by CFP Ram Shah', true)}
<tr><td style="padding:30px;">
<p style="color:#334155;font-size:15px;margin:0 0 20px;">Dear ${firstName},</p>
<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px;">Your Comprehensive Financial Blueprint has been personally reviewed and is now ready. This is our most detailed assessment, covering all five pillars of financial health with tailored recommendations.</p>
<p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">Your full report (attached as a PDF) includes 5-year cashflow projections, asset allocation matrices, tax optimization strategies, and a step-by-step implementation roadmap.</p>

<div style="background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border:2px solid #99f6e4;border-radius:12px;padding:20px;margin:0 0 24px;">
<p style="color:#0f766e;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px;text-align:center;">Executive Summary</p>
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="text-align:center;width:50%;padding:0 8px;">
<p style="color:#64748b;font-size:11px;margin:0 0 4px;">Financial Health Score</p>
<p style="color:${GRADE_COLORS[grade] || '#0f766e'};font-size:36px;font-weight:800;margin:0;line-height:1;">${totalScore}</p>
<p style="color:#94a3b8;font-size:11px;margin:2px 0 0;">out of 900</p>
<span style="display:inline-block;background:${GRADE_COLORS[grade] || '#0f766e'};color:#ffffff;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:600;margin:6px 0 0;">${grade}</span>
</td>
${netWorth !== undefined ? `<td style="text-align:center;width:50%;padding:0 8px;border-left:1px solid #ccfbf1;">
<p style="color:#64748b;font-size:11px;margin:0 0 4px;">Estimated Net Worth</p>
<p style="color:#0f766e;font-size:24px;font-weight:800;margin:0;line-height:1.2;">${formatINR(netWorth)}</p>
</td>` : ''}
</tr></table>
</div>

${pillarSummary ? `<p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 12px;text-align:center;">Five Pillars of Financial Health</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>${pillarSummary}</tr></table>` : ''}

${goalRows ? `<p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 12px;">Goal Tracking:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
<thead><tr style="background:#f8fafc;"><th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Goal</th><th style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;">Gap</th><th style="padding:8px 12px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;">Status</th></tr></thead>
<tbody>${goalRows}</tbody></table>` : ''}

${actionItemsHTML(topActions || [], 5)}
${adminNotes ? adminNotesBlock(adminNotes) : ''}
${pdfDownloadUrl ? `<div style="text-align:center;margin:24px 0;">
<a href="${pdfDownloadUrl}" style="display:inline-block;background:linear-gradient(135deg,#b45309,#92400e);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;">Download Your Blueprint</a>
</div>` : '<p style="color:#64748b;font-size:12px;line-height:1.5;margin:20px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;">Your Comprehensive Financial Blueprint is attached as a PDF. This is a premium document — please save it for your records.</p>'}
<div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fde68a;border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
<p style="color:#92400e;font-size:14px;font-weight:700;margin:0 0 8px;">Schedule Your CFP Consultation</p>
<p style="color:#78350f;font-size:13px;margin:0 0 14px;line-height:1.5;">As a Comprehensive Blueprint client, you get a dedicated one-on-one session with CFP Ram Shah to walk through your plan and begin implementation.</p>
<a href="https://wa.me/916003903737?text=Hi%2C%20I%20received%20my%20Comprehensive%20Blueprint%20and%20would%20like%20to%20schedule%20my%20CFP%20consultation." style="display:inline-block;background:#92400e;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Schedule Consultation</a>
</div>
</td></tr>
${emailFooter()}
</table></body></html>`;
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
