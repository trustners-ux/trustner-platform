/**
 * GET   /api/employee/hr/exits/:id/fnf   — read hr_fnf row
 * PATCH /api/employee/hr/exits/:id/fnf   — HR-admin overrides a single field
 *   Body: { field: string, new_value: number, override_reason: string }
 *
 *   The override is appended to fnf.input_snapshot.audit_overrides[] for
 *   provenance and the totals are NOT auto-recomputed — caller must POST
 *   /calculate after if they want a clean recompute. (Override flow exists
 *   precisely to bypass the engine for edge cases.)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions, type HrPermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const OVERRIDABLE_FIELDS = new Set([
  'final_basic', 'final_hra', 'final_special', 'final_variable',
  'bonus_prorate', 'el_balance_days', 'el_encash_amount',
  'gratuity_amount', 'gratuity_taxable_excess', 'reimbursement_pending',
  'pf_deduction', 'esi_deduction', 'pt_deduction', 'tds_deduction',
  'loan_recovery', 'notice_shortfall_recovery', 'asset_recovery', 'other_recovery',
  'gross_payable', 'net_payable', 'paid_days', 'lop_days',
]);

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

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const g = await getAdminActor(req);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data, error } = await supabase
    .from('hr_fnf').select('*').eq('separation_id', sepId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'F&F not yet computed' }, { status: 404 });

  return NextResponse.json({ row: data });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sepId = Number(id);
  if (!Number.isFinite(sepId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const g = await getAdminActor(req);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { field, new_value, override_reason } = body as {
    field?: string;
    new_value?: number;
    override_reason?: string;
  };
  if (!field || new_value === undefined || !override_reason) {
    return NextResponse.json(
      { error: 'field, new_value, override_reason required' },
      { status: 400 },
    );
  }
  if (!OVERRIDABLE_FIELDS.has(field)) {
    return NextResponse.json(
      { error: `Field '${field}' is not overridable.` },
      { status: 400 },
    );
  }
  if (typeof new_value !== 'number' || !Number.isFinite(new_value)) {
    return NextResponse.json({ error: 'new_value must be a finite number' }, { status: 400 });
  }

  const { data: existing, error: exErr } = await supabase
    .from('hr_fnf').select('*').eq('separation_id', sepId).maybeSingle();
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });
  if (!existing) {
    return NextResponse.json({ error: 'F&F not yet computed' }, { status: 404 });
  }
  if (existing.status === 'disbursed' || existing.status === 'reversed') {
    return NextResponse.json(
      { error: `Cannot override fields on a ${existing.status} F&F row.` },
      { status: 422 },
    );
  }

  const oldValue = (existing as Record<string, unknown>)[field];
  const audit_entry = {
    field,
    old_value: oldValue,
    new_value,
    override_reason,
    overridden_by: g.actor?.email ?? 'hr_admin',
    overridden_at: new Date().toISOString(),
  };
  const inputSnap = (existing.input_snapshot ?? {}) as Record<string, unknown>;
  const existingOverrides = Array.isArray(inputSnap.audit_overrides)
    ? (inputSnap.audit_overrides as unknown[])
    : [];
  const newInputSnap = {
    ...inputSnap,
    audit_overrides: [...existingOverrides, audit_entry],
  };

  // Recompute gross + net if a component changed (excluding gross_payable/net_payable themselves)
  const update: Record<string, unknown> = {
    [field]: new_value,
    input_snapshot: newInputSnap,
  };

  if (field !== 'gross_payable' && field !== 'net_payable') {
    const merged = { ...existing, [field]: new_value } as Record<string, unknown>;
    const num = (k: string) => Number(merged[k] ?? 0);
    const grossPayable =
      num('final_basic') + num('final_hra') + num('final_special') + num('final_variable') +
      num('bonus_prorate') + num('el_encash_amount') + num('gratuity_amount') +
      num('reimbursement_pending');
    const deductions =
      num('pf_deduction') + num('esi_deduction') + num('pt_deduction') + num('tds_deduction') +
      num('loan_recovery') + num('notice_shortfall_recovery') +
      num('asset_recovery') + num('other_recovery');
    const netPayable = Math.max(0, Math.round((grossPayable - deductions) * 100) / 100);
    update.gross_payable = Math.round(grossPayable * 100) / 100;
    update.net_payable = netPayable;
  }

  const { data, error } = await supabase
    .from('hr_fnf').update(update).eq('id', existing.id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ row: data, override_logged: audit_entry });
}
