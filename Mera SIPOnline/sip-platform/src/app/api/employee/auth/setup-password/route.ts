import { NextRequest, NextResponse } from 'next/server';
import { setupPassword } from '@/lib/employee/employee-auth';
import { findEmployeeByEmail } from '@/lib/employee/employee-directory';
import { signEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';

/**
 * POST /api/employee/auth/setup-password
 * First-time password setup. After setting password, auto-logs the user in.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, confirmPassword } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const result = await setupPassword(email, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Auto-login after setup
    const employee = findEmployeeByEmail(email);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const token = await signEmployeeToken({
      employeeId: employee.id,
      email: employee.email,
      name: employee.name,
      designation: employee.designation,
      department: employee.department,
      companyGroup: employee.companyGroup,
      jobLocation: employee.jobLocation,
      role: employee.role,
      canApproveResets: employee.canApproveResets,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password set successfully! Welcome to Trustner.',
      user: {
        name: employee.name,
        designation: employee.designation,
        role: employee.role,
        department: employee.department,
      },
    });

    response.cookies.set(EMPLOYEE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[SetupPassword]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
