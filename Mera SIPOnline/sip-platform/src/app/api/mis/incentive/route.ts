import { NextRequest, NextResponse } from 'next/server';
import { verifyRMToken, RM_COOKIE_NAME } from '@/lib/auth/rm-jwt';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { calculateLiveIncentive, getCompanyLeaderboard } from '@/lib/dal/incentives';

/**
 * GET /api/mis/incentive
 * ?employeeId=X&month=YYYY-MM (admin)
 * or just ?month=YYYY-MM (RM — uses own ID)
 * ?leaderboard=true (admin only — company leaderboard)
 */
export async function GET(request: NextRequest) {
  try {
    let employeeId: number | undefined;
    let isAdmin = false;

    const rmToken = request.cookies.get(RM_COOKIE_NAME)?.value;
    const adminToken = request.cookies.get(COOKIE_NAME)?.value;

    if (rmToken) {
      const user = await verifyRMToken(rmToken);
      if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      employeeId = user.employeeId;
    } else if (adminToken) {
      const user = await verifyToken(adminToken);
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      isAdmin = user.role === 'admin';
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const month = request.nextUrl.searchParams.get('month') || undefined;
    const leaderboard = request.nextUrl.searchParams.get('leaderboard');

    // Company leaderboard (admin only)
    if (leaderboard === 'true' && isAdmin) {
      const data = await getCompanyLeaderboard(month);
      return NextResponse.json({ leaderboard: data });
    }

    // Individual incentive calculation
    const empIdParam = request.nextUrl.searchParams.get('employeeId');
    const targetEmpId = isAdmin && empIdParam ? parseInt(empIdParam) : employeeId;

    if (!targetEmpId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    // Non-admin can only see own incentive
    if (!isAdmin && targetEmpId !== employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const incentive = await calculateLiveIncentive(targetEmpId, month);
    if (!incentive) {
      return NextResponse.json({ error: 'No incentive data available' }, { status: 404 });
    }

    return NextResponse.json({ incentive });
  } catch (error) {
    console.error('Incentive API error');
    return NextResponse.json({ error: 'Failed to calculate incentive' }, { status: 500 });
  }
}
