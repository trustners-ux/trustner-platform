import { NextRequest, NextResponse } from 'next/server';
import { getIncentiveSlabs } from '@/lib/dal/incentive-slabs';
import { createChangeRequest } from '@/lib/admin/change-request-store';
import { findUserByEmail } from '@/lib/auth/config';
import type { SlabTable } from '@/lib/mis/types';

// ─── GET: Return all incentive slabs ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table') as SlabTable | null;

    const slabs = await getIncentiveSlabs(tableName || undefined);

    return NextResponse.json({ slabs, total: slabs.length });
  } catch (error) {
    console.error('[Slabs API] List error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incentive slabs' },
      { status: 500 }
    );
  }
}

// ─── POST: Create a change request for slab modification ───
export async function POST(request: NextRequest) {
  try {
    const adminEmail = request.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Missing x-admin-email header' },
        { status: 401 }
      );
    }

    const user = findUserByEmail(adminEmail);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized — unknown admin user' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, id, slab, updates, title, description, previousData } = body;

    if (!action || !['insert', 'update', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "insert", "update", or "delete"' },
        { status: 400 }
      );
    }

    if (action === 'update' && (!id || !updates)) {
      return NextResponse.json(
        { error: 'Update action requires id and updates' },
        { status: 400 }
      );
    }

    if (action === 'insert' && !slab) {
      return NextResponse.json(
        { error: 'Insert action requires slab data' },
        { status: 400 }
      );
    }

    if (action === 'delete' && !id) {
      return NextResponse.json(
        { error: 'Delete action requires id' },
        { status: 400 }
      );
    }

    // Build change data
    const changeData: Record<string, unknown> = { action };
    if (id) changeData.id = id;
    if (slab) changeData.slab = slab;
    if (updates) changeData.updates = updates;

    const entry = await createChangeRequest({
      type: 'incentive_slab',
      title: title || `Incentive slab ${action}`,
      description: description || `Request to ${action} incentive slab`,
      requestedBy: adminEmail,
      requestedByName: user.name,
      changeData,
      previousData: previousData || null,
    });

    console.log(`[Slabs API] Created change request ${entry.id} for slab ${action} by ${adminEmail}`);
    return NextResponse.json({ success: true, approval: entry }, { status: 201 });
  } catch (error) {
    console.error('[Slabs API] Create change request error:', error);
    return NextResponse.json(
      { error: `Failed to create slab change request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
