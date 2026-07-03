/**
 * POST /api/admin/portfolio-diagnostic/[id]/restore
 *
 * Admin-only: reverses a soft-delete. Flips is_deleted back to false, clears the
 * deletion metadata, and records a RESTORE entry in the immutable audit log. The
 * undo for the recycle bin — mirrors the DELETE endpoint's admin-token gate.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { logPdEvent } from '@/lib/portfolio-diagnostic/audit';
import { requirePdAdmin } from '@/lib/portfolio-diagnostic/access-admin';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Same gate as DELETE — admin JWT or employee session for Ram/Sangeeta/PD-admin.
  const admin = await requirePdAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Restore is restricted to admin accounts.' },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const { data: run } = await supabase
    .from('pd_diagnostic_runs')
    .select('id, family_name, status, is_deleted')
    .eq('id', numericId)
    .maybeSingle();

  if (!run) {
    return NextResponse.json({ error: 'Diagnostic not found' }, { status: 404 });
  }
  if (!run.is_deleted) {
    return NextResponse.json(
      { error: 'This diagnostic is not deleted — nothing to restore.' },
      { status: 409 }
    );
  }

  const { error: updErr } = await supabase
    .from('pd_diagnostic_runs')
    .update({
      is_deleted: false,
      deleted_at: null,
      deleted_by_employee_id: null,
      deletion_reason: null,
    })
    .eq('id', numericId);
  if (updErr) {
    console.error(updErr.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  // Immutable audit entry — who restored, when. Status is unchanged by restore.
  await logPdEvent(supabase, {
    runId: numericId,
    actorEmail: admin.email,
    action: 'RESTORE',
    fromStatus: run.status as string,
    toStatus: run.status as string,
    comment: 'Restored from recycle bin',
    metadata: { family_name: run.family_name },
  });

  return NextResponse.json({
    success: true,
    restoredRunId: numericId,
    familyName: run.family_name,
    restoredStatus: run.status,
    restoredBy: admin.email,
  });
}
