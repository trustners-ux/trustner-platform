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
import {
  isApproverEmail,
  buildApproverFallbackResponse,
} from '@/lib/trustner-agent-platform/generic-queries';
import { getVisibleEmployeeIds } from '@/lib/permissions/hierarchy';

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

  // Try employee JWT (carries hardcoded directory employeeId, NOT db employees.id)
  if (!employeeEmail) {
    const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
    if (empToken) {
      const payload = await verifyEmployeeToken(empToken);
      if (payload) {
        employeeEmail = payload.email;
      }
    }
  }

  if (!employeeEmail) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // ALWAYS resolve employees.id by email (the JWT's employeeId comes
  // from the hardcoded directory which uses different IDs than the
  // database `employees` table — see /lib/employee/employee-directory.ts).
  // The email is the canonical bridge.
  employeeId = await resolveEmployeeIdByEmail(employeeEmail);
  const approver = isApproverEmail(employeeEmail);

  if (!employeeId) {
    // Firm principals (Ram, Sangeeta) get an Admin fallback even if
    // their employees row is missing — they cannot be locked out of
    // their own approval matrix.
    if (approver) {
      return NextResponse.json(buildApproverFallbackResponse(employeeEmail));
    }
    return NextResponse.json(
      { error: `Could not resolve employee row for ${employeeEmail}. Add a row to the employees table.` },
      { status: 403 }
    );
  }

  // ── Load employee + PD role ────────────────────────────────
  const employee = await getEmployeeWithPdRole(employeeId);

  if (!employee) {
    if (approver) {
      // Defensive: even with an employees row, if the role join
      // ever fails for a principal, synthesize Admin.
      return NextResponse.json(buildApproverFallbackResponse(employeeEmail));
    }
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

  // ── Resolve visibility scope from role hierarchy ─────────────
  // The actor's role declares a visibility_scope (own / direct_reports
  // / subtree / firm). Principals always see firm. Everyone else sees
  // what their role allows — e.g. a senior_reviewer sees their entire
  // org subtree, a junior_analyst sees only their own work.
  const scope = await getVisibleEmployeeIds({
    employeeId,
    email: employeeEmail,
    roleName: employee.role.name,
  });
  const showAllTeamDrafts = scope.includeAll;
  const visibleEmployeeIds = scope.includeAll ? undefined : scope.employeeIds;

  const [counts, myDrafts, awaiting, approvedPending, recent] = await Promise.all([
    getDashboardCounts(employeeId, { showAllTeam: showAllTeamDrafts, visibleEmployeeIds }),
    employee.role.canEditDraft
      ? getMyDrafts(employeeId, 20, { showAllTeam: showAllTeamDrafts, visibleEmployeeIds })
      : Promise.resolve([]),
    employee.role.canReview ? getAwaitingMyReview(employeeId) : Promise.resolve([]),
    employee.role.canPublish ? getMyApprovedAwaitingPublish(employeeId) : Promise.resolve([]),
    getRecentlyPublished(20, { showAllTeam: showAllTeamDrafts, visibleEmployeeIds }),
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
    // Surface the resolved visibility so the UI can show "viewing
    // your team (12 people)" or "viewing firm (all)" badges.
    visibility: {
      scope: scope.scope,
      includeAll: scope.includeAll,
      employeeCount: scope.includeAll ? null : scope.employeeIds.length,
      reason: scope.reason,
    },
  });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function resolveEmployeeIdByEmail(email: string): Promise<number | null> {
  const { getSupabaseAdmin } = await import('@/lib/db/supabase');
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // Case-insensitive lookup — JWT-carried email casing can vary.
  const { data } = await supabase
    .from('employees')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();

  return (data?.id as number) ?? null;
}
