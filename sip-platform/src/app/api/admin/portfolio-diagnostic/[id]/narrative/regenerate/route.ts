/**
 * Regenerate the narrative from scratch — triggers a fresh LLM call,
 * blowing away the cached narrative_json AND any edited_json. Use this
 * when the underlying data has changed materially (verdict overrides,
 * holding edits) or when the reviewer wants a fresh take.
 *
 * POST  → triggers new LLM call, returns the fresh narrative
 *
 * Permission gate: principals + can_review (this costs real money —
 * ~$0.11 per regen — and we don't want every L1 reviewer hitting it).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { generateNarrative } from '@/lib/portfolio-diagnostic/narrative-engine';

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Gate: regen costs ~$0.11/call. Only admin-token holders (Sangeeta/
  // Ram + super-admins) OR employees whose linked pd_roles.can_review
  // is true can trigger it. Employee-only callers go through the role
  // join below; admin-token callers bypass with a short-circuit.
  const { email, viaAdmin } = await resolveAuth();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // Look up the employee row regardless — we need actorId for the audit log
  const { data: emp } = await supabase
    .from('employees')
    .select('id, full_name, role_id')
    .eq('email', email)
    .single();

  const actorId = emp?.id as number | undefined;
  if (!actorId) {
    return NextResponse.json({ error: 'Employee row not found' }, { status: 403 });
  }

  if (!viaAdmin) {
    // Check pd_role.can_review
    const roleId = emp?.role_id as number | undefined;
    let canReview = false;
    if (roleId) {
      const { data: role } = await supabase
        .from('pd_roles')
        .select('can_review')
        .eq('id', roleId)
        .single();
      canReview = (role?.can_review as boolean | null) ?? false;
    }
    if (!canReview) {
      return NextResponse.json(
        {
          error:
            'Regenerating the narrative incurs an LLM cost. Reviewer permission (can_review) or admin status is required.',
        },
        { status: 403 }
      );
    }
  }

  // Delete the existing row so generateNarrative inserts fresh. (We
  // could also upsert in generateNarrative, but a clean slate makes
  // the audit trail clearer.)
  await supabase
    .from('pd_diagnostic_narratives')
    .delete()
    .eq('diagnostic_run_id', numericId);

  // Call the engine
  const result = await generateNarrative(numericId);
  if (!result.ok || !result.narrative) {
    return NextResponse.json(
      { error: result.error ?? 'Generation failed' },
      { status: 500 }
    );
  }

  // Fire-and-forget audit log
  void supabase
    .from('app_artefact_views')
    .insert({
      artefact_type: 'pd_narrative_regenerate',
      artefact_id: numericId,
      actor_employee_id: actorId,
      actor_email: email,
      view_count: 1,
    });

  return NextResponse.json({
    success: true,
    diagnosticRunId: numericId,
    narrative: result.narrative,
    meta: {
      modelVersion: result.model,
      generatedAt: result.generatedAt,
      generationMs: result.generationMs,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cacheReadTokens: result.cacheReadTokens,
      cacheCreationTokens: result.cacheCreationTokens,
      estimatedCostUsd: result.estimatedCostUsd,
    },
  });
}

async function resolveAuth(): Promise<{ email: string | null; viaAdmin: boolean }> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(COOKIE_NAME)?.value;
  if (adminToken) {
    const p = await verifyToken(adminToken);
    if (p) return { email: p.email, viaAdmin: true };
  }
  const empToken = cookieStore.get(EMPLOYEE_COOKIE)?.value;
  if (empToken) {
    const p = await verifyEmployeeToken(empToken);
    if (p) return { email: p.email, viaAdmin: false };
  }
  return { email: null, viaAdmin: false };
}
