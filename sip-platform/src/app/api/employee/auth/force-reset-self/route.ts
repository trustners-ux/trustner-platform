/**
 * Force-Reset Self — emergency password recovery for users with a
 * valid session whose stored password has rotated.
 *
 * Use case (the one we hit at launch):
 *   - Sangeeta / Ram logged in many hours ago. JWT lives 24h.
 *   - Password got rotated (maybe by setup script, maybe by a half-
 *     completed earlier change attempt). The stored hash no longer
 *     matches what they remember typing at login.
 *   - They can&apos;t use change-password because that requires the
 *     CURRENT password.
 *   - But the JWT is still valid, so the server trusts the email.
 *
 * Trade-off: lets a valid session set a new password without proving
 * knowledge of the current one. That&apos;s acceptable because anyone
 * holding a valid admin JWT can already do anything the admin can do
 * — including triggering downstream password resets via the existing
 * OTP flow. We&apos;re not increasing the blast radius of a stolen cookie.
 *
 * Body: { newPassword: string }
 * Auth: admin or employee cookie
 * Updates: BOTH admin store (if user exists there) AND employee
 *          credential store (if exists). Returns which stores were
 *          updated.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import {
  findUserByEmailFromBlob,
  resetUserPassword,
} from '@/lib/admin/admin-user-store';
import { forceResetEmployeePassword } from '@/lib/employee/employee-auth';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  // Auth: must have a valid session cookie (admin OR employee)
  const cookieStore = await cookies();
  let email: string | null = null;

  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p?.email) email = p.email;
  }
  if (!email) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const p = await verifyEmployeeToken(empToken);
      if (p?.email) email = p.email;
    }
  }
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const newPassword = String(body.newPassword ?? '');
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'New password must be at least 8 characters' },
      { status: 400 }
    );
  }
  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return NextResponse.json(
      { error: 'New password must include uppercase, lowercase, and a digit' },
      { status: 400 }
    );
  }

  const updatedStores: string[] = [];

  // 1. Admin store — if user exists there
  try {
    const adminUser = await findUserByEmailFromBlob(email);
    if (adminUser) {
      await resetUserPassword(email, newPassword);
      updatedStores.push('admin');
    }
  } catch (err) {
    console.error('[force-reset-self] admin store update failed', err);
  }

  // 2. Employee credential store — if user exists there
  try {
    const empResult = await forceResetEmployeePassword(email, newPassword);
    if (empResult.success) {
      updatedStores.push('employee');
    }
  } catch (err) {
    console.error('[force-reset-self] employee store update failed', err);
  }

  if (updatedStores.length === 0) {
    return NextResponse.json(
      { error: 'No account found in either store. Contact a fellow admin.' },
      { status: 404 }
    );
  }

  // Audit log
  try {
    const sb = getSupabaseAdmin();
    if (sb) {
      await sb.from('app_artefact_views').insert({
        artefact_type: 'force_reset_self',
        artefact_id: 0,
        actor_employee_id: null,
        actor_email: email,
        view_count: 1,
      });
    }
  } catch {
    // best-effort
  }

  return NextResponse.json({
    success: true,
    email,
    updatedStores,
    message: `Password reset for ${updatedStores.join(' + ')} store(s). Log out and back in with the new password.`,
  });
}
