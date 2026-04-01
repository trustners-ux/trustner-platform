import { NextRequest, NextResponse } from 'next/server';
import { verifyRMToken, RM_COOKIE_NAME } from '@/lib/auth/rm-jwt';
import { getDashboardData } from '@/lib/dal/incentives';

/**
 * GET /api/mis/dashboard — RM's personal dashboard data
 * Query: ?month=2026-04 (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Check RM auth
    const token = request.cookies.get(RM_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyRMToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get('month') || undefined;
    const data = await getDashboardData(user.employeeId, month);

    if (!data) {
      return NextResponse.json({ error: 'Dashboard data not available' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API error');
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
