import { NextRequest, NextResponse } from 'next/server';
import { approveResetRequest } from '@/lib/employee/employee-auth';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';

/**
 * POST /api/employee/auth/approve-reset
 * Manager approves or rejects a password reset request.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(EMPLOYEE_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyEmployeeToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Check if user can approve resets
    if (!payload.canApproveResets) {
      return NextResponse.json({ error: 'You are not authorized to approve password resets' }, { status: 403 });
    }

    const { requestId, action } = await req.json();
    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const result = await approveResetRequest(requestId, payload.employeeId, action);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (action === 'approve') {
      return NextResponse.json({
        success: true,
        message: 'Password reset approved. Temporary password generated.',
        tempPassword: result.tempPassword,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset request rejected.',
    });
  } catch (err) {
    console.error('[ApproveReset]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
