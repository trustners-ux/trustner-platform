/**
 * Periodic Review — Get/Update single review
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { isAdvisoryRecordInScope } from '@/lib/advisory/visibility';

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
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // DPDP need-to-know: only show reviews within the actor's visibility scope.
  if (!(await isAdvisoryRecordInScope(supabase, 'pr_periodic_reviews', numericId, { employeeEmail: email }))) {
    return NextResponse.json({ error: 'Not authorised for this review' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('pr_periodic_reviews')
    .select(
      `*,
       uploader:employees!pr_periodic_reviews_uploaded_by_employee_id_fkey(name, email),
       reviewer:employees!pr_periodic_reviews_current_reviewer_employee_id_fkey(name, email),
       approver:employees!pr_periodic_reviews_approved_by_employee_id_fkey(name, email),
       action_items:pr_action_items(*)`
    )
    .eq('id', numericId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  return NextResponse.json({ review: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const email = await resolveEmployeeEmail();
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // DPDP need-to-know: only edit reviews within the actor's visibility scope.
  if (!(await isAdvisoryRecordInScope(supabase, 'pr_periodic_reviews', numericId, { employeeEmail: email }))) {
    return NextResponse.json({ error: 'Not authorised for this review' }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const editable: Record<string, string> = {
    currentAumInr: 'current_aum_inr',
    periodStartAumInr: 'period_start_aum_inr',
    periodGainInr: 'period_gain_inr',
    periodReturnPct: 'period_return_pct',
    familyXirrPct: 'family_xirr_pct',
    benchmarkReturnPct: 'benchmark_return_pct',
    alphaPct: 'alpha_pct',
    topContributor1: 'top_contributor_1',
    topContributor1ContributionInr: 'top_contributor_1_contribution_inr',
    topContributor2: 'top_contributor_2',
    topContributor2ContributionInr: 'top_contributor_2_contribution_inr',
    topContributor3: 'top_contributor_3',
    topContributor3ContributionInr: 'top_contributor_3_contribution_inr',
    topDetractor1: 'top_detractor_1',
    topDetractor1ContributionInr: 'top_detractor_1_contribution_inr',
    topDetractor2: 'top_detractor_2',
    topDetractor2ContributionInr: 'top_detractor_2_contribution_inr',
    topDetractor3: 'top_detractor_3',
    topDetractor3ContributionInr: 'top_detractor_3_contribution_inr',
    numActiveGoals: 'num_active_goals',
    numGoalsOnTrack: 'num_goals_on_track',
    numGoalsBehind: 'num_goals_behind',
    marketSummary: 'market_summary',
    outlookNextPeriod: 'outlook_next_period',
  };

  const update: Record<string, unknown> = {};
  for (const [k, dbCol] of Object.entries(editable)) {
    if (body[k] !== undefined) update[dbCol] = body[k];
  }

  // Action items: true id-based upsert — existing rows are updated in place (so
  // ids, completed_at/by and ON DELETE CASCADE history survive), genuinely new
  // rows are inserted, and only the rows the user removed are deleted. The form
  // round-trips each row's id; rows without an id are new. A description match on
  // the prior row is kept as a belt-and-suspenders completion-provenance fallback.
  if (Array.isArray(body.actionItems)) {
    const items = body.actionItems as Array<{
      id?: number;
      description: string;
      owner: 'Client' | 'RM' | 'Both';
      status: 'Open' | 'In Progress' | 'Completed' | 'Blocked';
      dueDate?: string;
      notes?: string;
    }>;

    const { data: existing } = await supabase
      .from('pr_periodic_reviews')
      .select('family_id')
      .eq('id', numericId)
      .maybeSingle();
    const familyId = existing?.family_id as number | undefined;

    const { data: prior } = await supabase
      .from('pr_action_items')
      .select('id, description, completed_at, completed_by_employee_id')
      .eq('review_id', numericId);
    const priorById = new Map((prior ?? []).map((p) => [p.id as number, p]));
    const priorByDesc = new Map((prior ?? []).map((p) => [String(p.description).trim(), p]));

    // IDOR guard: pr_action_items.id is a global SERIAL, not scoped per review, and
    // upsert(onConflict:'id') will happily UPDATE a row from ANOTHER review/family
    // if a caller supplies its id. Reject any incoming id this review doesn't own.
    for (const i of items) {
      if (i.id != null && !priorById.has(i.id)) {
        return NextResponse.json(
          { error: `Action item id ${i.id} does not belong to this review` },
          { status: 400 }
        );
      }
    }

    // Delete only the rows the user removed.
    const incomingIds = new Set(items.map((i) => i.id).filter((x): x is number => typeof x === 'number'));
    const toDelete = (prior ?? []).map((p) => p.id as number).filter((id) => !incomingIds.has(id));
    if (toDelete.length > 0) {
      const del = await supabase.from('pr_action_items').delete().in('id', toDelete);
      if (del.error) { console.error(del.error.message); return NextResponse.json({ error: 'Failed to save action items' }, { status: 500 }); }
    }

    if (items.length > 0 && familyId) {
      const rows = items.map((i) => {
        const done = i.status === 'Completed';
        const keep = (i.id != null ? priorById.get(i.id) : undefined) ?? priorByDesc.get(String(i.description).trim());
        return {
          ...(i.id != null ? { id: i.id } : {}),
          review_id: numericId,
          family_id: familyId,
          description: i.description,
          owner: i.owner,
          status: i.status,
          due_date: i.dueDate ?? null,
          notes: i.notes ?? null,
          completed_at: done ? ((keep?.completed_at as string | null) ?? new Date().toISOString()) : null,
          completed_by_employee_id: done ? ((keep?.completed_by_employee_id as number | null) ?? null) : null,
        };
      });
      const up = await supabase.from('pr_action_items').upsert(rows, { onConflict: 'id' });
      if (up.error) { console.error(up.error.message); return NextResponse.json({ error: 'Failed to save action items' }, { status: 500 }); }
    }

    // Update counts
    update.num_action_items_completed = items.filter((i) => i.status === 'Completed').length;
    update.num_action_items_new = items.length;
    update.num_action_items_pending = items.filter((i) => i.status === 'Open' || i.status === 'In Progress').length;
  }

  if (Object.keys(update).length === 0 && !body.actionItems) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('pr_periodic_reviews')
    .update(update)
    .eq('id', numericId);

  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  return NextResponse.json({ success: true });
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
