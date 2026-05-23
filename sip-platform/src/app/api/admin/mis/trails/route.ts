import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, canAccess } from '@/lib/auth/config';
import {
  createTrailEntry,
  listTrailEntries,
  approveTrailEntry,
  bulkApproveTrailEntries,
  getTrailSummary,
  getEmployeeTrailSummary,
} from '@/lib/dal/trail-income';
import type { TrailEntryInput, TrailEntryFilters } from '@/lib/dal/trail-income';

// ─── GET: List trail entries or get summary ───
export async function GET(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Missing x-admin-email header' }, { status: 401 });
    }

    const user = findUserByEmail(adminEmail);
    if (!user || !canAccess(user.role, 'hr')) {
      return NextResponse.json({ error: 'Unauthorized — HR role or above required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'summary' | 'employee_summary' | null (list)

    // ─── Summary View ───
    if (view === 'summary') {
      const month = searchParams.get('month') || undefined;
      const summary = await getTrailSummary(month);
      return NextResponse.json({ summary });
    }

    // ─── Employee Summary View ───
    if (view === 'employee_summary') {
      const empId = searchParams.get('employeeId');
      if (!empId) {
        return NextResponse.json({ error: 'employeeId required for employee_summary' }, { status: 400 });
      }
      const month = searchParams.get('month') || undefined;
      const summary = await getEmployeeTrailSummary(Number(empId), month);
      return NextResponse.json({ summary });
    }

    // ─── List View ───
    const filters: TrailEntryFilters = {};
    const month = searchParams.get('month');
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const sourceType = searchParams.get('sourceType');
    const fundCategory = searchParams.get('fundCategory');

    if (month) filters.month = month;
    if (employeeId) filters.employeeId = Number(employeeId);
    if (status) filters.status = status as TrailEntryFilters['status'];
    if (sourceType) filters.sourceType = sourceType as TrailEntryFilters['sourceType'];
    if (fundCategory) filters.fundCategory = fundCategory as TrailEntryFilters['fundCategory'];

    const entries = await listTrailEntries(filters);
    return NextResponse.json({ entries, count: entries.length });
  } catch (error) {
    console.error('[Trails API] GET error:', error);
    return NextResponse.json(
      { error: `Failed to fetch trail data: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// ─── POST: Create entry, approve, or bulk approve ───
export async function POST(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Missing x-admin-email header' }, { status: 401 });
    }

    const user = findUserByEmail(adminEmail);
    if (!user || !canAccess(user.role, 'hr')) {
      return NextResponse.json({ error: 'Unauthorized — HR role or above required' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // ─── Create Entry ───
    if (action === 'create') {
      const input: TrailEntryInput = {
        employeeId: body.employeeId,
        clientPan: body.clientPan,
        clientName: body.clientName,
        sourceType: body.sourceType,
        fundCategory: body.fundCategory,
        amcName: body.amcName,
        schemeName: body.schemeName,
        currentAum: Number(body.currentAum),
        trailRatePct: Number(body.trailRatePct),
        month: body.month,
        notes: body.notes,
      };

      // Validate required fields
      if (!input.employeeId || !input.clientPan || !input.clientName || !input.sourceType ||
          !input.fundCategory || !input.amcName || !input.schemeName || !input.currentAum || !input.trailRatePct) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const entry = await createTrailEntry(input, adminEmail);
      return NextResponse.json({ success: true, entry }, { status: 201 });
    }

    // ─── Approve Entry (admin only) ───
    if (action === 'approve') {
      if (!canAccess(user.role, 'admin')) {
        return NextResponse.json({ error: 'Unauthorized — Admin role required to approve' }, { status: 403 });
      }

      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: 'Missing entry id' }, { status: 400 });
      }

      const entry = await approveTrailEntry(id, adminEmail, user.name);
      return NextResponse.json({ success: true, entry });
    }

    // ─── Bulk Approve (admin only) ───
    if (action === 'bulk_approve') {
      if (!canAccess(user.role, 'admin')) {
        return NextResponse.json({ error: 'Unauthorized — Admin role required to approve' }, { status: 403 });
      }

      const { ids } = body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'Missing or empty ids array' }, { status: 400 });
      }

      const count = await bulkApproveTrailEntries(ids, adminEmail, user.name);
      return NextResponse.json({ success: true, count, message: `${count} entries approved` });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[Trails API] POST error:', error);
    return NextResponse.json(
      { error: `Failed to process trail action: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
