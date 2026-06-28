/**
 * Client Orientation — client summary (HTML → print-to-PDF).
 *
 * GET /api/admin/client-orientation/[id]/summary
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { isAdvisoryRecordInScope } from '@/lib/advisory/visibility';
import {
  renderOrientationSummaryHtml,
  type OrientationRow,
  type OrientationGoal,
} from '@/lib/client-orientation/summary';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  if (!(await isAdvisoryRecordInScope(supabase, 'co_client_orientations', numericId, { employeeEmail: email }))) {
    return NextResponse.json({ error: 'Not authorised for this orientation' }, { status: 403 });
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
    { rmName: rmName ?? undefined, showPrintBar: true }
  );

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
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
