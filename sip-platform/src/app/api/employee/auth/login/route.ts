import { NextRequest, NextResponse } from 'next/server';
import { verifyLogin } from '@/lib/employee/employee-auth';
import { signEmployeeToken, verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { writeAuditLog } from '@/lib/dal/audit';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

// Brute-force / credential-stuffing defence (audit P0-3). Counts only FAILED
// attempts, keyed by IP and by email. Best-effort per-region; upgrade to KV.
const ipLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const emailLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8 });

// Auth routes MUST always be dynamic + Node runtime + zero caching.
// Without these, Vercel may reuse cached serverless bundles or stale blob
// reads, causing password changes not to take effect for hours/days.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

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

    const ip = clientIp(req);
    const normalisedEmail = String(email).trim().toLowerCase();
    const ipKey = `login:emp:ip:${ip}`;
    const emailKey = `login:emp:email:${normalisedEmail}`;
    if (ipLimiter.peek(ipKey).remaining <= 0 || emailLimiter.peek(emailKey).remaining <= 0) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    const result = await verifyLogin(email, password);
    if (!result.success || !result.employee) {
      ipLimiter.check(ipKey);
      emailLimiter.check(emailKey);
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
