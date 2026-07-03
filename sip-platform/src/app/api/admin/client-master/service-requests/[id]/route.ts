/**
 * GET   /api/admin/client-master/service-requests/[id]   — read ticket + replies
 * PATCH /api/admin/client-master/service-requests/[id]   — update status/priority/assignee/notes
 * POST  /api/admin/client-master/service-requests/[id]   — add admin reply (or internal note)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/client-master/actor';
import { canReadClients, canWriteClients } from '@/lib/client-master/permissions';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['open', 'in_progress', 'waiting_on_client', 'resolved', 'cancelled', 'escalated'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canReadClients(a.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id: idStr } = await ctx.params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: r } = await sb
    .from('client_service_requests')
    .select('*, clients!inner(id, code, display_name, mobile_primary, email_primary)')
    .eq('id', id)
    .maybeSingle();
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: replies } = await sb
    .from('client_service_request_replies')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ ok: true, request: r, replies: replies || [] });
}

interface PatchBody {
  status?: string;
  priority?: string;
  assigned_to_email?: string;
  resolution_notes?: string;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canWriteClients(a.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id: idStr } = await ctx.params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body: PatchBody = {};
  try { body = (await req.json()) as PatchBody; } catch {}
  const update: Record<string, unknown> = { last_activity_at: new Date().toISOString() };
  if (body.status && STATUSES.includes(body.status)) {
    update.status = body.status;
    if (body.status === 'resolved') {
      update.resolved_at = new Date().toISOString();
      update.resolved_by_user_id = a.actor.user_id;
    }
  }
  if (body.priority && PRIORITIES.includes(body.priority)) update.priority = body.priority;
  if (body.assigned_to_email !== undefined) {
    update.assigned_to_email = body.assigned_to_email || null;
  }
  if (body.resolution_notes !== undefined) update.resolution_notes = body.resolution_notes;

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
  const { data, error } = await sb
    .from('client_service_requests')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  // Log a system entry for the status change
  if (body.status) {
    await sb.from('client_service_request_replies').insert({
      request_id: id,
      author_kind: 'system',
      author_display_name: a.name,
      body: `Status changed to ${body.status} by ${a.actor.email}`,
      status_changed_to: body.status,
    });
  }

  return NextResponse.json({ ok: true, request: data });
}

interface ReplyBody { body?: string; is_internal_note?: boolean }

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canWriteClients(a.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id: idStr } = await ctx.params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body: ReplyBody = {};
  try { body = (await req.json()) as ReplyBody; } catch {}
  const text = body.body?.trim();
  if (!text) return NextResponse.json({ error: 'body required' }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data, error } = await sb
    .from('client_service_request_replies')
    .insert({
      request_id: id,
      author_kind: 'admin',
      author_user_id: a.actor.user_id,
      author_display_name: a.name,
      body: text,
      is_internal_note: !!body.is_internal_note,
    })
    .select('*')
    .single();
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }

  // Bump activity + transition status on admin reply
  await sb
    .from('client_service_requests')
    .update({
      last_activity_at: new Date().toISOString(),
      ...(body.is_internal_note ? {} : {
        // Public admin reply → flip to waiting_on_client
        status: 'waiting_on_client',
      }),
    })
    .eq('id', id);

  return NextResponse.json({ ok: true, reply: data });
}
