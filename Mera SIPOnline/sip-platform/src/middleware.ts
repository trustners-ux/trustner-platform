import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';

type AdminRole = 'admin' | 'editor' | 'viewer';

const ROLE_HIERARCHY: Record<AdminRole, number> = { admin: 3, editor: 2, viewer: 1 };

// Routes requiring specific minimum roles
const ROUTE_ROLES: { pattern: string; role: AdminRole }[] = [
  { pattern: '/admin/settings', role: 'admin' },
  { pattern: '/admin/mis', role: 'admin' },
  { pattern: '/admin/funds', role: 'editor' },
  { pattern: '/admin/blog', role: 'editor' },
  { pattern: '/admin/market', role: 'editor' },
  { pattern: '/admin/leads', role: 'editor' },
  { pattern: '/admin/gallery', role: 'editor' },
  { pattern: '/api/admin/gallery', role: 'editor' },
  { pattern: '/api/admin/leads', role: 'editor' },
  { pattern: '/admin/reports', role: 'editor' },
  { pattern: '/api/admin/reports', role: 'editor' },
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

  // ─── RM Portal Routes (separate auth) ───
  // Allow RM login page and RM auth API without auth
  if (
    pathname === '/rm/login' ||
    pathname.startsWith('/api/rm/auth') ||
    pathname.startsWith('/api/mis/') // MIS API handles its own auth via cookies
  ) {
    return NextResponse.next();
  }

  // RM protected pages — check rm-session cookie exists (verification happens in API)
  if (pathname.startsWith('/rm') && pathname !== '/rm/login') {
    const rmToken = request.cookies.get('rm-session')?.value;
    if (!rmToken) {
      return NextResponse.redirect(new URL('/rm/login', request.url));
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

  // Check for session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Verify JWT
  const payload = await verifyToken(token);
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  // Role-based access control
  const requiredRole = getRequiredRole(pathname);
  if (requiredRole && !hasAccess(payload.role as AdminRole, requiredRole)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Attach user info to headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-admin-email', payload.email);
  requestHeaders.set('x-admin-name', payload.name);
  requestHeaders.set('x-admin-role', payload.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    '/api/admin/:path*',
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
