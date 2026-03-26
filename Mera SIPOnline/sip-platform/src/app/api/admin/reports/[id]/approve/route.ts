import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  getReportEntry,
  updateReportEntry,
  getReportPdf,
  getReportPlanningData,
  updateReportPdf,
} from '@/lib/admin/report-queue-store';
import { buildReportEmailHTML } from '@/lib/utils/report-email-builders';
import { generateFinancialReport } from '@/lib/utils/financial-planning-pdf';
import { generateFullReport } from '@/lib/utils/financial-planning-calc';
import type { EditHistoryEntry } from '@/types/report-queue';
import type { FinancialHealthReport } from '@/types/financial-planning';

export const maxDuration = 30;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[Approve] RESEND_API_KEY not set — email will be skipped');
    return null;
  }
  return new Resend(key);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminEmail = request.headers.get('x-admin-email') || 'unknown';

    // Parse optional adminNotes from request body
    let adminNotes: string | undefined;
    try {
      const body = await request.json();
      adminNotes = body?.adminNotes;
    } catch {
      // Body may be empty for legacy calls — that's fine
    }

    const entry = await getReportEntry(id);
    if (!entry) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Prevent double-sending
    if (entry.status === 'sent') {
      return NextResponse.json({ error: 'Report already sent' }, { status: 409 });
    }

    let pdfBuffer: Buffer | null = null;

    // If narrative was edited, regenerate PDF with the edited narrative
    if (entry.editedNarrative) {
      console.log(`[Approve] Regenerating PDF with edited narrative for ${id}`);
      const planningData = await getReportPlanningData(id);
      if (planningData) {
        const baseReport = generateFullReport(planningData);
        const fullReport: FinancialHealthReport = {
          ...baseReport,
          claudeNarrative: entry.editedNarrative,
        };
        pdfBuffer = generateFinancialReport(fullReport, planningData, entry.userName);
        // Upload new PDF
        const newPdfUrl = await updateReportPdf(id, pdfBuffer);
        await updateReportEntry(id, { pdfBlobUrl: newPdfUrl });
        console.log(`[Approve] New PDF uploaded for ${id}`);
      }
    }

    // Fetch the PDF (either new or original)
    if (!pdfBuffer) {
      pdfBuffer = await getReportPdf(id);
    }

    if (!pdfBuffer) {
      return NextResponse.json({ error: 'PDF not found — cannot send report' }, { status: 500 });
    }

    // Send report email to user — wrapped so email failure doesn't block approval
    let emailSent = false;
    let emailWarning: string | undefined;

    const resend = getResend();
    if (!resend) {
      emailWarning = 'RESEND_API_KEY not configured — email was not sent';
    } else {
      try {
        const insights = entry.topActions.slice(0, 3);
        const notesForEmail = adminNotes?.trim() || entry.adminNotes?.trim() || undefined;

        await resend.emails.send({
          from: 'Mera SIP Online <leads@merasip.com>',
          to: entry.userEmail,
          subject: `Your Trustner Financial Health Report - Score: ${entry.totalScore}/900`,
          html: buildReportEmailHTML(
            entry.userName,
            entry.totalScore,
            entry.grade,
            insights,
            notesForEmail
          ),
          attachments: [{
            filename: 'Trustner-Financial-Health-Report.pdf',
            content: pdfBuffer.toString('base64'),
          }],
        });
        emailSent = true;
        console.log(`[Approve] Report email sent to ${entry.userEmail}`);
      } catch (emailError) {
        console.error('[Approve] Email send failed:', emailError);
        emailWarning = `Email delivery failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}. Report marked as approved.`;
      }
    }

    // Update entry status — always mark as approved even if email failed
    const historyEntry: EditHistoryEntry = {
      timestamp: new Date().toISOString(),
      adminEmail,
      action: 'approved',
      details: emailSent
        ? `Report approved and sent to ${entry.userEmail}`
        : `Report approved (email not sent: ${emailWarning})`,
    };

    const updatePayload: Partial<typeof entry> = {
      status: emailSent ? 'sent' : 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: adminEmail,
      editHistory: [...entry.editHistory, historyEntry],
    };

    if (emailSent) {
      updatePayload.sentAt = new Date().toISOString();
    }

    if (adminNotes !== undefined) {
      updatePayload.adminNotes = adminNotes;
    }

    await updateReportEntry(id, updatePayload);

    return NextResponse.json({
      success: true,
      emailSent,
      message: emailSent
        ? 'Report approved and sent'
        : 'Report approved but email was not sent',
      warning: emailWarning,
    });
  } catch (error) {
    console.error('[Approve] Error:', error);
    return NextResponse.json(
      { error: `Failed to approve report: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
