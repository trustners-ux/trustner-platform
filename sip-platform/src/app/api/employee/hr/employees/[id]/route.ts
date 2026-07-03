/**
 * GET    /api/employee/hr/employees/:id   (with family roster)
 * PUT    /api/employee/hr/employees/:id   (update)
 * DELETE /api/employee/hr/employees/:id   (soft delete — sets status='exited')
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}

async function guard(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return { error: 'Unauthenticated', status: 401 as const, actor: null };
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_access_employees) {
    return { error: 'Need can_access_employees permission', status: 403 as const, actor };
  }
  return { actor, error: null };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status });
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const [{ data: employee, error: e1 }, { data: family, error: e2 }] = await Promise.all([
    supabase.from('hr_employees').select('*').eq('id', id).single(),
    supabase.from('hr_employee_family').select('*').eq('employee_id', id).order('relation'),
  ]);

  if (e1) {
    console.error('[Employee fetch]', e1.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  if (e2) console.error('Family fetch error:', e2.message);
  return NextResponse.json({ employee, family: family ?? [] });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status });
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { id: _id, full_name: _fn, total_ctc_monthly: _tc, created_at: _ca, updated_at: _ua, ...patch } = body;
  void _id; void _fn; void _tc; void _ca; void _ua;

  const { data, error } = await supabase
    .from('hr_employees')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ employee: data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(req);
  if (g.error) return NextResponse.json({ error: g.error }, { status: g.status });
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  // Soft delete — mark exited rather than physical delete (preserves audit trail)
  const { data, error } = await supabase
    .from('hr_employees')
    .update({ status: 'exited', exit_date: new Date().toISOString().slice(0, 10) })
    .eq('id', id)
    .select('id, status, exit_date')
    .single();

  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ employee: data });
}
