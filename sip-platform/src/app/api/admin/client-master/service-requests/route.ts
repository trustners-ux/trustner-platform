/**
 * GET /api/admin/client-master/service-requests
 *
 * Admin-side queue of all client service requests.
 *
 * Query params:
 *   status   = open|in_progress|waiting_on_client|resolved|cancelled|escalated
 *   category = address_change|... (see migration 030)
 *   client_id = filter to one client
 *   q        = search subject + ticket_code
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/client-master/actor';
import { canReadClients } from '@/lib/client-master/permissions';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canReadClients(a.role)) {
    return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const url = req.nextUrl;
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const client_id = url.searchParams.get('client_id');
  const q = url.searchParams.get('q')?.trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || '100'), 1), 500);
  const offset = Math.max(Number(url.searchParams.get('offset') || '0'), 0);

  let query = sb
    .from('client_service_requests')
    .select('id, ticket_code, client_id, category, subject, status, priority, assigned_to_email, last_activity_at, created_at, clients!inner(id, code, display_name)', { count: 'exact' })
    .order('last_activity_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (client_id && /^[1-9][0-9]*$/.test(client_id)) query = query.eq('client_id', Number(client_id));
  if (q) query = query.or(`subject.ilike.%${q}%,ticket_code.ilike.%${q}%`);

  const { data, count, error } = await query;
  if (error) { console.error(error.message); return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
  return NextResponse.json({ ok: true, requests: data || [], total: count ?? 0, limit, offset });
}
