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

  // Action items: replace all
  if (Array.isArray(body.actionItems)) {
    const items = body.actionItems as Array<{
      description: string;
      owner: 'Client' | 'RM' | 'Both';
      status: 'Open' | 'In Progress' | 'Completed' | 'Blocked';
      dueDate?: string;
      notes?: string;
    }>;

    // Need family_id to insert action items
    const { data: existing } = await supabase
      .from('pr_periodic_reviews')
      .select('family_id')
      .eq('id', numericId)
      .maybeSingle();
    const familyId = existing?.family_id as number | undefined;

    // Preserve completion provenance across the replace-all: read existing rows
    // first, then re-apply completed_at / completed_by on description match (the
    // edit form does not yet round-trip ids). Every write error is surfaced.
    const { data: prior } = await supabase
      .from('pr_action_items')
      .select('description, completed_at, completed_by_employee_id')
      .eq('review_id', numericId);
    const priorByDesc = new Map(
      (prior ?? []).map((p) => [String(p.description).trim(), p as { completed_at: string | null; completed_by_employee_id: number | null }])
    );

    const del = await supabase.from('pr_action_items').delete().eq('review_id', numericId);
    if (del.error) return NextResponse.json({ error: `Failed to save action items: ${del.error.message}` }, { status: 500 });
    if (items.length > 0 && familyId) {
      const ins = await supabase.from('pr_action_items').insert(
        items.map((i) => {
          const keep = priorByDesc.get(String(i.description).trim());
          const done = i.status === 'Completed';
          return {
            review_id: numericId,
            family_id: familyId,
            description: i.description,
            owner: i.owner,
            status: i.status,
            due_date: i.dueDate ?? null,
            notes: i.notes ?? null,
            completed_at: done ? (keep?.completed_at ?? new Date().toISOString()) : null,
            completed_by_employee_id: done ? (keep?.completed_by_employee_id ?? null) : null,
          };
        })
      );
      if (ins.error) return NextResponse.json({ error: `Failed to save action items: ${ins.error.message}` }, { status: 500 });
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
