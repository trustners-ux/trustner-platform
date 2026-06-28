import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';

type AdminRole = 'super_admin' | 'admin' | 'hr' | 'editor' | 'viewer';

/**
 * Does this email hold an active Portfolio Diagnostic grant (can_access_pd)?
 * Drives PD/Advisory-Workbench nav visibility independently of the generic
 * admin-role ladder — so a granted RM sees PD even though they map to 'viewer'.
 * Best-effort: any failure → false (fail closed, never throws).
 */
async function resolveHasPdAccess(email: string): Promise<boolean> {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return false;
    const { data: emp } = await sb
      .from('employees')
      .select('id')
      .ilike('email', email.trim())
      .maybeSingle();
    if (!emp?.id) return false;
    const { data: roleRow } = await sb
      .from('pd_employee_roles')
      .select('can_access_pd, is_active')
      .eq('employee_id', emp.id as number)
      .eq('is_active', true)
      .maybeSingle();
    return !!roleRow && (roleRow.can_access_pd as boolean | null) !== false;
  } catch {
    return false;
  }
}

const EMPLOYEE_TO_ADMIN_ROLE: Record<string, AdminRole> = {
  bod: 'super_admin',
  cdo: 'admin',
  regional_manager: 'hr',
  branch_head: 'hr',
  cdm: 'editor',
  manager: 'editor',
  mentor: 'viewer',
  sr_rm: 'viewer',
  rm: 'viewer',
  back_office: 'viewer',
  support: 'viewer',
};

export async function GET() {
  const cookieStore = await cookies();

  // Try admin JWT first
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) {
      return NextResponse.json({
        user: {
          email: payload.email,
          name: payload.name,
          role: payload.role,
          hasPdAccess: await resolveHasPdAccess(payload.email),
        },
      });
    }
  }

  // Fallback to employee JWT
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) {
      return NextResponse.json({
        user: {
          email: payload.email,
          name: payload.name,
          role: EMPLOYEE_TO_ADMIN_ROLE[payload.role] || 'viewer',
          hasPdAccess: await resolveHasPdAccess(payload.email),
        },
      });
    }
  }

  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
