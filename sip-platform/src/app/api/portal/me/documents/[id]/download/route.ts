/**
 * GET /api/portal/me/documents/[id]/download
 * Returns a short-lived signed URL the client can use to download their own
 * doc. Validates ownership (client_id == session.clientId).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalSessionFromRequest } from '@/lib/portal/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { signedClientDocUrl } from '@/lib/client-master/storage';

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
  const { data } = await sb
    .from('client_documents')
    .select('client_id, storage_key, file_name')
    .eq('id', id)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const row = data as { client_id: number; storage_key: string; file_name: string };
  if (row.client_id !== sess.clientId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const url = await signedClientDocUrl(row.storage_key, 60);
    return NextResponse.json({ ok: true, signed_url: url, file_name: row.file_name });
  } catch (err) {
    console.error('[DocumentDownload]', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
