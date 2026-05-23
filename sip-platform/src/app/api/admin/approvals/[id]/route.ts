import { NextRequest, NextResponse } from 'next/server';
import {
  getChangeRequest,
  approveChangeRequest,
  rejectChangeRequest,
} from '@/lib/admin/change-request-store';
import { isSuperAdmin } from '@/lib/auth/config';

type AdminRole = 'super_admin' | 'admin' | 'hr' | 'editor' | 'viewer';

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 5, admin: 4, hr: 3, editor: 2, viewer: 1,
};

/** Only admin (4) or super_admin (5) can approve/reject */
function canRoleApprove(role: AdminRole): boolean {
  return (ROLE_HIERARCHY[role] || 0) >= ROLE_HIERARCHY['admin'];
}

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

    // Read identity from middleware-injected headers (trusted, not client-sent)
    const adminEmail = request.headers.get('x-admin-email');
    const adminRole = (request.headers.get('x-admin-role') || 'viewer') as AdminRole;

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // ── Role-based check: only admin / super_admin can approve/reject ──
    if (!canRoleApprove(adminRole)) {
      return NextResponse.json(
        { error: `Unauthorized — your role (${adminRole}) does not have approval authority. Only Admin or Super Admin can review change requests.` },
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

    // Fetch the change request
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

    // ── Maker-checker: cannot approve/reject your own request ──
    // Exception: Super Admin CAN self-approve incentive slab changes (they have ultimate authority)
    const isSelfRequest = adminEmail.toLowerCase() === entry.requestedBy.toLowerCase();
    const isSuperAdminUser = isSuperAdmin(adminEmail);

    if (isSelfRequest && !(isSuperAdminUser && entry.type === 'incentive_slab')) {
      return NextResponse.json(
        { error: 'Maker-checker violation — you cannot approve or reject your own change request. Another approver must review this.' },
        { status: 403 }
      );
    }

    // ── Incentive slab changes require Super Admin approval ──
    if (entry.type === 'incentive_slab' && action === 'approve') {
      if (!isSuperAdminUser) {
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
      console.log(`[Approvals API] Approved ${id} by ${adminEmail} (role: ${adminRole})`);
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

    console.log(`[Approvals API] Rejected ${id} by ${adminEmail} (role: ${adminRole})`);
    return NextResponse.json({ success: true, approval: updated });
  } catch (error) {
    console.error('[Approvals API] Review error:', error);
    return NextResponse.json(
      { error: `Failed to process review: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
