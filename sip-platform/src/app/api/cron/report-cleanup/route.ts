import { NextRequest, NextResponse } from 'next/server';
import { getReportQueue } from '@/lib/admin/report-queue-store';

/**
 * Cron job: runs weekly (Sunday 3 AM).
 * AUTO-DELETION DISABLED — All reports are retained permanently.
 * Storage can be expanded via Vercel Blob subscription if needed.
 * This endpoint now only returns stats for monitoring.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allReports = await getReportQueue();

    const stats = {
      total: allReports.length,
      pending: allReports.filter(r => r.status === 'pending_review').length,
      approved: allReports.filter(r => r.status === 'approved').length,
      sent: allReports.filter(r => r.status === 'sent').length,
      rejected: allReports.filter(r => r.status === 'rejected').length,
    };

    console.log(`[Report Stats] Total: ${stats.total}, Pending: ${stats.pending}, Sent: ${stats.sent}`);

    return NextResponse.json({
      success: true,
      message: 'Auto-deletion disabled. All reports retained permanently.',
      stats,
      deleted: 0,
    });
  } catch (error) {
    console.error('[Report Stats] Error:', error);
    return NextResponse.json(
      { error: 'Stats check failed' },
      { status: 500 }
    );
  }
}
