/**
 * HR Help Desk API.
 *
 * GET   /api/employee/hr/helpdesk        — list (employee sees own, HR sees all unassigned + assigned)
 * POST  /api/employee/hr/helpdesk        — raise new ticket (employee or HR-on-behalf)
 * PATCH /api/employee/hr/helpdesk        — update (assign, resolve, close, reopen)
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

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const scope = url.searchParams.get('scope') || 'mine';

  const perms = await getEffectivePermissions(actor.email, actor.role);
  const isHr = perms.can_access_reports || perms.can_access_employees;

  if (scope === 'all' && isHr) {
    const { data } = await supabase
      .from('hr_helpdesk_tickets')
      .select('id, employee_id, category, subject, description, priority, status, assigned_to, resolution, created_at, updated_at, hr_employees(full_name, employee_code, email)')
      .order('created_at', { ascending: false })
      .limit(200);
    return NextResponse.json({ tickets: data ?? [], isHr: true });
  }

  // 'mine' — resolve employee_id from actor email
  const { data: emp } = await supabase
    .from('hr_employees').select('id').eq('email', actor.email.toLowerCase()).maybeSingle();
  if (!emp) return NextResponse.json({ tickets: [], isHr });

  const { data } = await supabase
    .from('hr_helpdesk_tickets')
    .select('id, category, subject, description, priority, status, assigned_to, resolution, created_at, updated_at')
    .eq('employee_id', emp.id)
    .order('created_at', { ascending: false });
  return NextResponse.json({ tickets: data ?? [], isHr });
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { category, subject, description, priority } = body;
  if (!category || !subject || !description) {
    return NextResponse.json({ error: 'category, subject, description required' }, { status: 400 });
  }

  const { data: emp } = await supabase
    .from('hr_employees').select('id').eq('email', actor.email.toLowerCase()).maybeSingle();
  if (!emp) return NextResponse.json({ error: 'No employee record for your email' }, { status: 400 });

  const { data, error } = await supabase
    .from('hr_helpdesk_tickets')
    .insert({
      employee_id: emp.id, category, subject, description,
      priority: priority || 'normal',
    })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}

export async function PATCH(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  const isHr = perms.can_access_reports || perms.can_access_employees;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const body = await req.json();
  const { id, action, resolution, priority } = body as {
    id?: number; action?: 'assign' | 'in_progress' | 'resolve' | 'close' | 'reopen';
    resolution?: string; priority?: string;
  };
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  // Only HR can act on tickets (employees can only create + view their own)
  if (!isHr) {
    return NextResponse.json({ error: 'Only HR can update ticket status' }, { status: 403 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (action === 'assign') { patch.assigned_to = actor.email; patch.status = 'in_progress'; }
  if (action === 'in_progress') patch.status = 'in_progress';
  if (action === 'resolve') {
    patch.status = 'resolved';
    patch.resolved_at = new Date().toISOString();
    if (resolution) patch.resolution = resolution;
  }
  if (action === 'close') patch.status = 'closed';
  if (action === 'reopen') patch.status = 'reopened';
  if (priority) patch.priority = priority;

  const { data, error } = await supabase
    .from('hr_helpdesk_tickets')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data });
}
