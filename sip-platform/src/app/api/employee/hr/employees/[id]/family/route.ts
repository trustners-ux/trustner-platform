/**
 * Family-member roster for an employee.
 * GET    /api/employee/hr/employees/:id/family
 * POST   /api/employee/hr/employees/:id/family       (add member)
 * DELETE /api/employee/hr/employees/:id/family?fid=N (remove member)
 *
 * This is the data backbone for the POSP cross-check engine in Phase 6.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function actorOk(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return perms.can_access_employees ? actor : null;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await actorOk(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
  const { data, error } = await supabase
    .from('hr_employee_family')
    .select('*')
    .eq('employee_id', id)
    .order('relation');
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ family: data ?? [] });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await actorOk(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await ctx.params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { relation, name, pan, aadhaar_last4, dob, notes } = body;
  if (!relation || !name) return NextResponse.json({ error: 'relation and name required' }, { status: 400 });

  const { data, error } = await supabase
    .from('hr_employee_family')
    .insert({ employee_id: Number(id), relation, name, pan, aadhaar_last4, dob, notes })
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ member: data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await actorOk(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const fid = url.searchParams.get('fid');
  if (!fid) return NextResponse.json({ error: 'fid required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { error } = await supabase
    .from('hr_employee_family')
    .delete()
    .eq('id', fid)
    .eq('employee_id', id);
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
