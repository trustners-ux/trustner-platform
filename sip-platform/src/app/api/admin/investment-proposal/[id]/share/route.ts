/**
 * Investment Proposal — Client Share
 *
 * POST sends a signed share-link email to the client; GET returns share history.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextRequest } from 'next/server';
import { handleShareRequest, handleShareHistory, MODULES } from '@/lib/advisory/share';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleShareRequest(MODULES.investment_proposal, request, await params);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleShareHistory(MODULES.investment_proposal, await params);
}
