/**
 * Investment Proposal — Workflow Actions
 *
 * POST /api/admin/investment-proposal/[id]/[action]
 *   action ∈ { submit, approve, request-changes, reject, publish, escalate }
 *
 * Delegates to the shared workflow-action handler.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleWorkflowAction } from '@/lib/trustner-agent-platform/workflow-actions';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { runProposalQa } from '@/lib/investment-proposal/qa';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const p = await params;

  // Pre-publish QA gate — block a client-bound proposal that fails compliance/
  // completeness checks (allocation totals ~100%, horizon/risk set, no advisor terms).
  if (p.action === 'publish') {
    const sb = getSupabaseAdmin();
    const numericId = parseInt(p.id, 10);
    if (sb && !Number.isNaN(numericId)) {
      const qa = await runProposalQa(sb, numericId);
      if (!qa.ready) {
        return NextResponse.json(
          { error: 'Pre-publish checks failed', blockers: qa.blockers, warnings: qa.warnings },
          { status: 422 }
        );
      }
    }
  }

  return handleWorkflowAction({
    table: 'ip_investment_proposals',
    agentName: 'investment_proposal',
    request,
    params: p,
  });
}
