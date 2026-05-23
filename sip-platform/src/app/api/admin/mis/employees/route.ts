import { NextRequest, NextResponse } from 'next/server';
import { getEmployees } from '@/lib/dal/employees';
import { createChangeRequest } from '@/lib/admin/change-request-store';
import { findUserByEmail } from '@/lib/auth/config';
import type { Entity, Segment } from '@/lib/mis/types';

// ─── GET: Return all employees ───
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') as Entity | null;
    const segment = searchParams.get('segment') as Segment | null;
    const search = searchParams.get('search') || undefined;

    const employees = await getEmployees({
      entity: entity || undefined,
      segment: segment || undefined,
      search,
    });

    return NextResponse.json({ employees, total: employees.length });
  } catch (error) {
    console.error('[Employees API] List error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// ─── POST: Create a change request for employee add/edit/deactivate ───
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
    const { action, id, employee, updates, title, description, previousData } = body;

    if (!action || !['add', 'edit', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "add", "edit", or "deactivate"' },
        { status: 400 }
      );
    }

    if (action === 'edit' && (!id || !updates)) {
      return NextResponse.json(
        { error: 'Edit action requires id and updates' },
        { status: 400 }
      );
    }

    if (action === 'add' && !employee) {
      return NextResponse.json(
        { error: 'Add action requires employee data' },
        { status: 400 }
      );
    }

    if (action === 'deactivate' && !id) {
      return NextResponse.json(
        { error: 'Deactivate action requires id' },
        { status: 400 }
      );
    }

    // Map action to change request type
    const typeMap: Record<string, 'employee_add' | 'employee_edit' | 'employee_delete'> = {
      add: 'employee_add',
      edit: 'employee_edit',
      deactivate: 'employee_delete',
    };

    // Build change data
    const changeData: Record<string, unknown> = { action };
    if (id) changeData.id = id;
    if (employee) changeData.employee = employee;
    if (updates) changeData.updates = updates;

    const entry = await createChangeRequest({
      type: typeMap[action],
      title: title || `Employee ${action}`,
      description: description || `Request to ${action} employee`,
      requestedBy: adminEmail,
      requestedByName: user.name,
      changeData,
      previousData: previousData || null,
    });

    console.log(`[Employees API] Created change request ${entry.id} for employee ${action} by ${adminEmail}`);
    return NextResponse.json({ success: true, approval: entry }, { status: 201 });
  } catch (error) {
    console.error('[Employees API] Create change request error:', error);
    return NextResponse.json(
      { error: `Failed to create employee change request: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
