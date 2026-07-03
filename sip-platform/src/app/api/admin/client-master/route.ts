/**
 * GET  /api/admin/client-master?q=...&status=...&kyc_status=... — paginated list
 * POST /api/admin/client-master                                  — create
 *
 * NOTE: this lives at /client-master/ (not /clients/) because merasip already
 * had a /admin/clients route serving the Portfolio Diagnostic client-families
 * directory. Two distinct concepts, two distinct URLs.
 *
 * Permissions:
 *   - GET  → canReadClients (viewer+)
 *   - POST → canWriteClients (editor+)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/client-master/actor';
import {
  canReadClients,
  canWriteClients,
  canViewClientKyc,
} from '@/lib/client-master/permissions';
import {
  listClients,
  createClient,
  maskAadhaar,
  maskPan,
  DuplicateClientError,
  type CreateClientInput,
} from '@/lib/client-master/clients';
import type { ClientRow, ClientStatus, KycStatus } from '@/lib/client-master/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MaskedClient extends Partial<ClientRow> {
  aadhaar_display: string;
  pan_display: string;
}

function maskForResponse(row: ClientRow, kycVisible: boolean): MaskedClient {
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

export async function GET(req: NextRequest) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canReadClients(a.role)) {
    return NextResponse.json({ error: 'Insufficient role for clients.read' }, { status: 403 });
  }

  const url = req.nextUrl;
  const q = url.searchParams.get('q') || undefined;
  const status = url.searchParams.get('status') as ClientStatus | null;
  const kycStatus = url.searchParams.get('kyc_status') as KycStatus | null;
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || '50'), 1), 200);
  const offset = Math.max(Number(url.searchParams.get('offset') || '0'), 0);

  try {
    const result = await listClients({
      q,
      status: status || undefined,
      kyc_status: kycStatus || undefined,
      limit,
      offset,
    });
    const kycVisible = canViewClientKyc(a.role);
    return NextResponse.json({
      ok: true,
      rows: result.rows.map((r) => maskForResponse(r, kycVisible)),
      total: result.total,
      limit,
      offset,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'List failed' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const a = await getRequestActor(req);
  if (!a) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  if (!canWriteClients(a.role)) {
    return NextResponse.json({ error: 'Insufficient role for clients.write' }, { status: 403 });
  }

  let body: Partial<CreateClientInput>;
  try {
    body = (await req.json()) as Partial<CreateClientInput>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.first_name || !body.last_name) {
    return NextResponse.json({ error: 'first_name and last_name required' }, { status: 400 });
  }

  try {
    const row = await createClient({
      ...body,
      first_name: body.first_name as string,
      last_name: body.last_name as string,
      actor: a.actor,
    });
    return NextResponse.json({
      ok: true,
      client: maskForResponse(row, canViewClientKyc(a.role)),
    });
  } catch (err) {
    if (err instanceof DuplicateClientError) {
      return NextResponse.json({ error: err.message, existing: err.existing }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Create failed' },
      { status: 400 },
    );
  }
}
