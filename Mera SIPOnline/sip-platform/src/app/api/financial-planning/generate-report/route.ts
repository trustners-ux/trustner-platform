import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { FinancialPlanningData, FinancialHealthReport } from '@/types/financial-planning';
import { generateFullReport } from '@/lib/utils/financial-planning-calc';
import { generateClaudeNarrative } from '@/lib/utils/claude-narrative';
import { generateFinancialReport } from '@/lib/utils/financial-planning-pdf';
import { createReportQueueEntry } from '@/lib/admin/report-queue-store';
import { buildAdminReviewNotificationHTML } from '@/lib/utils/report-email-builders';

export const maxDuration = 30;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, userName, userEmail } = body as {
      data: FinancialPlanningData; userName: string; userEmail: string;
    };

    if (!data || !userName || !userEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('[Generate Report] Starting report generation');

    // Step 1: Generate full report (without narrative)
    const baseReport = generateFullReport(data);
    console.log(`[Generate Report] Score: ${baseReport.score.totalScore}/900 (${baseReport.score.grade})`);

    // Step 2: Generate Claude narrative (with fallback)
    const narrative = await generateClaudeNarrative(baseReport, data, userName);
    const report: FinancialHealthReport = { ...baseReport, claudeNarrative: narrative };
    console.log(`[Generate Report] Narrative generated (${narrative.length} chars)`);

    // Step 3: Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = generateFinancialReport(report, data, userName);
      console.log(`[Generate Report] PDF generated (${(pdfBuffer.length / 1024).toFixed(0)}KB)`);
    } catch (pdfError) {
      console.error('[Generate Report] PDF generation failed:', pdfError);
      return NextResponse.json({ success: true, note: 'PDF generation failed, admin notified' });
    }

    // Step 4: Store in Vercel Blob queue for admin review (NOT sent to user yet)
    const phone = data.personalProfile.phone || '';
    const pillars = report.score.pillars;

    const queueEntry = await createReportQueueEntry(
      {
        userName,
        userEmail,
        userPhone: phone,
        userAge: data.personalProfile.age || 30,
        userCity: data.personalProfile.city === 'other'
          ? (data.personalProfile.otherCity || 'Other')
          : (data.personalProfile.city || '-'),
        riskCategory: data.riskProfile.riskCategory || '-',
        totalScore: report.score.totalScore,
        grade: report.score.grade,
        netWorth: report.netWorth.netWorth,
        pillarScores: {
          cashflow: { score: pillars.cashflow.score, grade: pillars.cashflow.grade },
          protection: { score: pillars.protection.score, grade: pillars.protection.grade },
          investments: { score: pillars.investments.score, grade: pillars.investments.grade },
          debt: { score: pillars.debt.score, grade: pillars.debt.grade },
          retirementReadiness: { score: pillars.retirementReadiness.score, grade: pillars.retirementReadiness.grade },
        },
        topActions: report.actionPlan.slice(0, 5).map(a => `[${a.impact}] ${a.action}`),
        claudeNarrative: narrative,
      },
      pdfBuffer,
      data
    );
    console.log(`[Generate Report] Queued for review: ${queueEntry.id}`);

    // Step 5: Send admin notification email with review link
    try {
      await getResend().emails.send({
        from: 'Mera SIP Online <leads@merasip.com>',
        to: 'wecare@merasip.com',
        subject: `[Review Required] Financial Report: ${userName} — Score: ${report.score.totalScore}/900`,
        html: buildAdminReviewNotificationHTML(userName, userEmail, phone, report, data, queueEntry.id),
      });
      console.log('[Generate Report] Admin review notification sent');
    } catch (teamError) {
      console.error('[Generate Report] Admin notification failed:', teamError);
    }

    return NextResponse.json({ success: true, queued: true, reportId: queueEntry.id });
  } catch (error) {
    console.error('[Generate Report] Critical error:', error);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}
