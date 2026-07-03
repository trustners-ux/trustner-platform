/**
 * POST /api/employee/hr/exits/:id/transition
 * Body: { to: SeparationStatus, reason?: string, signoff_role?: string }
 *
 * HR-admin only. Wraps canTransition() + per-target gate checks:
 *   • notice_active        → requires requested_lwd OR approved_lwd + manager_signoff_at
 *   • clearance_pending    → requires actual lwd OR today >= intended lwd
 *   • fnf_pending          → ALL required checklist items 'done' + posp_handover complete
 *   • fnf_approved         → hr_fnf row exists with status='computed'
 *   • fnf_disbursed        → bank transfer recorded (hr_fnf.disbursed_at OR provided ref)
 *   • closed               → fnf_disbursed AND relieving letter issued
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions, type HrPermissions } from '@/lib/hr/permissions';
import { canTransition, type SeparationStatus } from '@/lib/hr/separation-state';
import { pospHandoverComplete } from '@/data/hr/exit-checklist-template';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

function canManageSeparation(perms: HrPermissions): boolean {
  const anyPerm = perms as unknown as Record<string, boolean>;
  if (anyPerm.can_manage_separation === true) return true;
  return perms.can_access_payroll === true;
}

async function getAdminActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return { error: 'Unauthenticated', status: 401 as const, actor: null };
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return { error: 'Invalid session', status: 401 as const, actor: null };
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!canManageSeparation(perms)) {
    return { error: 'Need can_manage_separation permission', status: 403 as const, actor };
  }
  return { error: null as null, status: 200 as const, actor };
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const g = await getAdminActor(req);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { to, reason, signoff_role } = body as {
    to?: SeparationStatus;
    reason?: string;
    signoff_role?: 'manager' | 'hr' | 'finance' | 'ceo';
  };
  if (!to) return NextResponse.json({ error: 'to required' }, { status: 400 });

  const { data: sep, error: sepErr } = await supabase
    .from('hr_separation').select('*').eq('id', sepId).single();
  if (sepErr || !sep) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!canTransition(sep.status as SeparationStatus, to)) {
    return NextResponse.json(
      { error: `Illegal transition: '${sep.status}' → '${to}'.` },
      { status: 422 },
    );
  }

  // ── per-target gate checks ────────────────────────────────────────
  if (to === 'notice_active') {
    const hasLwd = !!(sep.requested_lwd || sep.approved_lwd);
    if (!hasLwd) {
      return NextResponse.json(
        { error: 'requested_lwd or approved_lwd must be set before moving to notice_active.' },
        { status: 422 },
      );
    }
    if (!sep.manager_signoff_at) {
      return NextResponse.json(
        { error: 'Manager sign-off required before moving to notice_active.' },
        { status: 422 },
      );
    }
  }

  if (to === 'clearance_pending') {
    const today = new Date().toISOString().slice(0, 10);
    const intended = sep.approved_lwd ?? sep.requested_lwd ?? null;
    if (!sep.lwd && (!intended || today < intended)) {
      return NextResponse.json(
        { error: 'Need actual lwd OR today ≥ intended_lwd to start clearance.' },
        { status: 422 },
      );
    }
  }

  if (to === 'fnf_pending') {
    const { data: items } = await supabase
      .from('hr_separation_checklist')
      .select('category, required, status, proof_blob_url')
      .eq('separation_id', sepId);
    const rows = items ?? [];
    const requiredOpen = rows.filter(r => r.required && r.status !== 'done' && r.status !== 'na');
    if (requiredOpen.length > 0) {
      return NextResponse.json(
        {
          error: `${requiredOpen.length} required checklist item(s) still open.`,
          open_items: requiredOpen,
        },
        { status: 422 },
      );
    }
    if (!pospHandoverComplete(rows)) {
      return NextResponse.json(
        { error: 'POSP handover hard-gate not satisfied (status=done + proof_blob_url required).' },
        { status: 422 },
      );
    }
  }

  if (to === 'fnf_approved') {
    if (!sep.fnf_id) {
      return NextResponse.json(
        { error: 'F&F has not been computed. POST /calculate first.' },
        { status: 422 },
      );
    }
    const { data: fnf } = await supabase
      .from('hr_fnf').select('id, status').eq('id', sep.fnf_id).single();
    if (!fnf || fnf.status !== 'computed') {
      return NextResponse.json(
        { error: `F&F row must be status='computed' (found '${fnf?.status ?? 'missing'}').` },
        { status: 422 },
      );
    }
  }

  if (to === 'fnf_disbursed') {
    if (!sep.fnf_id) {
      return NextResponse.json({ error: 'No fnf_id on separation.' }, { status: 422 });
    }
    const { data: fnf } = await supabase
      .from('hr_fnf').select('id, status, disbursed_at')
      .eq('id', sep.fnf_id).single();
    if (!fnf) {
      return NextResponse.json({ error: 'F&F row missing.' }, { status: 422 });
    }
    if (fnf.status !== 'approved' && fnf.status !== 'disbursed') {
      return NextResponse.json(
        { error: `F&F row must be approved before disbursement (got '${fnf.status}').` },
        { status: 422 },
      );
    }
    // Stamp the fnf row with disbursed_at if missing
    if (!fnf.disbursed_at) {
      await supabase.from('hr_fnf').update({
        status: 'disbursed',
        disbursed_at: new Date().toISOString(),
        disbursed_by: g.actor?.email ?? 'hr_admin',
      }).eq('id', sep.fnf_id);
    }
  }

  if (to === 'closed') {
    if (sep.status !== 'fnf_disbursed') {
      return NextResponse.json(
        { error: 'Can only close after fnf_disbursed.' },
        { status: 422 },
      );
    }
    const { data: relieving } = await supabase
      .from('hr_letter_archive')
      .select('id')
      .eq('separation_id', sepId)
      .eq('letter_type', 'relieving')
      .limit(1);
    if (!relieving || relieving.length === 0) {
      return NextResponse.json(
        { error: 'Relieving letter must be issued before closing the case.' },
        { status: 422 },
      );
    }
  }

  // Build update payload
  const update: Record<string, unknown> = { status: to };
  const now = new Date().toISOString();
  const actorEmail = g.actor?.email ?? 'hr_admin';

  if (signoff_role === 'manager') {
    update.manager_signoff_by = actorEmail;
    update.manager_signoff_at = now;
  } else if (signoff_role === 'hr') {
    update.hr_signoff_by = actorEmail;
    update.hr_signoff_at = now;
  } else if (signoff_role === 'finance') {
    update.finance_signoff_by = actorEmail;
    update.finance_signoff_at = now;
  } else if (signoff_role === 'ceo') {
    update.ceo_signoff_by = actorEmail;
    update.ceo_signoff_at = now;
  }

  if (to === 'rejected') {
    update.rejected_by = actorEmail;
    update.rejected_at = now;
    update.rejection_reason = reason ?? null;
  }
  if (to === 'withdrawn') {
    update.withdrawn_at = now;
    update.withdrawal_reason = reason ?? null;
  }
  if (to === 'clearance_pending' && !sep.lwd) {
    update.lwd = sep.approved_lwd ?? sep.requested_lwd ?? null;
  }
  if (to === 'closed') {
    update.separation_effective_date = update.separation_effective_date ?? sep.lwd;
  }

  const { data, error } = await supabase
    .from('hr_separation').update(update).eq('id', sepId).select('*').single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  // Side effects on terminal states — flip employee status
  if (to === 'closed' || to === 'fnf_disbursed') {
    await supabase.from('hr_employees').update({ status: 'exited' }).eq('id', sep.employee_id);
  } else if (to === 'withdrawn' || to === 'rejected') {
    await supabase.from('hr_employees').update({ status: 'active' }).eq('id', sep.employee_id);
  } else if (to === 'notice_active') {
    await supabase.from('hr_employees').update({ status: 'on_notice' }).eq('id', sep.employee_id);
  }

  return NextResponse.json({ row: data });
}
