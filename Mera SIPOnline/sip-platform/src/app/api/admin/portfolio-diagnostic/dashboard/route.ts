/**
 * Portfolio Diagnostic — Dashboard API
 *
 * Returns:
 *   - Current employee + their PD role
 *   - Queue counts (My Drafts / Awaiting Me / Pending Publish / Published)
 *   - Top items in each queue (limit 20)
 *
 * Route: GET /api/admin/portfolio-diagnostic/dashboard
 *
 * Auth: requires either admin JWT or employee JWT cookie.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import {
  getDashboardCounts,
  getMyDrafts,
  getAwaitingMyReview,
  getMyApprovedAwaitingPublish,
  getRecentlyPublished,
  getEmployeeWithPdRole,
} from '@/lib/portfolio-diagnostic/queries';

export async function GET() {
  // ── Authenticate ────────────────────────────────────────────
  const cookieStore = await cookies();

  let employeeId: number | null = null;
  let employeeEmail: string | null = null;

  // Try admin JWT
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) {
      employeeEmail = payload.email;
      // Admin JWT doesn't carry employeeId; look up via email later
    }
  }

  // Try employee JWT
  if (!employeeId) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const payload = await verifyEmployeeToken(empToken);
      if (payload) {
        employeeId = payload.employeeId;
        employeeEmail = payload.email;
      }
    }
  }

  if (!employeeId && !employeeEmail) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // If we only have email (admin JWT), resolve to employee_id
  if (!employeeId && employeeEmail) {
    employeeId = await resolveEmployeeIdByEmail(employeeEmail);
  }

  if (!employeeId) {
    return NextResponse.json(
      { error: 'Could not resolve employee identity' },
      { status: 403 }
    );
  }

  // ── Load employee + PD role ────────────────────────────────
  const employee = await getEmployeeWithPdRole(employeeId);

  if (!employee) {
    // No PD role assigned yet; return null employee so UI can show
    // the "contact admin" prompt
    return NextResponse.json({
      employee: null,
      counts: null,
      myDrafts: [],
      awaiting: [],
      approvedPending: [],
      recent: [],
    });
  }

  // ── Load queues in parallel ─────────────────────────────────
  const [counts, myDrafts, awaiting, approvedPending, recent] = await Promise.all([
    getDashboardCounts(employeeId),
    employee.role.canEditDraft ? getMyDrafts(employeeId) : Promise.resolve([]),
    employee.role.canReview ? getAwaitingMyReview(employeeId) : Promise.resolve([]),
    employee.role.canPublish ? getMyApprovedAwaitingPublish(employeeId) : Promise.resolve([]),
    getRecentlyPublished(20),
  ]);

  return NextResponse.json({
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: {
        name: employee.role.name,
        level: employee.role.level,
        canUpload: employee.role.canUpload,
        canReview: employee.role.canReview,
        canApprove: employee.role.canApprove,
        canPublish: employee.role.canPublish,
      },
      certifications: employee.certifications,
    },
    counts,
    myDrafts,
    awaiting,
    approvedPending,
    recent,
  });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function resolveEmployeeIdByEmail(email: string): Promise<number | null> {
  const { getSupabaseAdmin } = await import('@/lib/db/supabase');
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('email', email)
    .single();

  return (data?.id as number) ?? null;
}
