/**
 * Confirm Password Reset
 *
 * Public endpoint. Takes a signed reset token + new password,
 * validates the token, and updates BOTH admin store and employee
 * store wherever the email exists.
 *
 * Body: { token: string, newPassword: string }
 *
 * Token expiry is enforced by JWT `exp` claim. Within the 60-minute
 * window the token is technically replayable — acceptable for the
 * launch. Phase 2 will add JTI tracking in Supabase.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
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

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }
    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must include uppercase, lowercase, and a digit' },
        { status: 400 }
      );
    }

    // Verify the token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    );
    let email: string | null = null;
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.type !== 'password-reset') {
        return NextResponse.json({ error: 'Invalid reset token' }, { status: 403 });
      }
      if (typeof payload.email === 'string') {
        email = payload.email.toLowerCase();
      }
    } catch (err) {
      const msg = (err as Error).message || '';
      const expired = /exp|expir/i.test(msg);
      return NextResponse.json(
        { error: expired ? 'Reset link has expired. Request a new one.' : 'Invalid reset token' },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 403 });
    }

    const updatedStores: string[] = [];

    // 1. Admin store
    try {
      const adminUser = await findUserByEmailFromBlob(email);
      if (adminUser) {
        await resetUserPassword(email, newPassword);
        updatedStores.push('admin');
      }
    } catch (err) {
      console.error('[confirm-reset] admin update failed', err);
    }

    // 2. Employee store
    try {
      const r = await forceResetEmployeePassword(email, newPassword);
      if (r.success) updatedStores.push('employee');
    } catch (err) {
      console.error('[confirm-reset] employee update failed', err);
    }

    if (updatedStores.length === 0) {
      return NextResponse.json(
        { error: 'No account found for this email. Contact your admin.' },
        { status: 404 }
      );
    }

    // Audit log
    try {
      const sb = getSupabaseAdmin();
      if (sb) {
        await sb.from('app_artefact_views').insert({
          artefact_type: 'password_reset_completed',
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
      message: `Password reset successful. You can now log in with your new password.`,
    });
  } catch (err) {
    console.error('[confirm-reset]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
