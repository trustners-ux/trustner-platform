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

    // Try employee credential store first
    const result = await changePassword(email, currentPassword, newPassword);

    let bothUpdated = false;
    if (result.success) {
      // ALSO update admin password (if user exists in admin store) so the
      // same password works for both portals.
      try {
        const adminUser = await findUserByEmailFromBlob(email);
        if (adminUser) {
          // We've already verified currentPassword against employee creds.
          // Verify it ALSO matches the admin hash before overwriting, to
          // prevent silent overwrite when admin password is different.
          const matchesAdmin = await bcrypt.compare(currentPassword, adminUser.passwordHash);
          if (matchesAdmin) {
            await resetUserPassword(email, newPassword);
            bothUpdated = true;
          }
        }
      } catch {
        // Admin update is best-effort; employee update has already succeeded.
      }

      return NextResponse.json({
        success: true,
        message: bothUpdated
          ? 'Password changed for both Employee + Admin portals.'
          : 'Password changed for the Employee portal.',
      });
    }

    // Employee changePassword failed — maybe the user only exists in admin store
    if (result.error === 'Credential not found') {
      const adminUser = await findUserByEmailFromBlob(email);
      if (adminUser) {
        const matchesAdmin = await bcrypt.compare(currentPassword, adminUser.passwordHash);
        if (!matchesAdmin) {
          return NextResponse.json(
            { success: false, error: 'Current password is incorrect' },
            { status: 401 }
          );
        }
        await resetUserPassword(email, newPassword);
        return NextResponse.json({
          success: true,
          message: 'Password changed for the Admin portal.',
        });
      }
    }

    return NextResponse.json(
      { success: false, error: result.error || 'Failed to change password' },
      { status: result.error === 'Current password is incorrect' ? 401 : 400 }
    );
  } catch (err) {
    console.error('[change-password]', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
