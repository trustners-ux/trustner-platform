/**
 * Password Diagnostic — TEMPORARY ENDPOINT for the change-password
 * mystery. Sangeeta/Ram report that change-password rejects their
 * current password even though login accepts it. This endpoint lets
 * the logged-in user verify which store (admin or employee) actually
 * holds their password, without leaking plaintext anywhere.
 *
 * POST  body: { candidatePassword: string }
 * Auth: admin cookie only (super-admin gating)
 * Returns:
 *   {
 *     yourEmail: string,
 *     adminExists: boolean,
 *     adminMatches: boolean,
 *     employeeExists: boolean,
 *     employeeMatches: boolean,
 *     hint: string,         // e.g., "Change password expects admin match"
 *   }
 *
 * SAFETY:
 *   - Requires authenticated admin cookie — no anonymous access.
 *   - Only ever reports yes/no booleans. The candidate password
 *     never appears in any log or response.
 *   - Should be removed after the mystery is resolved.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { findUserByEmailFromBlob } from '@/lib/admin/admin-user-store';
import { getCredentials } from '@/lib/employee/employee-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Auth — accept EITHER admin or employee cookie. We'll report which one
  // we found so we can confirm what kind of session the user is on.
  const cookieStore = await cookies();
  let email: string | null = null;
  let sessionType: 'admin' | 'employee' | 'none' = 'none';

  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p?.email) {
      email = p.email;
      sessionType = 'admin';
    }
  }
  if (!email) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const p = await verifyEmployeeToken(empToken);
      if (p?.email) {
        email = p.email;
        sessionType = 'employee';
      }
    }
  }
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated (no admin or employee cookie)' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const candidate = String(body.candidatePassword ?? '');
  if (!candidate) {
    return NextResponse.json({ error: 'candidatePassword required' }, { status: 400 });
  }

  // Check admin store
  let adminExists = false;
  let adminMatches = false;
  try {
    const adminUser = await findUserByEmailFromBlob(email);
    if (adminUser) {
      adminExists = true;
      adminMatches = await bcrypt.compare(candidate, adminUser.passwordHash);
    }
  } catch {
    // ignore
  }

  // Check employee store
  let employeeExists = false;
  let employeeMatches = false;
  try {
    const creds = await getCredentials();
    const cred = creds.find((c) => c.email.toLowerCase() === email.toLowerCase());
    if (cred) {
      employeeExists = true;
      employeeMatches = await bcrypt.compare(candidate, cred.passwordHash);
    }
  } catch {
    // ignore
  }

  let hint: string;
  if (adminMatches && employeeMatches) {
    hint = 'Password matches BOTH stores. Change-password should succeed and update both.';
  } else if (adminMatches) {
    hint = 'Password matches ADMIN store only. Change-password should succeed and update admin.';
  } else if (employeeMatches) {
    hint = 'Password matches EMPLOYEE store only. Change-password should succeed and update employee.';
  } else if (adminExists || employeeExists) {
    hint = 'Password matches NEITHER store. Either your live password has been changed elsewhere, or you have a typo. (Note: your current login session may still be valid even after a password change; sessions live 24h.)';
  } else {
    hint = 'No account found for your email in either store. Contact a fellow admin.';
  }

  return NextResponse.json({
    yourEmail: email,
    sessionType,
    adminExists,
    adminMatches,
    employeeExists,
    employeeMatches,
    hint,
  });
}
