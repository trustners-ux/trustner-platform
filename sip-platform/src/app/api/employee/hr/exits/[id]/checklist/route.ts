/**
 * GET   /api/employee/hr/exits/:id/checklist
 *   List checklist rows for the separation. HR-admin OR employee-self.
 *
 * PATCH /api/employee/hr/exits/:id/checklist
 *   Body: { item_id, status?, proof_blob_url?, recovery_amount?, notes? }
 *
 *   Employee-self may update items in {assets, kt, knowledge_base, posp_handover,
 *   client_handover} (the ones they actually do).
 *   HR-admin confirms / can update any item.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions, type HrPermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const EMPLOYEE_EDITABLE_CATEGORIES = new Set([
  'assets', 'kt', 'knowledge_base', 'posp_handover', 'client_handover',
]);

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

async function ensureAccess(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  sepId: number,
  email: string,
  perms: HrPermissions,
): Promise<{ isAdmin: boolean; isSelf: boolean; sep: { employee_id: number; status: string } | null }> {
  if (!supabase) return { isAdmin: false, isSelf: false, sep: null };
  const { data: sep } = await supabase
    .from('hr_separation')
    .select('id, employee_id, status, employee:hr_employees!hr_separation_employee_id_fkey(email)')
    .eq('id', sepId)
    .single();
  if (!sep) return { isAdmin: false, isSelf: false, sep: null };
  const isAdmin = canManageSeparation(perms);
  // PostgREST returns the joined row as either object or array depending on
  // the relationship; handle both.
  const empEmail = (() => {
    const e = (sep as { employee?: { email?: string } | Array<{ email?: string }> }).employee;
    if (Array.isArray(e)) return e[0]?.email ?? null;
    return e?.email ?? null;
  })();
  const isSelf = !!empEmail && empEmail.toLowerCase() === email.toLowerCase();
  return {
    isAdmin,
    isSelf,
    sep: { employee_id: sep.employee_id as number, status: sep.status as string },
  };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const ctxAuth = await loadActor(req);
  if (!ctxAuth) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const acc = await ensureAccess(supabase, sepId, ctxAuth.actor.email, ctxAuth.perms);
  if (!acc.sep) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!acc.isAdmin && !acc.isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('hr_separation_checklist')
    .select('*')
    .eq('separation_id', sepId)
    .order('category')
    .order('item_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data ?? [] });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const ctxAuth = await loadActor(req);
  if (!ctxAuth) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const acc = await ensureAccess(supabase, sepId, ctxAuth.actor.email, ctxAuth.perms);
  if (!acc.sep) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!acc.isAdmin && !acc.isSelf) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { item_id, status, proof_blob_url, recovery_amount, notes } = body as {
    item_id?: number;
    status?: 'pending' | 'done' | 'na' | 'blocked';
    proof_blob_url?: string;
    recovery_amount?: number;
    notes?: string;
  };
  if (!item_id) return NextResponse.json({ error: 'item_id required' }, { status: 400 });

  const { data: item, error: itemErr } = await supabase
    .from('hr_separation_checklist')
    .select('id, separation_id, category, status')
    .eq('id', item_id)
    .single();
  if (itemErr || !item || item.separation_id !== sepId) {
    return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 });
  }

  if (!acc.isAdmin) {
    // Employee-self: only the categories they actually do
    if (!EMPLOYEE_EDITABLE_CATEGORIES.has(item.category)) {
      return NextResponse.json(
        { error: 'Employees cannot edit this checklist category.' },
        { status: 403 },
      );
    }
    // And only set their item to done/pending (cannot recovery_amount or na)
    if (status && !['pending', 'done'].includes(status)) {
      return NextResponse.json(
        { error: 'Employees can only mark items pending or done.' },
        { status: 403 },
      );
    }
    if (recovery_amount !== undefined) {
      return NextResponse.json(
        { error: 'Only HR can set recovery_amount.' },
        { status: 403 },
      );
    }
  }

  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (proof_blob_url !== undefined) update.proof_blob_url = proof_blob_url;
  if (recovery_amount !== undefined) update.recovery_amount = recovery_amount;
  if (notes !== undefined) update.notes = notes;
  if (status === 'done') {
    update.done_by = ctxAuth.actor.email;
    update.done_at = new Date().toISOString();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('hr_separation_checklist')
    .update(update)
    .eq('id', item_id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ row: data });
}
