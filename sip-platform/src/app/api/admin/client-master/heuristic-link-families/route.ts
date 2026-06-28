/**
 * POST /api/admin/client-master/heuristic-link-families
 *
 * Best-effort family linker using last_name + pincode + addr_line1 match,
 * plus shared-mobile match. Skips clients already in a family.
 *
 * Auth: canWriteClients (editor+)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/client-master/actor';
import { canWriteClients } from '@/lib/client-master/permissions';
import { runHeuristicFamilyLinker } from '@/lib/client-master/heuristic-linker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — heuristic scan + grouping over 4k+ rows

export async function POST(req: NextRequest) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canWriteClients(a.role)) {
    return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
  }
  try {
    const result = await runHeuristicFamilyLinker(a.actor);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Heuristic link failed' },
      { status: 500 },
    );
  }
}
