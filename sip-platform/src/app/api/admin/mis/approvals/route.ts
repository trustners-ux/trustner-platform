import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import type { AdminRole } from '@/lib/auth/config';
import {
  listBatches,
  advanceBatch,
  rejectBatch,
  resubmitBatch,
  getBatchHistory,
  getBatchStats,
  getBatch,
  canUserAdvance,
  type ApprovalStatus,
  type LOBType,
} from '@/lib/dal/approval-workflow';

// ─── Auth helper (same pattern as /api/admin/auth/me) ───

const EMPLOYEE_TO_ADMIN_ROLE: Record<string, AdminRole> = {
  bod: 'super_admin',
  cdo: 'admin',
  regional_manager: 'hr',
  branch_head: 'hr',
  cdm: 'editor',
  manager: 'editor',
  mentor: 'viewer',
  sr_rm: 'viewer',
  rm: 'viewer',
  back_office: 'viewer',
  support: 'viewer',
};

interface AuthedUser {
  email: string;
  name: string;
  role: AdminRole;
}

async function getAuthedUser(): Promise<AuthedUser | null> {
  const cookieStore = await cookies();

  // Try admin JWT first
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) {
      return {
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as AdminRole,
      };
    }
  }

  // Fallback to employee JWT
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) {
      return {
        email: payload.email as string,
        name: payload.name as string,
        role: EMPLOYEE_TO_ADMIN_ROLE[payload.role as string] || 'viewer',
      };
    }
  }

  return null;
}

// ─── GET: List batches + stats ───

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || undefined;
    const lob = searchParams.get('lob') as LOBType | null;
    const status = searchParams.get('status') as ApprovalStatus | null;
    const section = searchParams.get('section'); // 'batches' | 'stats' | 'history' | null (all)

    // If requesting history for a specific batch
    if (section === 'history') {
      const batchId = parseInt(searchParams.get('batchId') || '0', 10);
      if (!batchId) {
        return NextResponse.json({ error: 'batchId required for history' }, { status: 400 });
      }
      const history = await getBatchHistory(batchId);
      return NextResponse.json({ history });
    }

    // If requesting stats only
    if (section === 'stats') {
      const stats = await getBatchStats(month || undefined);
      return NextResponse.json({ stats });
    }

    // Default: return batches + stats
    const batches = await listBatches({
      month: month || undefined,
      lob: lob || undefined,
      status: status || undefined,
    });

    const stats = await getBatchStats(month || undefined);

    return NextResponse.json({ batches, stats, user });
  } catch (error) {
    console.error('[Approvals API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval data' },
      { status: 500 }
    );
  }
}

// ─── POST: Action on a batch ───

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthedUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, action, comments, reason } = body;

    if (!batchId || !action) {
      return NextResponse.json(
        { error: 'Missing batchId or action' },
        { status: 400 }
      );
    }

    if (!['advance', 'reject', 'resubmit'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "advance", "reject", or "resubmit"' },
        { status: 400 }
      );
    }

    // Fetch the batch to check permissions
    const batch = await getBatch(batchId);
    if (!batch) {
      return NextResponse.json({ error: `Batch ${batchId} not found` }, { status: 404 });
    }

    // Permission check for advance
    if (action === 'advance') {
      if (!canUserAdvance(batch.status, user.role, user.email)) {
        return NextResponse.json(
          { error: `You do not have permission to advance a batch from "${batch.status}" status` },
          { status: 403 }
        );
      }

      const updated = await advanceBatch(batchId, user.email, user.name, comments);
      return NextResponse.json({
        success: true,
        message: `Batch ${batchId} advanced to ${updated.status}`,
        batch: updated,
      });
    }

    // Reject
    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      // Only admin+ can reject
      if (!['admin', 'super_admin'].includes(user.role)) {
        return NextResponse.json(
          { error: 'Only admins can reject batches' },
          { status: 403 }
        );
      }

      const updated = await rejectBatch(batchId, user.email, user.name, reason);
      return NextResponse.json({
        success: true,
        message: `Batch ${batchId} rejected`,
        batch: updated,
      });
    }

    // Resubmit
    if (action === 'resubmit') {
      if (batch.status !== 'rejected') {
        return NextResponse.json(
          { error: 'Only rejected batches can be resubmitted' },
          { status: 400 }
        );
      }

      // hr+ can resubmit
      if (!['hr', 'admin', 'super_admin'].includes(user.role)) {
        return NextResponse.json(
          { error: 'You do not have permission to resubmit batches' },
          { status: 403 }
        );
      }

      const updated = await resubmitBatch(batchId, user.email, user.name);
      return NextResponse.json({
        success: true,
        message: `Batch ${batchId} resubmitted to ${updated.status}`,
        batch: updated,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Approvals API] POST error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process approval action: ${message}` },
      { status: 500 }
    );
  }
}
