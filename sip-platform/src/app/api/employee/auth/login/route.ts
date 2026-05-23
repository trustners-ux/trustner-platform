import { NextRequest, NextResponse } from 'next/server';
import { verifyLogin } from '@/lib/employee/employee-auth';
import { signEmployeeToken, verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { writeAuditLog } from '@/lib/dal/audit';

/**
 * POST /api/employee/auth/login — Authenticate with email + password
 * GET  /api/employee/auth/login — Get current session
 * DELETE /api/employee/auth/login — Logout
 */

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await verifyLogin(email, password);
    if (!result.success || !result.employee) {
      return NextResponse.json({ error: result.error || 'Login failed' }, { status: 401 });
    }

    const emp = result.employee;
    const token = await signEmployeeToken({
      employeeId: emp.id,
      email: emp.email,
      name: emp.name,
      designation: emp.designation,
      department: emp.department,
      companyGroup: emp.companyGroup,
      jobLocation: emp.jobLocation,
      role: emp.role,
      canApproveResets: emp.canApproveResets,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        employeeId: emp.id,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        companyGroup: emp.companyGroup,
        jobLocation: emp.jobLocation,
        role: emp.role,
        canApproveResets: emp.canApproveResets,
      },
    });

    response.cookies.set(EMPLOYEE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    });

    // Audit log — SEBI/IRDAI compliance
    await writeAuditLog({
      tableName: 'employees',
      recordId: emp.id,
      action: 'LOGIN',
      changedBy: emp.email,
      newValues: { loginType: 'employee', role: emp.role, designation: emp.designation },
    });

    return response;
  } catch (err) {
    console.error('[EmployeeLogin]', err);
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

    return NextResponse.json({ user: payload });
  } catch (err) {
    console.error('[EmployeeSession]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(EMPLOYEE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
