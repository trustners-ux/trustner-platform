import { NextRequest, NextResponse } from 'next/server';
import { createResetRequest, getPendingRequestsForManager } from '@/lib/employee/employee-auth';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';

/**
 * POST /api/employee/auth/reset-request — Create a password reset request (public)
 * GET  /api/employee/auth/reset-request — Get pending requests for manager (authenticated)
 */

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await createResetRequest(email.trim());
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset request submitted successfully.',
      approvers: result.approvers,
    });
  } catch (err) {
    console.error('[ResetRequest]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(EMPLOYEE_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyEmployeeToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const requests = await getPendingRequestsForManager(payload.employeeId);
    return NextResponse.json({ requests });
  } catch (err) {
    console.error('[GetResetRequests]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
