import { NextRequest, NextResponse } from 'next/server';
import { verifyRMToken, RM_COOKIE_NAME } from '@/lib/auth/rm-jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getDashboardData } from '@/lib/dal/incentives';

/**
 * GET /api/mis/dashboard — RM's personal dashboard data
 * Query: ?month=2026-04 (optional)
 */
export async function GET(request: NextRequest) {
  try {
    let employeeId: number | null = null;

    // Check RM session first
    const rmToken = request.cookies.get(RM_COOKIE_NAME)?.value;
    if (rmToken) {
      const rmUser = await verifyRMToken(rmToken);
      if (rmUser) employeeId = rmUser.employeeId;
    }

    // Fallback: check employee session
    if (!employeeId) {
      const empToken = request.cookies.get(EMPLOYEE_COOKIE)?.value;
      if (empToken) {
        const empUser = await verifyEmployeeToken(empToken);
        if (empUser) employeeId = empUser.employeeId;
      }
    }

    if (!employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get('month') || undefined;
    const data = await getDashboardData(employeeId, month);

    if (!data) {
      return NextResponse.json({ error: 'Dashboard data not available' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API error');
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
