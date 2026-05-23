import { NextRequest, NextResponse } from 'next/server';
import { getReportEntry, updateReportEntry } from '@/lib/admin/report-queue-store';
import type { EditHistoryEntry } from '@/types/report-queue';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminEmail = request.headers.get('x-admin-email') || 'unknown';
    const body = await request.json();
    const { reason } = body as { reason: string };

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const entry = await getReportEntry(id);
    if (!entry) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (entry.status === 'sent') {
      return NextResponse.json({ error: 'Cannot reject — report already sent' }, { status: 409 });
    }

    const historyEntry: EditHistoryEntry = {
      timestamp: new Date().toISOString(),
      adminEmail,
      action: 'rejected',
      details: reason,
    };

    await updateReportEntry(id, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason,
      editHistory: [...entry.editHistory, historyEntry],
    });

    return NextResponse.json({ success: true, message: 'Report rejected' });
  } catch (error) {
    console.error('[Reject] Error:', error);
    return NextResponse.json({ error: 'Failed to reject report' }, { status: 500 });
  }
}
