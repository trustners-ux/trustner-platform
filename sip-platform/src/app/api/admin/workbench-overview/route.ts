/**
 * Advisory Workbench Overview API
 *
 * Returns aggregated counts across all 5 Trustner agent workbenches
 * — used by the main admin dashboard to render the workbench status.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { resolveEmployeeIdByEmail } from '@/lib/trustner-agent-platform/generic-queries';

interface AgentSummary {
  agent: string;
  myDrafts: number;
  awaitingMyReview: number;
  approvedPending: number;
  publishedThisMonth: number;
}

const AGENTS: Array<{ name: string; table: string }> = [
  { name: 'portfolio_diagnostic', table: 'pd_diagnostic_runs' },
  { name: 'meeting_prep',         table: 'mp_meeting_briefs' },
  { name: 'investment_proposal',  table: 'ip_investment_proposals' },
  { name: 'client_orientation',   table: 'co_client_orientations' },
  { name: 'periodic_review',      table: 'pr_periodic_reviews' },
];

export async function GET() {
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const employeeId = await resolveEmployeeIdByEmail(email);

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ summaries: [], totals: zeroTotals() });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startIso = startOfMonth.toISOString();

  const summaries: AgentSummary[] = await Promise.all(
    AGENTS.map(async (ag) => {
      const [drafts, awaiting, approved, published] = await Promise.all([
        // My Drafts
        employeeId
          ? supabase.from(ag.table)
              .select('id', { count: 'exact', head: true })
              .eq('uploaded_by_employee_id', employeeId)
              .in('status', ['DRAFT', 'CHANGES_REQUESTED'])
          : Promise.resolve({ count: 0 }),
        // Awaiting My Review — items where I am the assigned reviewer
        // OR the item is unassigned (open pool, claimable by any reviewer).
        // Matches queryAgentQueue('reviewer_is_me') so the count is
        // consistent with what's shown in the dashboard queue.
        employeeId
          ? supabase.from(ag.table)
              .select('id', { count: 'exact', head: true })
              .or(
                `current_reviewer_employee_id.eq.${employeeId},current_reviewer_employee_id.is.null`
              )
              .in('status', ['IN_REVIEW', 'ESCALATED'])
          : Promise.resolve({ count: 0 }),
        // Approved pending publish (team-wide)
        supabase.from(ag.table)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'APPROVED'),
        // Published this month (team-wide)
        supabase.from(ag.table)
          .select('id', { count: 'exact', head: true })
          .eq('status', 'PUBLISHED')
          .gte('published_at', startIso),
      ]);

      return {
        agent: ag.name,
        myDrafts: drafts.count ?? 0,
        awaitingMyReview: awaiting.count ?? 0,
        approvedPending: approved.count ?? 0,
        publishedThisMonth: published.count ?? 0,
      };
    })
  );

  // Totals across agents
  const totals = summaries.reduce(
    (acc, s) => ({
      myDrafts: acc.myDrafts + s.myDrafts,
      awaitingMyReview: acc.awaitingMyReview + s.awaitingMyReview,
      approvedPending: acc.approvedPending + s.approvedPending,
      publishedThisMonth: acc.publishedThisMonth + s.publishedThisMonth,
    }),
    zeroTotals()
  );

  return NextResponse.json({ summaries, totals });
}

function zeroTotals() {
  return { myDrafts: 0, awaitingMyReview: 0, approvedPending: 0, publishedThisMonth: 0 };
}

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p) return p.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const p = await verifyEmployeeToken(empToken);
    if (p) return p.email;
  }
  return null;
}
