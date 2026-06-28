/**
 * GET /api/employee/hr/exits/:id/interview
 *   Load existing interview row.
 *
 * PUT /api/employee/hr/exits/:id/interview
 *   Upsert. HR-admin can submit any time; employee-self can only submit once
 *   status >= 'clearance_pending'.
 *   Body: { mode?, answers, would_rejoin?, would_recommend?, overall_rating?,
 *           learnings? }
 *
 *   Sets hr_separation.exit_interview_id.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions, type HrPermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  manager_review: 1,
  notice_active: 2,
  clearance_pending: 3,
  fnf_pending: 4,
  fnf_approved: 5,
  fnf_disbursed: 6,
  closed: 7,
  withdrawn: -1,
  rejected: -1,
};

function canManageSeparation(perms: HrPermissions): boolean {
  const anyPerm = perms as unknown as Record<string, boolean>;
  if (anyPerm.can_manage_separation === true) return true;
  return perms.can_access_payroll === true;
}

async function loadActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return { actor, perms };
}

async function loadSeparation(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, sepId: number) {
  const { data } = await supabase
    .from('hr_separation')
    .select(`
      id, employee_id, status, exit_interview_id,
      employee:hr_employees!hr_separation_employee_id_fkey ( email )
    `)
    .eq('id', sepId)
    .single();
  return data;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const ctxAuth = await loadActor(req);
  if (!ctxAuth) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const sep = await loadSeparation(supabase, sepId);
  if (!sep) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const empEmail = (() => {
    const e = (sep as { employee?: { email?: string } | Array<{ email?: string }> }).employee;
    if (Array.isArray(e)) return e[0]?.email ?? null;
    return e?.email ?? null;
  })();
  const isAdmin = canManageSeparation(ctxAuth.perms);
  const isSelf = !!empEmail && empEmail.toLowerCase() === ctxAuth.actor.email.toLowerCase();
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data } = await supabase
    .from('hr_exit_interview').select('*').eq('separation_id', sepId).maybeSingle();
  return NextResponse.json({ row: data ?? null });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const ctxAuth = await loadActor(req);
  if (!ctxAuth) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const sep = await loadSeparation(supabase, sepId);
  if (!sep) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const empEmail = (() => {
    const e = (sep as { employee?: { email?: string } | Array<{ email?: string }> }).employee;
    if (Array.isArray(e)) return e[0]?.email ?? null;
    return e?.email ?? null;
  })();
  const isAdmin = canManageSeparation(ctxAuth.perms);
  const isSelf = !!empEmail && empEmail.toLowerCase() === ctxAuth.actor.email.toLowerCase();
  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (isSelf && !isAdmin) {
    const order = STATUS_ORDER[sep.status] ?? -1;
    const minOrder = STATUS_ORDER.clearance_pending;
    if (order < minOrder) {
      return NextResponse.json(
        { error: 'Exit interview opens once clearance starts.' },
        { status: 422 },
      );
    }
  }

  const body = await req.json();
  const { mode, answers, would_rejoin, would_recommend, overall_rating, learnings } = body as {
    mode?: 'form' | 'call' | 'in_person';
    answers?: Record<string, unknown>;
    would_rejoin?: boolean;
    would_recommend?: boolean;
    overall_rating?: number;
    learnings?: string;
  };

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'answers (object) required' }, { status: 400 });
  }

  const rowPayload = {
    separation_id: sepId,
    employee_id: sep.employee_id,
    conducted_by: ctxAuth.actor.email,
    conducted_at: new Date().toISOString(),
    mode: mode ?? 'form',
    answers: answers as Record<string, unknown>,
    would_rejoin: would_rejoin ?? null,
    would_recommend: would_recommend ?? null,
    overall_rating:
      overall_rating !== undefined && overall_rating !== null
        ? Math.max(1, Math.min(5, Math.round(overall_rating)))
        : null,
    learnings: learnings ?? null,
  };

  let interviewId: number;
  const { data: existing } = await supabase
    .from('hr_exit_interview').select('id').eq('separation_id', sepId).maybeSingle();
  if (existing) {
    const { data, error } = await supabase
      .from('hr_exit_interview').update(rowPayload).eq('id', existing.id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    interviewId = data.id as number;
    if (sep.exit_interview_id !== interviewId) {
      await supabase.from('hr_separation')
        .update({ exit_interview_id: interviewId }).eq('id', sepId);
    }
    return NextResponse.json({ row: data });
  } else {
    const { data, error } = await supabase
      .from('hr_exit_interview').insert(rowPayload).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    interviewId = data.id as number;
    await supabase.from('hr_separation')
      .update({ exit_interview_id: interviewId }).eq('id', sepId);
    return NextResponse.json({ row: data });
  }
}
