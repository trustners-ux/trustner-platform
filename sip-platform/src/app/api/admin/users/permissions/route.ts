import { NextRequest, NextResponse } from 'next/server';
import {
  getAllActiveEmployees,
  findEmployeeById,
  getDirectReports,
  getReportingChain,
} from '@/lib/employee/employee-directory';
import {
  getEmployeePermissions,
  updateEmployeePermissions,
  getAllPermissionOverrides,
  DEFAULT_PERMISSIONS,
  ALL_PERMISSION_KEYS,
  type PermissionKey,
} from '@/lib/employee/permissions';

/**
 * GET /api/admin/users/permissions
 * Returns all employees with their resolved permissions.
 */
export async function GET() {
  try {
    const employees = getAllActiveEmployees();
    const overrides = await getAllPermissionOverrides();
    const overrideMap = new Map(overrides.map(o => [o.employeeId, o]));

    const result = employees.map((emp) => {
      const defaults = DEFAULT_PERMISSIONS[emp.role] || DEFAULT_PERMISSIONS.rm;
      const override = overrideMap.get(emp.id);

      // Merge permissions
      const permissions = { ...defaults };
      if (override) {
        for (const [key, val] of Object.entries(override.permissions)) {
          if (key in permissions) {
            (permissions as Record<string, boolean>)[key] = val as boolean;
          }
        }
      }

      const head = emp.reportingHeadId ? findEmployeeById(emp.reportingHeadId) : null;
      const reports = getDirectReports(emp.id);

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        companyGroup: emp.companyGroup,
        jobLocation: emp.jobLocation,
        role: emp.role,
        doj: emp.doj,
        canApproveResets: emp.canApproveResets,
        reportingHead: head?.name || '—',
        directReports: reports.length,
        permissions,
        isEnabled: override ? override.isEnabled : true,
        hasOverrides: !!override && Object.keys(override.permissions).length > 0,
        lastModifiedBy: override?.lastModifiedBy || null,
        lastModifiedAt: override?.lastModifiedAt || null,
      };
    });

    return NextResponse.json({ employees: result });
  } catch (err) {
    console.error('[Permissions GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users/permissions
 * Update permissions for a specific employee.
 * Body: { employeeId, permissions: Record<string, boolean>, isEnabled: boolean }
 */
export async function PUT(req: NextRequest) {
  try {
    const adminEmail = req.headers.get('x-admin-email');
    if (!adminEmail) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { employeeId, permissions, isEnabled } = await req.json();

    if (!employeeId || typeof permissions !== 'object' || typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const employee = findEmployeeById(employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Validate permission keys
    const validPerms: Record<PermissionKey, boolean> = {} as Record<PermissionKey, boolean>;
    for (const key of ALL_PERMISSION_KEYS) {
      validPerms[key] = typeof permissions[key] === 'boolean' ? permissions[key] : false;
    }

    await updateEmployeePermissions(
      employeeId,
      employee.role,
      validPerms,
      isEnabled,
      adminEmail
    );

    return NextResponse.json({
      success: true,
      message: `Permissions updated for ${employee.name}`,
    });
  } catch (err) {
    console.error('[Permissions PUT]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
