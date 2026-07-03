/**
 * Periodic Review — client note (HTML → print-to-PDF).
 *
 * GET /api/admin/periodic-review/[id]/note
 * Renders the data-grounded review as a premium, compliance-baked client note.
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
  renderPeriodicReviewNoteHtml,
  type PeriodicReviewRow,
  type PeriodicReviewActionItem,
} from '@/lib/periodic-review/note';

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
    if (!(await validateShareToken(supabase, 'periodic_review', numericId, token))) {
      return NextResponse.json({ error: 'This link is invalid, expired, or has been revoked.' }, { status: 403 });
    }
  } else {
    const email = await resolveEmployeeEmail();
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await isAdvisoryRecordInScope(supabase, 'pr_periodic_reviews', numericId, { employeeEmail: email }))) {
      return NextResponse.json({ error: 'Not authorised for this review' }, { status: 403 });
    }
  }

  const { data: review, error } = await supabase
    .from('pr_periodic_reviews')
    .select('*, uploader:employees!pr_periodic_reviews_uploaded_by_employee_id_fkey(name), action_items:pr_action_items(description, owner, status, due_date)')
    .eq('id', numericId)
    .maybeSingle();

  if (error || !review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const uploader = review.uploader as { name?: string } | { name?: string }[] | null;
  const rmName = Array.isArray(uploader) ? uploader[0]?.name : uploader?.name;
  const actionItems = (review.action_items as PeriodicReviewActionItem[]) ?? [];

  const html = renderPeriodicReviewNoteHtml(
    review as unknown as PeriodicReviewRow,
    actionItems,
    // A client opening via a share token always sees a clean doc — no
    // print-bar chrome and no DRAFT watermark clutter for a link that was
    // only ever minted from an already-Approved/Published record.
    { rmName: rmName ?? undefined, showPrintBar: !token, status: token ? null : (review as { status?: string }).status }
  );

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
