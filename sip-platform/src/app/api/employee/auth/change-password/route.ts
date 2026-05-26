import { NextRequest, NextResponse } from 'next/server';
import { changePassword } from '@/lib/employee/employee-auth';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { resetUserPassword, findUserByEmailFromBlob } from '@/lib/admin/admin-user-store';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Auth routes: always dynamic, Node runtime, zero caching.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

/**
 * POST /api/employee/auth/change-password
 * Body: { currentPassword, newPassword }
 *
 * Authenticated user changes their own password.
 * Updates BOTH the employee credentials blob AND (if the user also exists
 * in the admin users blob with the same email) the admin password — so
 * the user can sign in via either portal with the same password.
 */
export async function POST(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'currentPassword and newPassword are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { success: false, error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Resolve the authenticated user's email from either cookie
    const cookieStore = await cookies();
    let email: string | null = null;

    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const payload = await verifyEmployeeToken(empToken);
      if (payload?.email) email = payload.email;
    }
    if (!email) {
      const adminToken = cookieStore.get(COOKIE_NAME)?.value;
      if (adminToken) {
        const payload = await verifyToken(adminToken);
        if (payload?.email) email = payload.email;
      }
    }
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // ─── Strategy: try BOTH stores, accept the one where the password matches ───
    //
    // A user can have entries in BOTH the employee credential store AND the
    // admin store (Sangeeta does — she's listed in admin for portal access
    // AND in employees for hierarchy/permissions). The two stores can have
    // DIFFERENT passwords because they're independently managed.
    //
    // Old logic tried employee FIRST and only fell back to admin if the
    // employee row was missing. Result: when an admin user logged in with
    // their admin password and tried to change it, the employee hash check
    // failed first and the endpoint returned 401 — even though the password
    // was correct for the admin store.
    //
    // New logic: probe BOTH stores. If currentPassword matches in admin,
    // update admin. If it matches in employee, update employee. If it
    // matches in both, update both (keeping the dual portals in sync).
    // Only return 401 if it matches NEITHER.

    const employeeResult = await changePassword(email, currentPassword, newPassword);
    const employeeOk = employeeResult.success;
    const employeeNotFound = employeeResult.error === 'Credential not found';

    let adminOk = false;
    let adminFound = false;
    try {
      const adminUser = await findUserByEmailFromBlob(email);
      if (adminUser) {
        adminFound = true;
        const matches = await bcrypt.compare(currentPassword, adminUser.passwordHash);
        if (matches) {
          await resetUserPassword(email, newPassword);
          adminOk = true;
        }
      }
    } catch (err) {
      console.error('[change-password] admin update failed', err);
    }

    if (employeeOk && adminOk) {
      return NextResponse.json({
        success: true,
        message: 'Password changed for both Employee + Admin portals.',
      });
    }
    if (employeeOk) {
      return NextResponse.json({
        success: true,
        message: 'Password changed for the Employee portal.',
      });
    }
    if (adminOk) {
      return NextResponse.json({
        success: true,
        message: 'Password changed for the Admin portal.',
      });
    }

    // Neither store accepted the password.
    // Distinguish "no account at all" from "wrong password".
    if (employeeNotFound && !adminFound) {
      return NextResponse.json(
        { success: false, error: 'No password is set for your account yet — contact an admin.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Current password is incorrect' },
      { status: 401 }
    );
  } catch (err) {
    console.error('[change-password]', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
