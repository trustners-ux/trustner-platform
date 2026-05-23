/**
 * Investment Proposal — Dashboard API
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

const TABLE = 'ip_investment_proposals';
const SELECT_COLS = `
  id, document_id, family_id, family_name, status,
  purpose, proposed_amount_inr, risk_profile, horizon,
  client_signed_at, created_at, updated_at,
  uploader:employees!ip_investment_proposals_uploaded_by_employee_id_fkey(name),
  reviewer:employees!ip_investment_proposals_current_reviewer_employee_id_fkey(name)
`;

export async function GET() {
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const employeeId = await resolveEmployeeIdByEmail(email);
  const approver = isApproverEmail(email);
  if (!employeeId) {
    if (approver) return NextResponse.json(buildApproverFallbackResponse(email));
    return NextResponse.json({ error: 'Employee not found' }, { status: 403 });
  }
  const employee = await getEmployeeWithPdRole(employeeId);
  if (!employee) {
    if (approver) return NextResponse.json(buildApproverFallbackResponse(email));
    return NextResponse.json({ employee: null, counts: null, myDrafts: [], awaiting: [], approvedPending: [] });
  }

  const [counts, myDrafts, awaiting, approvedPending] = await Promise.all([
    getAgentDashboardCounts(TABLE, employeeId),
    employee.role.canEditDraft ? queryAgentQueue({ table: TABLE, selectCols: SELECT_COLS, statuses: ['DRAFT', 'CHANGES_REQUESTED'], filter: 'uploaded_by_me', employeeId, orderBy: 'updated_at' }) : [],
    employee.role.canReview ? queryAgentQueue({ table: TABLE, selectCols: SELECT_COLS, statuses: ['IN_REVIEW', 'ESCALATED'], filter: 'reviewer_is_me', employeeId, orderBy: 'created_at' }) : [],
    employee.role.canPublish ? queryAgentQueue({ table: TABLE, selectCols: SELECT_COLS, statuses: ['APPROVED'], filter: 'approved_by_me_or_uploader', employeeId, orderBy: 'approved_at' }) : [],
  ]);

  return NextResponse.json({
    employee: { id: employee.id, name: employee.name, email: employee.email, role: { name: employee.role.name, level: employee.role.level, canUpload: employee.role.canUpload, canReview: employee.role.canReview, canApprove: employee.role.canApprove, canPublish: employee.role.canPublish }, certifications: employee.certifications },
    counts,
    myDrafts: (myDrafts as Record<string, unknown>[]).map(mapRow),
    awaiting: (awaiting as Record<string, unknown>[]).map(mapRow),
    approvedPending: (approvedPending as Record<string, unknown>[]).map(mapRow),
  });
}

function mapRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id, documentId: row.document_id,
    familyId: row.family_id, familyName: row.family_name, status: row.status,
    purpose: row.purpose, proposedAmountInr: Number(row.proposed_amount_inr) || 0,
    riskProfile: row.risk_profile, horizon: row.horizon,
    uploadedByName: extractName(row.uploader),
    currentReviewerName: extractName(row.reviewer),
    numRecommendations: 0, clientSigned: !!row.client_signed_at,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
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
  if (adminToken) { const p = await verifyToken(adminToken); if (p) return p.email; }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) { const p = await verifyEmployeeToken(empToken); if (p) return p.email; }
  return null;
}
