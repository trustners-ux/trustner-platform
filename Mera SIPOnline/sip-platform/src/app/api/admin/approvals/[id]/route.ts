import { NextRequest, NextResponse } from 'next/server';
import {
  getChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
} from '@/lib/admin/change-request-store';
import { isApprover, isSuperAdmin } from '@/lib/auth/config';

// ─── GET: Get single change request ───
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await getChangeRequest(id);

    if (!entry) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 });
    }

    return NextResponse.json({ approval: entry });
  } catch (error) {
    console.error('[Approvals API] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch change request' },
      { status: 500 }
    );
  }
}

// ─── POST: Approve or reject a change request ───
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminEmail = request.headers.get('x-admin-email');

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Missing x-admin-email header' },
        { status: 401 }
      );
    }

    // Only approvers can approve/reject
    if (!isApprover(adminEmail)) {
      return NextResponse.json(
        { error: 'Unauthorized — only designated approvers can review change requests' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, reason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Fetch the change request to check type-specific rules
    const entry = await getChangeRequest(id);
    if (!entry) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 });
    }

    if (entry.status !== 'pending') {
      return NextResponse.json(
        { error: `Change request already ${entry.status}` },
        { status: 409 }
      );
    }

    // Incentive slab changes require super admin (Ram only) approval
    if (entry.type === 'incentive_slab' && action === 'approve') {
      if (!isSuperAdmin(adminEmail)) {
        return NextResponse.json(
          { error: 'Incentive slab changes can only be approved by the Super Admin' },
          { status: 403 }
        );
      }
    }

    if (action === 'approve') {
      const updated = await approveChangeRequest(id, adminEmail);
      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to approve change request' },
          { status: 500 }
        );
      }
      console.log(`[Approvals API] Approved ${id} by ${adminEmail}`);
      return NextResponse.json({ success: true, approval: updated });
    }

    // Reject
    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const updated = await rejectChangeRequest(id, adminEmail, reason);
    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to reject change request' },
        { status: 500 }
      );
    }

    console.log(`[Approvals API] Rejected ${id} by ${adminEmail}`);
    return NextResponse.json({ success: true, approval: updated });
  } catch (error) {
    console.error('[Approvals API] Review error:', error);
    return NextResponse.json(
      { error: `Failed to process review: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
