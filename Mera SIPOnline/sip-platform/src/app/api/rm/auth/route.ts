import { NextRequest, NextResponse } from 'next/server';
import { signRMToken, getRMRole, RM_COOKIE_NAME, verifyRMToken } from '@/lib/auth/rm-jwt';
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

    // In production: verify PIN hash with bcrypt
    // For now (demo mode): allow login if employee exists
    // TODO: Add PIN verification when Supabase is connected
    // const isPinValid = await bcrypt.compare(pin, employee.auth_pin_hash);

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
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(RM_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyRMToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    return NextResponse.json({ user: payload });
  } catch {
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/rm/auth — RM Logout
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(RM_COOKIE_NAME);
  return response;
}
