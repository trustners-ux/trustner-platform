/**
 * Override verdict on a specific holding (reviewer action).
 * Saves original_verdict + override_reason for the audit trail.
 *
 * POST /api/admin/portfolio-diagnostic/[id]/holdings/[holdingId]/override
 * Body: { newVerdict: Verdict, reason: string (min 5 chars) }
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import type { Verdict } from '@/lib/portfolio-diagnostic/types';

const VALID_VERDICTS: Verdict[] = ['STAR', 'KEEP', 'WATCH', 'SWAP', 'LIQUIDATE'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; holdingId: string }> }
) {
  const { id, holdingId } = await params;

  const email = await resolveEmployeeEmail();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const newVerdict = body.newVerdict as Verdict;
  const reason = body.reason as string;

  if (!VALID_VERDICTS.includes(newVerdict)) {
    return NextResponse.json(
      { error: `Invalid verdict: ${newVerdict}` },
      { status: 400 }
    );
  }
  if (!reason || reason.length < 5) {
    return NextResponse.json(
      { error: 'Override reason must be at least 5 characters' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Get actor
  const { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('email', email)
    .single();
  const actorId = emp?.id as number | undefined;
  if (!actorId) {
    return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });
  }

  // Get current holding to capture original_verdict
  const { data: holding } = await supabase
    .from('pd_diagnostic_holdings')
    .select('verdict, original_verdict')
    .eq('id', parseInt(holdingId, 10))
    .eq('diagnostic_run_id', parseInt(id, 10))
    .single();

  if (!holding) {
    return NextResponse.json({ error: 'Holding not found' }, { status: 404 });
  }

  // Update with override (preserve original_verdict on first override)
  const update: Record<string, unknown> = {
    verdict: newVerdict,
    override_reason: reason,
    overridden_by_employee_id: actorId,
    overridden_at: new Date().toISOString(),
  };
  if (!holding.original_verdict) {
    update.original_verdict = holding.verdict;
  }

  const { error } = await supabase
    .from('pd_diagnostic_holdings')
    .update(update)
    .eq('id', parseInt(holdingId, 10));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recompute verdict counts on the run
  const { data: counts } = await supabase
    .from('pd_diagnostic_holdings')
    .select('verdict')
    .eq('diagnostic_run_id', parseInt(id, 10));

  if (counts) {
    const tally: Record<Verdict, number> = { STAR: 0, KEEP: 0, WATCH: 0, SWAP: 0, LIQUIDATE: 0 };
    for (const r of counts) tally[r.verdict as Verdict]++;
    await supabase
      .from('pd_diagnostic_runs')
      .update({
        verdict_star_count: tally.STAR,
        verdict_keep_count: tally.KEEP,
        verdict_watch_count: tally.WATCH,
        verdict_swap_count: tally.SWAP,
        verdict_liquidate_count: tally.LIQUIDATE,
      })
      .eq('id', parseInt(id, 10));
  }

  return NextResponse.json({ success: true });
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
