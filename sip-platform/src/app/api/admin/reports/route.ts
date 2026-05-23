import { NextRequest, NextResponse } from 'next/server';
import { getReportQueue } from '@/lib/admin/report-queue-store';
import type { ReportStatus } from '@/types/report-queue';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ReportStatus | null;
    const search = searchParams.get('search') || undefined;

    const entries = await getReportQueue({
      status: status || undefined,
      search,
    });

    return NextResponse.json({ reports: entries, total: entries.length });
  } catch (error) {
    console.error('[Admin Reports] List error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
