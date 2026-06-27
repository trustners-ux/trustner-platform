/**
 * Narrative Review — fetch + edit the LLM-generated narrative for a
 * diagnostic. This is the Phase-2 review surface: the LLM produces a
 * draft, and Sangeeta/Ram can polish individual sections before publish.
 *
 * GET    → returns { narrative_json, edited_json, meta }
 * PATCH  → upserts edited_json with the body payload
 *
 * The renderer (?type=narrative) uses edited_json if present, else
 * narrative_json — so an edit is immediately reflected in the PDF.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getOrGenerateNarrative, type NarrativeJSON } from '@/lib/portfolio-diagnostic/narrative-engine';
import { isPdRunInScope } from '@/lib/portfolio-diagnostic/run-scope';

// Opus 4.7 with adaptive thinking on a 10-15 holding family takes 50-90 sec
// uncached. We need headroom over the typical 60 sec Vercel default — set
// to the Pro-plan ceiling (300 sec / 5 min). For Hobby this would be capped
// to 60 automatically.
export const maxDuration = 300;

// ─────────────────────────────────────────────────────────────────
// GET — fetch the current narrative (LLM + reviewer edits)
// ─────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const email = await resolveEmployeeEmail();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // ?generate=1 forces an LLM call if no narrative exists yet. Without
  // it, we 404 if there's nothing cached so the UI can show "draft not
  // generated yet" instead of paying the latency cost on page load.
  const url = new URL(req.url);
  const allowGenerate = url.searchParams.get('generate') === '1';

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // PRIVACY GATE (audit P0-4) — narrative belongs to a specific RM's client.
  if (!(await isPdRunInScope(supabase, numericId, { employeeEmail: email }))) {
    return NextResponse.json(
      { error: 'You do not have access to this diagnostic — it belongs to another relationship manager.' },
      { status: 403 }
    );
  }

  // Fetch existing
  const { data: row } = await supabase
    .from('pd_diagnostic_narratives')
    .select(
      'id, narrative_json, edited_json, edited_by_employee_id, edited_at, model_version, prompt_version, generated_at, generation_ms, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, estimated_cost_usd, reviewer_rating, reviewer_notes'
    )
    .eq('diagnostic_run_id', numericId)
    .maybeSingle();

  if (!row && !allowGenerate) {
    return NextResponse.json(
      { error: 'No narrative yet. Add ?generate=1 to trigger the first LLM call.' },
      { status: 404 }
    );
  }

  if (!row && allowGenerate) {
    // Cold start — generate fresh
    const result = await getOrGenerateNarrative(numericId);
    if (!result.ok || !result.narrative) {
      return NextResponse.json(
        { error: result.error ?? 'Generation failed' },
        { status: 500 }
      );
    }
    // Re-fetch the just-inserted row so we return uniform shape
    const { data: fresh } = await supabase
      .from('pd_diagnostic_narratives')
      .select(
        'id, narrative_json, edited_json, edited_by_employee_id, edited_at, model_version, prompt_version, generated_at, generation_ms, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, estimated_cost_usd, reviewer_rating, reviewer_notes'
      )
      .eq('diagnostic_run_id', numericId)
      .maybeSingle();
    return NextResponse.json({
      ...packRow(fresh),
      justGenerated: true,
    });
  }

  return NextResponse.json(packRow(row));
}

// ─────────────────────────────────────────────────────────────────
// PATCH — save reviewer edits to edited_json
// ─────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const email = await resolveEmployeeEmail();
  if (!email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    edited_json?: NarrativeJSON | null;
    reviewer_notes?: string;
    reviewer_rating?: number;
  };

  // Allow null to clear edits (revert to LLM output)
  if (body.edited_json !== null && typeof body.edited_json !== 'object') {
    return NextResponse.json(
      { error: 'Body must include edited_json: NarrativeJSON | null' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  // PRIVACY GATE (audit P0-4) — only edit a narrative within the actor's scope.
  if (!(await isPdRunInScope(supabase, numericId, { employeeEmail: email }))) {
    return NextResponse.json(
      { error: 'You do not have access to this diagnostic — it belongs to another relationship manager.' },
      { status: 403 }
    );
  }

  // Look up actor — for audit attribution. Admin-token users (Sangeeta /
  // Ram) don&apos;t have employees rows; we accept null actorId and the audit
  // log uses the email instead.
  const { data: emp } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('email', email)
    .maybeSingle();
  const actorId = (emp?.id as number | undefined) ?? null;

  // Verify the narrative row exists first
  const { data: existing } = await supabase
    .from('pd_diagnostic_narratives')
    .select('id')
    .eq('diagnostic_run_id', numericId)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json(
      { error: 'No narrative row to edit. Generate one first via GET ?generate=1.' },
      { status: 404 }
    );
  }

  const update: Record<string, unknown> = {
    edited_json: body.edited_json, // may be null to clear
    edited_by_employee_id: actorId,
    edited_at: new Date().toISOString(),
  };
  if (typeof body.reviewer_notes === 'string') {
    update.reviewer_notes = body.reviewer_notes;
  }
  if (
    typeof body.reviewer_rating === 'number' &&
    body.reviewer_rating >= 1 &&
    body.reviewer_rating <= 5
  ) {
    update.reviewer_rating = body.reviewer_rating;
  }

  const { error: updateErr } = await supabase
    .from('pd_diagnostic_narratives')
    .update(update)
    .eq('diagnostic_run_id', numericId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Fire-and-forget audit log to app_artefact_views (so the audit page
  // shows who edited the narrative + when).
  void supabase
    .from('app_artefact_views')
    .insert({
      artefact_type: 'pd_narrative_edit',
      artefact_id: numericId,
      actor_employee_id: actorId,
      actor_email: email,
      view_count: 1,
    });

  return NextResponse.json({
    success: true,
    diagnosticRunId: numericId,
    editedAt: update.edited_at as string,
    editedByEmployeeId: actorId,
  });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

interface NarrativeRow {
  id?: number;
  narrative_json?: unknown;
  edited_json?: unknown;
  edited_by_employee_id?: number | null;
  edited_at?: string | null;
  model_version?: string;
  prompt_version?: string;
  generated_at?: string;
  generation_ms?: number;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
  estimated_cost_usd?: number;
  reviewer_rating?: number | null;
  reviewer_notes?: string | null;
}

function packRow(row: NarrativeRow | null | undefined) {
  if (!row) {
    return {
      narrative_json: null,
      edited_json: null,
      meta: null,
    };
  }
  return {
    narrative_json: row.narrative_json,
    edited_json: row.edited_json,
    meta: {
      id: row.id,
      modelVersion: row.model_version,
      promptVersion: row.prompt_version,
      generatedAt: row.generated_at,
      generationMs: row.generation_ms,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      cacheReadTokens: row.cache_read_tokens,
      cacheCreationTokens: row.cache_creation_tokens,
      estimatedCostUsd: row.estimated_cost_usd,
      editedByEmployeeId: row.edited_by_employee_id,
      editedAt: row.edited_at,
      reviewerRating: row.reviewer_rating,
      reviewerNotes: row.reviewer_notes,
      hasEdits: row.edited_json !== null && row.edited_json !== undefined,
    },
  };
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
