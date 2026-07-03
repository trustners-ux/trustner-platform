/**
 * Client Orientation — client summary (HTML → print-to-PDF).
 *
 * GET /api/admin/client-orientation/[id]/summary
 * Accepts either an authenticated employee session, OR a valid ?token=... share
 * link (see lib/advisory/share.ts) so an unauthenticated client can open it.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { isAdvisoryRecordInScope } from '@/lib/advisory/visibility';
import { resolveEmployeeEmail, validateShareToken } from '@/lib/advisory/share';
import {
  renderOrientationSummaryHtml,
  type OrientationRow,
  type OrientationGoal,
} from '@/lib/client-orientation/summary';

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
    if (!(await validateShareToken(supabase, 'client_orientation', numericId, token))) {
      return NextResponse.json({ error: 'This link is invalid, expired, or has been revoked.' }, { status: 403 });
    }
  } else {
    const email = await resolveEmployeeEmail();
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await isAdvisoryRecordInScope(supabase, 'co_client_orientations', numericId, { employeeEmail: email }))) {
      return NextResponse.json({ error: 'Not authorised for this orientation' }, { status: 403 });
    }
  }

  const { data: row, error } = await supabase
    .from('co_client_orientations')
    .select('*, uploader:employees!co_client_orientations_uploaded_by_employee_id_fkey(name), goals:co_goals(*)')
    .eq('id', numericId)
    .maybeSingle();

  if (error || !row) return NextResponse.json({ error: 'Orientation not found' }, { status: 404 });

  const uploader = row.uploader as { name?: string } | { name?: string }[] | null;
  const rmName = Array.isArray(uploader) ? uploader[0]?.name : uploader?.name;
  const goals = (row.goals as OrientationGoal[]) ?? [];

  const html = renderOrientationSummaryHtml(
    row as unknown as OrientationRow,
    goals,
    { rmName: rmName ?? undefined, showPrintBar: !token, status: token ? null : (row as { status?: string }).status }
  );

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
