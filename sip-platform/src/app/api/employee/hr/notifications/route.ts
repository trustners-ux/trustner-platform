/**
 * Per-employee notifications.
 *   GET   — the signed-in employee's notifications + unread count.
 *   PATCH — mark one ({id}) or all ({all:true}) as read.
 *   POST  — broadcast a custom notification to active staff (HR, can_access_engagement).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { resolveEmployeeId, fanOutToActiveEmployees } from '@/lib/hr/notify';

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

  const empId = await resolveEmployeeId(supabase, actor.email);
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!empId) return NextResponse.json({ rows: [], unread: 0, canBroadcast: !!perms.can_access_engagement, note: 'No employee record on file yet.' });

  const { data, error } = await supabase
    .from('hr_notifications')
    .select('id, type, title, body, link, read_at, created_at, created_by')
    .eq('employee_id', empId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  const rows = data ?? [];
  return NextResponse.json({ rows, unread: rows.filter((r) => !r.read_at).length, canBroadcast: !!perms.can_access_engagement });
}

export async function PATCH(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
  const empId = await resolveEmployeeId(supabase, actor.email);
  if (!empId) return NextResponse.json({ error: 'No employee record' }, { status: 404 });

  const b = await req.json();
  const now = new Date().toISOString();
  let q = supabase.from('hr_notifications').update({ read_at: now }).eq('employee_id', empId).is('read_at', null);
  if (!b.all) {
    if (!b.id) return NextResponse.json({ error: 'id or all required' }, { status: 400 });
    q = q.eq('id', Number(b.id));
  }
  const { error } = await q;
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const perms = await getEffectivePermissions(actor.email, actor.role);
  if (!perms.can_access_engagement) return NextResponse.json({ error: 'Need can_access_engagement' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const b = await req.json();
  if (!b.title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  const entities = Array.isArray(b.entities) && b.entities.length ? b.entities.filter((e: string) => e === 'TAS' || e === 'TIB') : ['TAS', 'TIB'];
  let recipients = 0;
  try {
    recipients = await fanOutToActiveEmployees(supabase, {
      entities, type: 'broadcast', title: b.title, body: b.body || null, link: b.link || null, createdBy: actor.email,
    });
  } catch (e) {
    console.error('[Notifications broadcast]', (e as Error).message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, notified: recipients });
}
