import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { FinancialPlanningData, FinancialHealthReport } from '@/types/financial-planning';
import type { PlanTier } from '@/types/financial-planning-v2';
import {
  calculateFinancialHealthScore,
  calculateNetWorth,
  calculateRetirementGap,
  generateTeaserData,
  generateFullReport,
} from '@/lib/utils/financial-planning-calc';
import { addLead } from '@/lib/admin/leads-store';
import { generateClaudeNarrative } from '@/lib/utils/claude-narrative';
import { generateFinancialReport } from '@/lib/utils/financial-planning-pdf';
import { calculate5YearCashflow } from '@/lib/utils/cashflow-projection';
import { calculateAllocationMatrix } from '@/lib/utils/allocation-matrix';
import { createReportQueueEntry } from '@/lib/admin/report-queue-store';
import { buildAdminReviewNotificationHTML } from '@/lib/utils/report-email-builders';
import { Resend } from 'resend';

export const maxDuration = 60; // Allow up to 60s for full report generation

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');

export async function POST(request: Request) {
  try {
    // Verify session token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      try {
        await jwtVerify(token, getSecret());
      } catch {
        if (process.env.NODE_ENV !== 'development') {
          return NextResponse.json({ error: 'Session expired. Please start over.' }, { status: 401 });
        }
      }
    }

    const body = await request.json();
    const data = body.data as FinancialPlanningData;
    const tier: PlanTier = body.tier || 'standard'; // Default to standard for backward compatibility

    if (!data || !data.personalProfile?.fullName) {
      return NextResponse.json({ error: 'Invalid questionnaire data' }, { status: 400 });
    }

    const userName = data.personalProfile.fullName;
    const userEmail = data.personalProfile.email;
    const userPhone = data.personalProfile.phone || '';

    console.log(`[FP Submit] Starting — Tier: ${tier}`);

    // Step 1: Run all calculations
    const score = calculateFinancialHealthScore(data);
    const netWorth = calculateNetWorth(data);
    const retirementGap = calculateRetirementGap(data);
    const baseReport = generateFullReport(data);
    const teaser = generateTeaserData(data, { ...baseReport, claudeNarrative: '' }, tier);

    console.log(`[FP Submit] Score: ${score.totalScore}/900 (${score.grade})`);

    // Step 2: Capture lead directly (using Vercel Blob — persistent)
    try {
      await addLead({
        name: userName,
        phone: userPhone,
        email: userEmail,
        goal: 'Financial Planning',
        source: 'financial-planning',
        riskProfile: data.riskProfile?.riskCategory,
        riskScore: data.riskProfile?.riskScore,
        step: 'completed',
        metadata: {
          score: score.totalScore,
          grade: score.grade,
          netWorth: netWorth.netWorth,
          age: data.personalProfile.age,
          city: data.personalProfile.city === 'other'
            ? (data.personalProfile.otherCity || 'Other')
            : (data.personalProfile.city || '-'),
        },
      });
      console.log('[FP Submit] Lead captured');
    } catch (leadErr) {
      console.error('[FP Submit] Lead capture failed:', leadErr);
      // Non-critical — continue with report generation
    }

    // Step 3: Generate Claude narrative (with fallback to demo)
    let narrative = '';
    try {
      narrative = await generateClaudeNarrative(baseReport, data, userName, tier);
      console.log(`[FP Submit] Narrative generated (${narrative.length} chars)`);
    } catch (narErr) {
      console.error('[FP Submit] Narrative generation failed:', narErr);
      narrative = 'Your personalized financial narrative will be added by our team during review.';
    }

    const report: FinancialHealthReport = { ...baseReport, claudeNarrative: narrative };

    // Step 3b: Comprehensive-only calculations
    let cashflowProjection;
    let allocationMatrix;
    if (tier === 'comprehensive') {
      try {
        cashflowProjection = calculate5YearCashflow(data, body.comprehensiveProfile);
        allocationMatrix = calculateAllocationMatrix(data, baseReport.goalGaps);
        console.log(`[FP Submit] Comprehensive calculations complete (5Y cashflow + allocation matrix)`);
      } catch (compErr) {
        console.error('[FP Submit] Comprehensive calculations failed:', compErr);
      }
    }

    // Step 4: Generate PDF
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = generateFinancialReport(report, data, userName, tier, cashflowProjection, allocationMatrix);
      console.log(`[FP Submit] PDF generated (${(pdfBuffer.length / 1024).toFixed(0)}KB)`);
    } catch (pdfErr) {
      console.error('[FP Submit] PDF generation failed:', pdfErr);
      // Continue without PDF — admin can regenerate later
    }

    // Step 5: Store in Vercel Blob queue for admin review
    let reportId = '';
    try {
      const pillars = report.score.pillars;
      const queueEntry = await createReportQueueEntry(
        {
          userName,
          userEmail,
          userPhone,
          userAge: data.personalProfile.age || 30,
          userCity: data.personalProfile.city === 'other'
            ? (data.personalProfile.otherCity || 'Other')
            : (data.personalProfile.city || '-'),
          riskCategory: data.riskProfile?.riskCategory || '-',
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
          tier,
        },
        pdfBuffer || Buffer.from('PDF generation pending'),
        data
      );
      reportId = queueEntry.id;
      console.log(`[FP Submit] Queued for review: ${reportId}`);
    } catch (queueErr) {
      console.error('[FP Submit] CRITICAL — Failed to queue report:', queueErr);
      // This is critical — report will be lost. Return error so user knows.
      return NextResponse.json({
        success: false,
        error: 'Report could not be saved. Please try again or contact us on WhatsApp: +91-6003903737',
        teaser, // Still show teaser so user sees their score
      }, { status: 500 });
    }

    // Step 6: Send admin notification email
    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Mera SIP Online <leads@merasip.com>',
          to: 'wecare@merasip.com',
          subject: `[Review Required] Financial Report: ${userName} — Score: ${report.score.totalScore}/900`,
          html: buildAdminReviewNotificationHTML(userName, userEmail, userPhone, report, data, reportId),
        });
        console.log('[FP Submit] Admin notification sent');
      }
    } catch (emailErr) {
      console.error('[FP Submit] Admin notification failed:', emailErr);
      // Non-critical — report is already in queue, admin will see it
    }

    console.log(`[FP Submit] ✅ Complete — Report ID: ${reportId}`);

    return NextResponse.json({
      success: true,
      teaser,
      reportId,
      userName,
      userEmail,
    });
  } catch (error) {
    console.error('[FP Submit] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to process your assessment. Please try again.' },
      { status: 500 }
    );
  }
}
