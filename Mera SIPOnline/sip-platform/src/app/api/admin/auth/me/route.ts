import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';

type AdminRole = 'super_admin' | 'admin' | 'hr' | 'editor' | 'viewer';

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
        user: { email: payload.email, name: payload.name, role: payload.role },
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
        },
      });
    }
  }

  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
}
