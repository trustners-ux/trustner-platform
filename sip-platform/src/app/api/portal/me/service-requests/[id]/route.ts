/**
 * GET  /api/portal/me/service-requests/[id]      — read full ticket + thread
 * POST /api/portal/me/service-requests/[id]      — add a client reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalSessionFromRequest } from '@/lib/portal/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sess = await getPortalSessionFromRequest(req);
  if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: idStr } = await ctx.params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });
  const { data: r } = await sb
    .from('client_service_requests')
    .select('*')
    .eq('id', id)
    .eq('client_id', sess.clientId)
    .maybeSingle();
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: replies } = await sb
    .from('client_service_request_replies')
    .select('id, author_kind, author_display_name, body, status_changed_to, created_at, is_internal_note')
    .eq('request_id', id)
    .eq('is_internal_note', false) // hide internal admin notes from clients
    .order('created_at', { ascending: true });

  return NextResponse.json({ ok: true, request: r, replies: replies || [] });
}

interface ReplyBody { body?: string }

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sess = await getPortalSessionFromRequest(req);
  if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: idStr } = await ctx.params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body: ReplyBody = {};
  try { body = (await req.json()) as ReplyBody; } catch {}
  const text = body.body?.trim();
  if (!text) return NextResponse.json({ error: 'body required' }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  // Verify ownership
  const { data: r } = await sb
    .from('client_service_requests')
    .select('id, status')
    .eq('id', id)
    .eq('client_id', sess.clientId)
    .maybeSingle();
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const reqRow = r as { id: number; status: string };
  const { data: reply, error } = await sb
    .from('client_service_request_replies')
    .insert({
      request_id: id,
      author_kind: 'client',
      author_portal_user_id: sess.portalUserId,
      author_display_name: sess.displayName,
      body: text,
    })
    .select('id, author_kind, author_display_name, body, created_at')
    .single();
  if (error) {
    console.error('[ServiceRequest:Reply]', error.message);
    return NextResponse.json({ error: 'Failed to load service request' }, { status: 500 });
  }

  // Bump last_activity + auto-flip waiting_on_client back to in_progress
  const newStatus = reqRow.status === 'waiting_on_client' ? 'in_progress' : reqRow.status;
  await sb
    .from('client_service_requests')
    .update({ last_activity_at: new Date().toISOString(), status: newStatus })
    .eq('id', id);

  return NextResponse.json({ ok: true, reply });
}
