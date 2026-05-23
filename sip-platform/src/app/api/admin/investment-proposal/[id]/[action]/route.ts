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

import { NextRequest } from 'next/server';
import { handleWorkflowAction } from '@/lib/trustner-agent-platform/workflow-actions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const p = await params;
  return handleWorkflowAction({
    table: 'ip_investment_proposals',
    agentName: 'investment_proposal',
    request,
    params: p,
  });
}
