import { NextRequest, NextResponse } from 'next/server';
import { getReportEntry, updateReportEntry } from '@/lib/admin/report-queue-store';
import type { EditHistoryEntry } from '@/types/report-queue';

// GET /api/admin/reports/[id] — Get single report
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await getReportEntry(id);
    if (!entry) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json({ report: entry });
  } catch (error) {
    console.error('[Admin Reports] Get error:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

// PATCH /api/admin/reports/[id] — Update narrative text or admin notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { editedNarrative, adminNotes } = body as {
      editedNarrative?: string;
      adminNotes?: string;
    };
    const adminEmail = request.headers.get('x-admin-email') || 'unknown';

    // Must provide at least one field to update
    if (!editedNarrative?.trim() && adminNotes === undefined) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    const entry = await getReportEntry(id);
    if (!entry) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminEmail,
    };

    const historyEntries: EditHistoryEntry[] = [];

    if (editedNarrative?.trim()) {
      updates.editedNarrative = editedNarrative;
      updates.narrativeVersion = entry.narrativeVersion + 1;
      historyEntries.push({
        timestamp: new Date().toISOString(),
        adminEmail,
        action: 'narrative_edited',
        details: `Narrative edited (${editedNarrative.length} chars)`,
      });
    }

    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes || null;
      historyEntries.push({
        timestamp: new Date().toISOString(),
        adminEmail,
        action: 'reviewed',
        details: adminNotes ? `Admin notes updated (${adminNotes.length} chars)` : 'Admin notes cleared',
      });
    }

    if (historyEntries.length > 0) {
      updates.editHistory = [...entry.editHistory, ...historyEntries];
    }

    const updated = await updateReportEntry(id, updates);

    return NextResponse.json({ report: updated });
  } catch (error) {
    console.error('[Admin Reports] Patch error:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
