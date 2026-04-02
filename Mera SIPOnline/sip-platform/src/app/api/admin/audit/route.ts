import { NextRequest, NextResponse } from 'next/server';
import { getAuditLog } from '@/lib/dal/audit';

// ─── GET: Fetch audit log entries ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('tableName') || undefined;
    const action = searchParams.get('action') || undefined;
    const changedBy = searchParams.get('changedBy') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const entries = await getAuditLog({
      tableName,
      action,
      changedBy,
      limit: Math.min(limit, 500), // Cap at 500
    });

    return NextResponse.json({ entries, total: entries.length });
  } catch (error) {
    console.error('[Audit API] Query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}
