import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getStaleReports, updateReportEntry } from '@/lib/admin/report-queue-store';
import { buildReminderEmailHTML } from '@/lib/utils/report-email-builders';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Cron job: runs every 30 minutes to remind admins about pending reports.
 * Escalation: Reminder 1 at 1h, Reminder 2 at 3h, Reminder 3 at 6h.
 * Max 3 reminders per report.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get reports at different escalation levels
    // Reminder 1: after 1 hour (60 min)
    // Reminder 2: after 3 hours (180 min)
    // Reminder 3: after 6 hours (360 min)
    const thresholds = [
      { minutes: 60, maxReminders: 0 },   // 1h, first reminder
      { minutes: 180, maxReminders: 1 },   // 3h, second reminder
      { minutes: 360, maxReminders: 2 },   // 6h, third and final reminder
    ];

    const reportsToRemind: Array<{
      id: string;
      userName: string;
      totalScore: number;
      grade: string;
      createdAt: string;
      remindersSent: number;
    }> = [];

    for (const { minutes, maxReminders } of thresholds) {
      const stale = await getStaleReports(minutes);
      for (const entry of stale) {
        // Only include if they're at the right reminder level
        if (entry.remindersSent === maxReminders) {
          reportsToRemind.push({
            id: entry.id,
            userName: entry.userName,
            totalScore: entry.totalScore,
            grade: entry.grade,
            createdAt: entry.createdAt,
            remindersSent: entry.remindersSent,
          });
        }
      }
    }

    if (reportsToRemind.length === 0) {
      return NextResponse.json({ message: 'No reports need reminders', reminders: 0 });
    }

    // Send reminder email
    const html = buildReminderEmailHTML(reportsToRemind);
    const isUrgent = reportsToRemind.some(r => r.remindersSent >= 2);

    await getResend().emails.send({
      from: 'Mera SIP Online <leads@merasip.com>',
      to: 'wecare@merasip.com',
      subject: `${isUrgent ? '[URGENT] ' : '[REMINDER] '}${reportsToRemind.length} Financial Report${reportsToRemind.length > 1 ? 's' : ''} Awaiting Review`,
      html,
    });

    // Update reminder counters on each report
    for (const report of reportsToRemind) {
      await updateReportEntry(report.id, {
        remindersSent: report.remindersSent + 1,
        lastReminderAt: new Date().toISOString(),
      });
    }

    console.log(`[Cron Reminders] Sent reminder for ${reportsToRemind.length} report(s)`);

    return NextResponse.json({
      message: `Reminder sent for ${reportsToRemind.length} report(s)`,
      reminders: reportsToRemind.length,
    });
  } catch (error) {
    console.error('[Cron Reminders] Error:', error);
    return NextResponse.json({ error: 'Reminder job failed' }, { status: 500 });
  }
}
