/**
 * Investment Proposal — client document (HTML → print-to-PDF).
 *
 * GET /api/admin/investment-proposal/[id]/document
 * Accepts either an authenticated employee session, OR a valid ?token=... share
 * link (see lib/advisory/share.ts) so an unauthenticated client can open it.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { isAdvisoryRecordInScope } from '@/lib/advisory/visibility';
import { resolveEmployeeEmail, validateShareToken } from '@/lib/advisory/share';
import { renderInvestmentProposalDocHtml, type ProposalRow } from '@/lib/investment-proposal/proposal-doc';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const token = req.nextUrl.searchParams.get('token');
  if (token) {
    if (!(await validateShareToken(supabase, 'investment_proposal', numericId, token))) {
      return NextResponse.json({ error: 'This link is invalid, expired, or has been revoked.' }, { status: 403 });
    }
  } else {
    const email = await resolveEmployeeEmail();
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await isAdvisoryRecordInScope(supabase, 'ip_investment_proposals', numericId, { employeeEmail: email }))) {
      return NextResponse.json({ error: 'Not authorised for this proposal' }, { status: 403 });
    }
  }

  const { data: row, error } = await supabase
    .from('ip_investment_proposals')
    .select('*, uploader:employees!ip_investment_proposals_uploaded_by_employee_id_fkey(name)')
    .eq('id', numericId)
    .maybeSingle();

  if (error || !row) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

  const uploader = row.uploader as { name?: string } | { name?: string }[] | null;
  const rmName = Array.isArray(uploader) ? uploader[0]?.name : uploader?.name;

  const html = renderInvestmentProposalDocHtml(row as unknown as ProposalRow, {
    rmName: rmName ?? undefined,
    showPrintBar: !token,
    status: token ? null : (row as { status?: string }).status,
  });

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
