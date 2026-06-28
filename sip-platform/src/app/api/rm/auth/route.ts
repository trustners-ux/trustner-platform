import { NextRequest, NextResponse } from 'next/server';
import { signRMToken, getRMRole, RM_COOKIE_NAME, verifyRMToken } from '@/lib/auth/rm-jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEmployeeByCode, getEmployeeByPhone } from '@/lib/dal/employees';
import { writeAuditLog } from '@/lib/dal/audit';

/**
 * POST /api/rm/auth — RM Login
 * Body: { employeeCode, phone, pin }
 * For demo mode: any employee code + phone match = login success (no PIN check)
 */
export async function POST(request: NextRequest) {
  try {
    const { employeeCode, phone, pin } = await request.json();

    // SECURITY: This endpoint historically ran in "demo mode" — issuing a 12h
    // RM session to anyone who knew an employee code, no PIN check. That's a
    // commission-data exposure risk for /api/mis/*. In production we now
    // refuse to issue tokens until the PIN bcrypt check is wired up. The
    // RM_DEMO_MODE env var keeps the unsafe path available only in dev/preview
    // for testing the UI.
    const demoMode = process.env.RM_DEMO_MODE === 'true';
    if (process.env.NODE_ENV === 'production' && !demoMode) {
      return NextResponse.json(
        { error: 'RM login is temporarily unavailable. Please contact your manager.' },
        { status: 503 }
      );
    }

    if (!employeeCode && !phone) {
      return NextResponse.json(
        { error: 'Employee code or phone number required' },
        { status: 400 }
      );
    }

    // Find employee by code or phone
    let employee = employeeCode
      ? await getEmployeeByCode(employeeCode)
      : await getEmployeeByPhone(phone);

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found. Please check your credentials.' },
        { status: 401 }
      );
    }

    if (!employee.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Contact your manager.' },
        { status: 403 }
      );
    }

    // DEMO MODE ONLY (non-prod or RM_DEMO_MODE=true): no PIN check, just
    // confirm the employee exists. Real bcrypt PIN check arrives with the
    // Supabase employees table migration. Reference unused `pin` arg so the
    // request body stays backwards compatible.
    void pin;

    const role = getRMRole(employee.levelCode);

    const token = await signRMToken({
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.name,
      designation: employee.designation || '',
      segment: employee.segment,
      entity: employee.entity,
      role,
    });

    await writeAuditLog({
      tableName: 'employees',
      recordId: employee.id,
      action: 'LOGIN',
      changedBy: employee.employeeCode,
      newValues: { loginMethod: 'code+phone' },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        designation: employee.designation,
        entity: employee.entity,
        segment: employee.segment,
        role,
      },
    });

    response.cookies.set(RM_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60, // 12 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('RM login error');
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rm/auth — Get current RM session
 * Checks rm-session first, then falls back to employee-session cookie.
 */
export async function GET(request: NextRequest) {
  try {
    // Try RM token first
    const rmToken = request.cookies.get(RM_COOKIE_NAME)?.value;
    if (rmToken) {
      const payload = await verifyRMToken(rmToken);
      if (payload) {
        return NextResponse.json({ user: payload });
      }
    }

    // Fallback: check employee-session cookie
    const empToken = request.cookies.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const empPayload = await verifyEmployeeToken(empToken);
      if (empPayload) {
        // Map employee payload to RM-compatible shape
        return NextResponse.json({
          user: {
            employeeId: empPayload.employeeId,
            employeeCode: `EMP-${empPayload.employeeId}`,
            name: empPayload.name,
            designation: empPayload.designation,
            entity: empPayload.companyGroup,
            segment: empPayload.department,
            role: empPayload.role,
          },
        });
      }
    }

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/rm/auth — RM Logout (clears both RM and employee session)
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(RM_COOKIE_NAME);
  response.cookies.set(EMPLOYEE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
