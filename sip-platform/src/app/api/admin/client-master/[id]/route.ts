/**
 * GET   /api/admin/client-master/[id]  — single client (KYC-masked per role)
 * PATCH /api/admin/client-master/[id]  — apply edits
 *
 * Permissions:
 *   - GET   → canReadClients (viewer+)
 *   - PATCH → canWriteClients (editor+)
 *   - Editing PAN/Aadhaar requires canViewClientKyc (admin+)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/client-master/actor';
import {
  canReadClients,
  canWriteClients,
  canViewClientKyc,
} from '@/lib/client-master/permissions';
import {
  getClient,
  updateClient,
  maskAadhaar,
  maskPan,
  type UpdateClientPatch,
} from '@/lib/client-master/clients';
import type { ClientRow } from '@/lib/client-master/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function maskForResponse(row: ClientRow, kycVisible: boolean) {
  const aadhaar_display = maskAadhaar(row.aadhaar_last4);
  const pan_display = kycVisible ? row.pan ?? '—' : maskPan(row.pan);
  if (kycVisible) {
    return { ...row, aadhaar_display, pan_display };
  }
  const copy: Partial<ClientRow> = { ...row };
  delete copy.aadhaar_last4;
  delete copy.aadhaar_hash;
  delete copy.aadhaar_status;
  copy.pan = maskPan(row.pan) === '—' ? null : (maskPan(row.pan) as string);
  return { ...copy, aadhaar_display, pan_display };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canReadClients(a.role)) {
    return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
  }
  const { id: idStr } = await context.params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const row = await getClient(id);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    ok: true,
    client: maskForResponse(row, canViewClientKyc(a.role)),
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canWriteClients(a.role)) {
    return NextResponse.json({ error: 'Insufficient role' }, { status: 403 });
  }
  const { id: idStr } = await context.params;
  const id = /^[1-9][0-9]*$/.test(idStr) ? Number(idStr) : null;
  if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  let body: UpdateClientPatch & { aadhaar_full12?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // KYC edits gated tighter than the rest of the form
  const touchesKyc = 'pan' in body || 'aadhaar_full12' in body;
  if (touchesKyc && !canViewClientKyc(a.role)) {
    return NextResponse.json({ error: 'KYC edits require admin tier' }, { status: 403 });
  }

  try {
    const row = await updateClient(id, body, a.actor);
    return NextResponse.json({
      ok: true,
      client: maskForResponse(row, canViewClientKyc(a.role)),
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Update failed' },
      { status: 400 },
    );
  }
}
