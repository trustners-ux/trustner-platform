/**
 * POST /api/admin/client-master/auto-link-families
 *
 * Walks every client and reconstructs the family graph from
 * metadata.source_family_head_code → source_platform_code links
 * (carried in from Wealth Elite / Investwell imports).
 *
 * Idempotent — re-running after another import only adds NEW
 * families + memberships.
 *
 * Auth: canWriteClients (editor+)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/client-master/actor';
import { canWriteClients } from '@/lib/client-master/permissions';
import { autoLinkFamilies } from '@/lib/client-master/family-autolinker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canWriteClients(a.role)) {
    return NextResponse.json({ error: 'Insufficient role for clients.write' }, { status: 403 });
  }
  try {
    const result = await autoLinkFamilies(a.actor);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Auto-link failed' },
      { status: 500 },
    );
  }
}
