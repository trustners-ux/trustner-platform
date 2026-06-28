/**
 * Announcements board.
 *   GET    — list (any signed-in employee sees published; HR with can_access_engagement sees all).
 *   POST   — create (HR, can_access_engagement). status 'draft' or 'published'.
 *   PATCH  — update / publish / pin / archive (HR). Publishing fans out notifications once.
 *   DELETE — remove (HR).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';
import { fanOutToActiveEmployees } from '@/lib/hr/notify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

async function getActor(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  return verifyEmployeeToken(tok);
}
async function canManage(email: string, role: string) {
  const perms = await getEffectivePermissions(email, role);
  return !!perms.can_access_engagement;
}

export async function GET(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const manage = await canManage(actor.email, actor.role);
  let query = supabase
    .from('hr_announcements')
    .select('id, title, body, entities, category, pinned, status, published_at, created_by, created_at, updated_at')
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (!manage) query = query.eq('status', 'published');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [], canManage: manage });
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!(await canManage(actor.email, actor.role))) return NextResponse.json({ error: 'Need can_access_engagement' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const b = await req.json();
  if (!b.title || !b.body) return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  const entities = Array.isArray(b.entities) && b.entities.length ? b.entities.filter((e: string) => e === 'TAS' || e === 'TIB') : ['TAS', 'TIB'];
  const publishNow = b.status === 'published';

  const { data, error } = await supabase
    .from('hr_announcements')
    .insert({
      title: b.title, body: b.body, entities,
      category: b.category || 'general',
      pinned: !!b.pinned,
      status: publishNow ? 'published' : 'draft',
      published_at: publishNow ? new Date().toISOString() : null,
      created_by: actor.email,
    })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let recipients = 0;
  if (publishNow) {
    try {
      recipients = await fanOutToActiveEmployees(supabase, {
        entities, type: 'announcement', title: data.title, body: data.body,
        link: '/employee/hr/notifications', announcementId: data.id, createdBy: actor.email,
      });
    } catch { /* notification fan-out is best-effort */ }
  }
  return NextResponse.json({ announcement: data, notified: recipients });
}

export async function PATCH(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!(await canManage(actor.email, actor.role))) return NextResponse.json({ error: 'Need can_access_engagement' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data: existing } = await supabase.from('hr_announcements').select('*').eq('id', b.id).single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch: Record<string, unknown> = {};
  for (const k of ['title', 'body', 'entities', 'category', 'pinned', 'status'] as const) {
    if (k in b) patch[k] = b[k];
  }
  // First transition into 'published' stamps the time + fans out.
  const becomingPublished = b.status === 'published' && existing.status !== 'published';
  if (becomingPublished) patch.published_at = new Date().toISOString();

  const { data, error } = await supabase.from('hr_announcements').update(patch).eq('id', b.id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let recipients = 0;
  if (becomingPublished) {
    try {
      recipients = await fanOutToActiveEmployees(supabase, {
        entities: data.entities, type: 'announcement', title: data.title, body: data.body,
        link: '/employee/hr/notifications', announcementId: data.id, createdBy: actor.email,
      });
    } catch { /* best-effort */ }
  }
  return NextResponse.json({ announcement: data, notified: recipients });
}

export async function DELETE(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  if (!(await canManage(actor.email, actor.role))) return NextResponse.json({ error: 'Need can_access_engagement' }, { status: 403 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabase.from('hr_announcements').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
