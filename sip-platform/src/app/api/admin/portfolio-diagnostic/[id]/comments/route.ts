/**
 * Add or list comments on a diagnostic.
 *
 * POST /api/admin/portfolio-diagnostic/[id]/comments
 *   Body: { commentText: string, holdingId?: number, sipId?: number, parentCommentId?: number }
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';

interface CommentBody {
  commentText: string;
  holdingId?: number;
  sipId?: number;
  parentCommentId?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const email = await resolveEmployeeEmail();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CommentBody;
  if (!body.commentText || body.commentText.trim().length === 0) {
    return NextResponse.json({ error: 'Comment text required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('email', email)
    .single();
  const authorId = emp?.id as number | undefined;
  if (!authorId) {
    return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('pd_review_comments')
    .insert({
      diagnostic_run_id: parseInt(id, 10),
      author_employee_id: authorId,
      holding_id: body.holdingId ?? null,
      sip_id: body.sipId ?? null,
      parent_comment_id: body.parentCommentId ?? null,
      comment_text: body.commentText.trim(),
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, commentId: data?.id });
}

async function resolveEmployeeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const payload = await verifyToken(adminToken);
    if (payload) return payload.email;
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const payload = await verifyEmployeeToken(empToken);
    if (payload) return payload.email;
  }
  return null;
}
