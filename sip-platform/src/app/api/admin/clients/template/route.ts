/**
 * Client Master Template Download
 *
 * GET /api/admin/clients/template
 *
 * Returns a ready-to-fill CSV with the canonical Trustner column
 * headers + 2 example rows. The team can open this in Excel,
 * paste their existing data, save as CSV (or keep as XLSX), and
 * upload via /admin/clients/import.
 *
 * Auth: same as the import endpoint — principal or can_manage_users.
 * The template itself doesn't contain client data, but we still gate
 * it to prevent leaking the canonical schema to lower-privilege roles.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { APPROVER_EMAILS } from '@/lib/auth/config';
import { buildCsvTemplate } from '@/lib/clients/import-parser';

export async function GET() {
  const authz = await authorize();
  if (!authz.allowed) return NextResponse.json({ error: authz.reason }, { status: authz.status });

  const csv = buildCsvTemplate();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="trustner-client-import-template.csv"',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

async function authorize(): Promise<{ allowed: true } | { allowed: false; status: number; reason: string }> {
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
  if (!email) return { allowed: false, status: 401, reason: 'Not authenticated' };
  if (APPROVER_EMAILS.includes(email.toLowerCase())) return { allowed: true };
  const supabase = getSupabaseAdmin();
  if (!supabase) return { allowed: false, status: 500, reason: 'Database unavailable' };
  const { data: empRow } = await supabase
    .from('employees').select('id').ilike('email', email.trim()).maybeSingle();
  if (!empRow?.id) return { allowed: false, status: 403, reason: 'Employee row not found' };
  const { data: roleRow } = await supabase
    .from('pd_employee_roles')
    .select('role:pd_roles!inner(can_manage_users)')
    .eq('employee_id', empRow.id)
    .eq('is_active', true)
    .maybeSingle();
  const role = (roleRow as { role?: unknown })?.role;
  const r = Array.isArray(role) ? role[0] : role;
  if (!Boolean((r as { can_manage_users?: boolean } | undefined)?.can_manage_users)) {
    return { allowed: false, status: 403, reason: 'Need can_manage_users (admin) role' };
  }
  return { allowed: true };
}
