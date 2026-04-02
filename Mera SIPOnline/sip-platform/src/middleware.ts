import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';

type AdminRole = 'super_admin' | 'admin' | 'hr' | 'editor' | 'viewer';

// Map employee roles to admin role equivalents for RBAC
const EMPLOYEE_TO_ADMIN_ROLE: Record<string, AdminRole> = {
  bod: 'super_admin',
  cdo: 'admin',
  regional_manager: 'hr',
  branch_head: 'hr',
  cdm: 'editor',
  manager: 'editor',
  mentor: 'viewer',
  sr_rm: 'viewer',
  rm: 'viewer',
  back_office: 'viewer',
  support: 'viewer',
};

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 5, admin: 4, hr: 3, editor: 2, viewer: 1,
};

// Routes requiring specific minimum roles
const ROUTE_ROLES: { pattern: string; role: AdminRole }[] = [
  { pattern: '/admin/settings', role: 'admin' },
  { pattern: '/admin/mis', role: 'hr' },
  { pattern: '/admin/approvals', role: 'admin' },
  { pattern: '/admin/audit', role: 'admin' },
  { pattern: '/admin/funds', role: 'editor' },
  { pattern: '/admin/blog', role: 'editor' },
  { pattern: '/admin/market', role: 'editor' },
  { pattern: '/admin/leads', role: 'editor' },
  { pattern: '/admin/gallery', role: 'editor' },
  { pattern: '/api/admin/gallery', role: 'editor' },
  { pattern: '/api/admin/leads', role: 'editor' },
  { pattern: '/admin/reports', role: 'editor' },
  { pattern: '/api/admin/reports', role: 'editor' },
  { pattern: '/api/admin/approvals', role: 'admin' },
  { pattern: '/api/admin/audit', role: 'admin' },
  { pattern: '/api/admin/mis', role: 'hr' },
  { pattern: '/admin/users', role: 'admin' },
  { pattern: '/api/admin/users', role: 'admin' },
  { pattern: '/api/admin/otp', role: 'admin' },
];

function hasAccess(userRole: AdminRole, requiredRole: AdminRole): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

function getRequiredRole(pathname: string): AdminRole | null {
  for (const route of ROUTE_ROLES) {
    if (pathname.startsWith(route.pattern)) {
      return route.role;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Employee Auth API — always public ───
  if (pathname.startsWith('/api/employee/auth/')) {
    return NextResponse.next();
  }

  // ─── RM Portal Routes (separate auth) ───
  // Allow RM login page and RM auth API without auth
  if (
    pathname === '/rm/login' ||
    pathname.startsWith('/api/rm/auth') ||
    pathname.startsWith('/api/mis/') // MIS API handles its own auth via cookies
  ) {
    return NextResponse.next();
  }

  // RM protected pages — check rm-session OR employee-session cookie
  if (pathname.startsWith('/rm') && pathname !== '/rm/login') {
    const rmToken = request.cookies.get('rm-session')?.value;
    const empToken = request.cookies.get(EMPLOYEE_COOKIE)?.value;
    if (!rmToken && !empToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // ─── Partner Portal Routes ───
  if (pathname.startsWith('/partner') || pathname.startsWith('/api/partner')) {
    return NextResponse.next();
  }

  // ─── Content Protection Headers for all public pages ───
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    const response = NextResponse.next();

    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self'");
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
    );

    return response;
  }

  // ─── Admin Routes ───
  // Allow login page, forgot-password page, and auth API routes
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname.startsWith('/api/admin/auth/')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie — try admin cookie first, then employee cookie
  const adminToken = request.cookies.get(COOKIE_NAME)?.value;
  const employeeToken = request.cookies.get(EMPLOYEE_COOKIE)?.value;

  if (!adminToken && !employeeToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Try admin JWT first
  let resolvedEmail = '';
  let resolvedName = '';
  let resolvedRole: AdminRole = 'viewer';

  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) {
      resolvedEmail = payload.email;
      resolvedName = payload.name;
      resolvedRole = payload.role as AdminRole;
    }
  }

  // Fallback to employee JWT
  if (!resolvedEmail && employeeToken) {
    const empPayload = await verifyEmployeeToken(employeeToken);
    if (empPayload) {
      resolvedEmail = empPayload.email;
      resolvedName = empPayload.name;
      resolvedRole = EMPLOYEE_TO_ADMIN_ROLE[empPayload.role] || 'viewer';
    }
  }

  // Neither token is valid
  if (!resolvedEmail) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    response.cookies.delete(EMPLOYEE_COOKIE);
    return response;
  }

  // Role-based access control
  const requiredRole = getRequiredRole(pathname);
  if (requiredRole && !hasAccess(resolvedRole, requiredRole)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Attach user info to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-admin-email', resolvedEmail);
  requestHeaders.set('x-admin-name', resolvedName);
  requestHeaders.set('x-admin-role', resolvedRole);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    '/api/admin/:path*',
    // Employee auth routes
    '/api/employee/:path*',
    // RM routes
    '/rm/:path*',
    '/api/rm/:path*',
    '/api/mis/:path*',
    // Partner routes
    '/partner/:path*',
    '/api/partner/:path*',
    // Public pages (for security headers)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
