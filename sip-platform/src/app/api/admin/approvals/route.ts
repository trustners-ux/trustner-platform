import { NextRequest, NextResponse } from 'next/server';
import {
  getChangeRequests,
  createChangeRequest,
} from '@/lib/admin/change-request-store';
import { findUserByEmail } from '@/lib/auth/config';
import type { ChangeRequestType, ChangeRequestStatus } from '@/types/change-request';

// ─── GET: List all change requests ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ChangeRequestType | null;
    const status = searchParams.get('status') as ChangeRequestStatus | null;

    const entries = await getChangeRequests({
      type: type || undefined,
      status: status || undefined,
    });

    return NextResponse.json({ approvals: entries, total: entries.length });
  } catch (error) {
    console.error('[Approvals API] List error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch change requests' },
      { status: 500 }
    );
  }
}

// ─── POST: Create a new change request ───
export async function POST(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Missing x-admin-email header' },
        { status: 401 }
      );
    }

    // Validate that the requester is a known admin user
    const user = findUserByEmail(adminEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized — unknown admin user' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, title, description, changeData, previousData } = body;

    if (!type || !title || !changeData) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, changeData' },
        { status: 400 }
      );
    }

    const validTypes: ChangeRequestType[] = [
      'incentive_slab',
      'product_rule',
      'employee_add',
      'employee_edit',
      'employee_delete',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const entry = await createChangeRequest({
      type,
      title,
      description: description || '',
      requestedBy: adminEmail,
      requestedByName: user.name,
      changeData,
      previousData: previousData || null,
    });

    console.log(`[Approvals API] Created change request ${entry.id} by ${adminEmail}`);
    return NextResponse.json({ success: true, approval: entry }, { status: 201 });
  } catch (error) {
    console.error('[Approvals API] Create error:', error);
    return NextResponse.json(
      { error: `Failed to create change request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
