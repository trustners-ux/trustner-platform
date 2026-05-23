/**
 * Periodic Review — Workflow Actions
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
    table: 'pr_periodic_reviews',
    agentName: 'periodic_review',
    request,
    params: p,
  });
}
