/**
 * Meeting Prep — Dashboard API
 *
 * GET /api/admin/meeting-prep/dashboard
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import {
  getAgentDashboardCounts,
  queryAgentQueue,
  resolveEmployeeIdByEmail,
  isApproverEmail,
  buildApproverFallbackResponse,
} from '@/lib/trustner-agent-platform/generic-queries';
import { getEmployeeWithPdRole } from '@/lib/portfolio-diagnostic/queries';

const TABLE = 'mp_meeting_briefs';
const SELECT_COLS = `
  id, document_id, family_id, family_name, status,
  meeting_scheduled_at, meeting_purpose, meeting_format,
  created_at, updated_at,
  uploader:employees!mp_meeting_briefs_uploaded_by_employee_id_fkey(name),
  reviewer:employees!mp_meeting_briefs_current_reviewer_employee_id_fkey(name)
`;

export async function GET() {
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const employeeId = await resolveEmployeeIdByEmail(email);
  const approver = isApproverEmail(email);
  if (!employeeId) {
    if (approver) {
      return NextResponse.json({
        ...buildApproverFallbackResponse(email),
        meetingsTomorrow: [],
      });
    }
    return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });
  }

  const employee = await getEmployeeWithPdRole(employeeId);
  if (!employee) {
    if (approver) {
      return NextResponse.json({
        ...buildApproverFallbackResponse(email),
        meetingsTomorrow: [],
      });
    }
    return NextResponse.json({
      employee: null, counts: null, myDrafts: [], awaiting: [], approvedPending: [], meetingsTomorrow: [],
    });
  }

  const [counts, myDrafts, awaiting, approvedPending] = await Promise.all([
    getAgentDashboardCounts(TABLE, employeeId),
    employee.role.canEditDraft
      ? queryAgentQueue({ table: TABLE, selectCols: SELECT_COLS, statuses: ['DRAFT', 'CHANGES_REQUESTED'], filter: 'uploaded_by_me', employeeId, orderBy: 'updated_at' })
      : Promise.resolve([]),
    employee.role.canReview
      ? queryAgentQueue({ table: TABLE, selectCols: SELECT_COLS, statuses: ['IN_REVIEW', 'ESCALATED'], filter: 'reviewer_is_me', employeeId, orderBy: 'created_at' })
      : Promise.resolve([]),
    employee.role.canPublish
      ? queryAgentQueue({ table: TABLE, selectCols: SELECT_COLS, statuses: ['APPROVED'], filter: 'approved_by_me_or_uploader', employeeId, orderBy: 'approved_at' })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    employee: {
      id: employee.id, name: employee.name, email: employee.email,
      role: {
        name: employee.role.name, level: employee.role.level,
        canUpload: employee.role.canUpload, canReview: employee.role.canReview,
        canApprove: employee.role.canApprove, canPublish: employee.role.canPublish,
      },
      certifications: employee.certifications,
    },
    counts: {
      ...counts,
      meetingsTomorrow: 0,        // TODO: compute from meeting_scheduled_at
      upcomingMeetingsThisWeek: 0,
    },
    myDrafts: myDrafts.map(mapRow),
    awaiting: awaiting.map(mapRow),
    approvedPending: approvedPending.map(mapRow),
    meetingsTomorrow: [],
  });
}

function mapRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id, documentId: row.document_id,
    familyId: row.family_id, familyName: row.family_name,
    status: row.status,
    meetingScheduledAt: row.meeting_scheduled_at,
    meetingPurpose: row.meeting_purpose,
    meetingFormat: row.meeting_format,
    hoursUntilMeeting: computeHoursUntil(row.meeting_scheduled_at as string),
    uploadedByName: extractName(row.uploader),
    currentReviewerName: extractName(row.reviewer),
    numOpenActionItems: 0, numOpportunities: 0,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function computeHoursUntil(iso: string): number {
  if (!iso) return Infinity;
  return (new Date(iso).getTime() - Date.now()) / 3_600_000;
}

function extractName(emp: unknown): string | null {
  if (!emp) return null;
  if (Array.isArray(emp)) return emp.length > 0 ? ((emp[0] as { name?: string }).name ?? null) : null;
  if (typeof emp === 'object' && emp !== null && 'name' in emp) return (emp as { name?: string }).name ?? null;
  return null;
}

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return payload.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) return payload.email;
  }
  return null;
}
