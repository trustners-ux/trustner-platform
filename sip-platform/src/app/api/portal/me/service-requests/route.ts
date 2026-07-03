/**
 * GET  /api/portal/me/service-requests        — list my tickets
 * POST /api/portal/me/service-requests        — create a new ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalSessionFromRequest } from '@/lib/portal/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORIES = [
  'address_change', 'contact_update', 'nominee_change', 'kyc_update',
  'statement_request', 'withdrawal_request', 'bank_change', 'sip_change',
  'redemption_request', 'complaint', 'other',
];

export async function GET(req: NextRequest) {
  const sess = await getPortalSessionFromRequest(req);
  if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data, error } = await sb
    .from('client_service_requests')
    .select('id, ticket_code, category, subject, status, priority, last_activity_at, created_at')
    .eq('client_id', sess.clientId)
    .order('last_activity_at', { ascending: false });
  if (error) {
    console.error('[ServiceRequests]', error.message);
    return NextResponse.json({ error: 'Failed to load service requests' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, requests: data || [] });
}

interface CreateBody { category?: string; subject?: string; description?: string; priority?: string }

export async function POST(req: NextRequest) {
  const sess = await getPortalSessionFromRequest(req);
  if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: CreateBody = {};
  try { body = (await req.json()) as CreateBody; } catch {}
  const category = body.category;
  const subject = body.subject?.trim();
  if (!category || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `category must be one of: ${CATEGORIES.join(', ')}` }, { status: 400 });
  }
  if (!subject) return NextResponse.json({ error: 'subject required' }, { status: 400 });
  if (subject.length > 200) return NextResponse.json({ error: 'subject too long (max 200 chars)' }, { status: 400 });
  const priority = ['low', 'normal', 'high', 'urgent'].includes(body.priority || '') ? body.priority : 'normal';

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data, error } = await sb
    .from('client_service_requests')
    .insert({
      client_id: sess.clientId,
      category,
      subject,
      description: body.description?.trim() || null,
      priority,
      status: 'open',
      raised_via: 'portal',
      raised_by_user_id: sess.portalUserId,
    })
    .select('id, ticket_code, category, subject, status, priority, created_at')
    .single();
  if (error || !data) {
    console.error('[ServiceRequests:Create]', error?.message || 'create failed');
    return NextResponse.json({ error: 'Failed to create service request' }, { status: 500 });
  }

  // Initial "system" reply with the description for the activity log
  if (body.description?.trim()) {
    await sb.from('client_service_request_replies').insert({
      request_id: (data as { id: number }).id,
      author_kind: 'client',
      author_portal_user_id: sess.portalUserId,
      author_display_name: sess.displayName,
      body: body.description.trim(),
    });
  }

  return NextResponse.json({ ok: true, request: data });
}
