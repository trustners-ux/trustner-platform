import { NextRequest, NextResponse } from 'next/server';
import { checkEmployeeEmail } from '@/lib/employee/employee-auth';

/**
 * POST /api/employee/auth/check-email
 * Check if an email belongs to a registered employee and their auth status.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await checkEmployeeEmail(email.trim());

    switch (result.status) {
      case 'not_found':
        return NextResponse.json({
          status: 'not_found',
          message: 'This email is not registered in the Trustner employee directory. Please contact your admin or HR.',
        }, { status: 404 });

      case 'inactive':
        return NextResponse.json({
          status: 'inactive',
          message: 'Your account has been deactivated. Please contact your reporting manager.',
        }, { status: 403 });

      case 'new':
        return NextResponse.json({
          status: 'new',
          employeeName: result.employee.name,
          designation: result.employee.designation,
          message: `Welcome, ${result.employee.name.split(' ')[0]}! Please set up your password to continue.`,
        });

      case 'active':
        return NextResponse.json({
          status: 'active',
          employeeName: result.employee.name,
          designation: result.employee.designation,
        });
    }
  } catch (err) {
    console.error('[CheckEmail]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
