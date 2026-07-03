/**
 * PIP (Performance Improvement Plan) lifecycle API.
 *
 * GET   /api/employee/hr/performance/pip/:id
 *   HR-admin OR the PIP's manager / employee may read.
 *
 * PATCH /api/employee/hr/performance/pip/:id
 *   HR-admin or the PIP manager may update review checkpoints:
 *     m30_review_at, m30_note, m60_review_at, m60_note, m90_review_at, m90_note,
 *     expected_outcomes (re-write milestones array), manager_email
 *
 * POST  /api/employee/hr/performance/pip/:id  (close path)
 *   Body: { outcome: 'succeeded' | 'extended' | 'failed', final_note? }
 *
 *   On outcome='failed':
 *     - Forwards a separation creation to /api/employee/hr/exits with
 *         separation_type='termination_without_cause',
 *         is_misconduct=false,
 *         reason_secondary='Linked to PIP #<id> closure'
 *     - Sets hr_pip.separation_id from the response.
 *     - Marks employee status='on_notice' via the exits API side-effect.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getActorContext, requireAdmin } from '@/lib/hr/performance/route-auth';
import type { PipOutcome, HrPipMilestone } from '@/lib/hr/performance';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function loadPip(id: number) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: 'DB not configured' as const, status: 503 as const };
  const { data, error } = await supabase
    .from('hr_pip')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return { error: 'PIP not found' as const, status: 404 as const };
  return { pip: data, supabase };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await getActorContext(req);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await ctx.params;
  const pipId = Number(id);
  if (!Number.isFinite(pipId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const r = await loadPip(pipId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });

  if (!a.ctx.isAdmin) {
    // Manager or employee themselves
    const supabase = getSupabaseAdmin()!;
    const { data: emp } = await supabase
      .from('hr_employees')
      .select('id, email')
      .eq('id', r.pip.employee_id)
      .maybeSingle();
    const isEmployee = (emp?.email ?? '').toLowerCase() === a.ctx.email;
    const isManager =
      (r.pip.manager_email ?? '').toLowerCase() === a.ctx.email;
    if (!isEmployee && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  return NextResponse.json({ row: r.pip });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await getActorContext(req);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await ctx.params;
  const pipId = Number(id);
  if (!Number.isFinite(pipId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const r = await loadPip(pipId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });

  if (!a.ctx.isAdmin) {
    if ((r.pip.manager_email ?? '').toLowerCase() !== a.ctx.email) {
      return NextResponse.json({ error: 'Only HR or PIP manager may edit' }, { status: 403 });
    }
  }
  if (r.pip.outcome !== 'open') {
    return NextResponse.json(
      { error: `PIP is ${r.pip.outcome}; reopen requires HR.` },
      { status: 422 },
    );
  }

  const body = (await req.json()) as Record<string, unknown>;
  const allowed = [
    'm30_review_at',
    'm30_note',
    'm60_review_at',
    'm60_note',
    'm90_review_at',
    'm90_note',
    'expected_outcomes',
    'manager_email',
  ];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }
  if ('expected_outcomes' in update) {
    const arr = update.expected_outcomes;
    if (!Array.isArray(arr)) {
      return NextResponse.json({ error: 'expected_outcomes must be an array' }, { status: 400 });
    }
    for (const m of arr as Partial<HrPipMilestone>[]) {
      if (!m.milestone || !m.target_date) {
        return NextResponse.json(
          { error: 'each milestone needs milestone + target_date' },
          { status: 400 },
        );
      }
    }
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No editable fields supplied' }, { status: 400 });
  }

  const supabase = r.supabase!;
  const { data, error } = await supabase
    .from('hr_pip')
    .update(update)
    .eq('id', pipId)
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ row: data, fields_updated: Object.keys(update) });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin(req);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });

  const { id } = await ctx.params;
  const pipId = Number(id);
  if (!Number.isFinite(pipId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const r = await loadPip(pipId);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status });
  const pip = r.pip;
  if (pip.outcome !== 'open') {
    return NextResponse.json(
      { error: `PIP already ${pip.outcome}` },
      { status: 422 },
    );
  }

  const body = await req.json();
  const { outcome, final_note } = body as { outcome?: PipOutcome; final_note?: string };
  if (!outcome || !['succeeded', 'extended', 'failed'].includes(outcome)) {
    return NextResponse.json(
      { error: "outcome must be 'succeeded' | 'extended' | 'failed'" },
      { status: 400 },
    );
  }

  const supabase = r.supabase!;
  const closeUpdate: Record<string, unknown> = {
    outcome,
    closed_at: new Date().toISOString(),
  };
  if (final_note) {
    // Append note to m90_note
    closeUpdate.m90_note = pip.m90_note ? `${pip.m90_note}\n${final_note}` : final_note;
  }

  // On 'failed', spawn separation via internal POST to /api/employee/hr/exits
  let separationId: number | null = null;
  if (outcome === 'failed') {
    const today = new Date().toISOString().slice(0, 10);
    const exitsBody = {
      employee_id: pip.employee_id,
      separation_type: 'termination_without_cause',
      resignation_date: today,
      intended_lwd: addDaysIso(today, 30),
      reason_primary: 'pip_failure',
      reason_secondary: `Linked to PIP #${pipId} closure (cycle ${pip.cycle_id})`,
      is_misconduct: false,
      notice_period_days: 30,
    };

    const origin = new URL(req.url).origin;
    const cookieHeader = req.headers.get('cookie') ?? '';
    const resp = await fetch(`${origin}/api/employee/hr/exits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify(exitsBody),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `Separation auto-creation failed: ${errText}` },
        { status: 502 },
      );
    }
    const sepResp = (await resp.json()) as { row?: { id: number } };
    separationId = sepResp.row?.id ?? null;
    if (separationId) closeUpdate.separation_id = separationId;
  }

  const { data, error } = await supabase
    .from('hr_pip')
    .update(closeUpdate)
    .eq('id', pipId)
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  return NextResponse.json({ row: data, separation_id: separationId });
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
