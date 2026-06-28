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
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { setPdAccessByEmail } from '@/lib/portfolio-diagnostic/access-admin';

/**
 * GET /api/admin/users/permissions
 * Returns all employees with their resolved permissions.
 */
export async function GET() {
  try {
    const employees = getAllActiveEmployees();
    const overrides = await getAllPermissionOverrides();
    const overrideMap = new Map(overrides.map(o => [o.employeeId, o]));

    // Live PD-access state (the real source of truth is pd_employee_roles, not
    // the override table). One batched query → email → { access, canReview }.
    const pdByEmail = new Map<string, { access: boolean; canReview: boolean }>();
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data: grants } = await sb
        .from('pd_employee_roles')
        .select('can_access_pd, is_active, emp:employees(email), role:pd_roles(can_review)')
        .eq('is_active', true);
      for (const g of grants ?? []) {
        const e = (g as Record<string, unknown>).emp;
        const eo = Array.isArray(e) ? (e[0] as Record<string, unknown>) : (e as Record<string, unknown>);
        const email = (eo?.email as string | null)?.toLowerCase();
        if (!email) continue;
        const r = (g as Record<string, unknown>).role;
        const ro = Array.isArray(r) ? (r[0] as Record<string, unknown>) : (r as Record<string, unknown>);
        pdByEmail.set(email, {
          access: (g.can_access_pd as boolean | null) !== false,
          canReview: Boolean(ro?.can_review),
        });
      }
    }

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

      // PD access/review reflect the real DB grant, not the override table.
      const pd = pdByEmail.get(emp.email.toLowerCase());
      (permissions as Record<string, boolean>).pd_access = !!pd?.access;
      (permissions as Record<string, boolean>).pd_review = !!pd?.canReview;

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

    // Bridge the two Portfolio-Diagnostic toggles to the real PD access store
    // (pd_employee_roles). This is what makes the User Management on/off control
    // actually grant/revoke PD — admins only (route is admin-role gated).
    let pdBridged = false;
    const sb = getSupabaseAdmin();
    if (sb && (typeof permissions.pd_access === 'boolean' || typeof permissions.pd_review === 'boolean')) {
      const access = isEnabled && permissions.pd_access === true;
      const canReview = access && permissions.pd_review === true;
      await setPdAccessByEmail(sb, employee, { access, canReview });
      pdBridged = true;
    }

    return NextResponse.json({
      success: true,
      message: `Permissions updated for ${employee.name}`,
      pdBridged,
    });
  } catch (err) {
    console.error('[Permissions PUT]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
