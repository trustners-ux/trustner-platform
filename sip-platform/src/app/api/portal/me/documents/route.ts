/**
 * GET  /api/portal/me/documents              — list my uploaded docs
 * POST /api/portal/me/documents              — upload a new doc (multipart)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalSessionFromRequest } from '@/lib/portal/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { putClientDoc } from '@/lib/client-master/storage';
import { triggerDocOcr } from '@/lib/client-master/ocr';
import type { ClientDocType } from '@/lib/client-master/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES: ClientDocType[] = [
  'aadhaar', 'pan', 'passport', 'driving_license', 'voter_id',
  'photo', 'signature',
  'address_proof_current', 'address_proof_permanent',
  'income_proof', 'bank_proof', 'cancelled_cheque', 'other',
];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function GET(req: NextRequest) {
  const sess = await getPortalSessionFromRequest(req);
  if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data, error } = await sb
    .from('client_documents')
    .select('id, doc_type, file_name, file_size_bytes, file_mime, verification_status, ocr_status, ocr_mismatch_flags, uploaded_via, uploaded_at')
    .eq('client_id', sess.clientId)
    .order('uploaded_at', { ascending: false });
  if (error) {
    console.error('[Documents]', error.message);
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, documents: data || [] });
}

export async function POST(req: NextRequest) {
  const sess = await getPortalSessionFromRequest(req);
  if (!sess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'Multipart parse failed' }, { status: 400 }); }
  const file = form.get('file');
  const doc_type = form.get('doc_type') as string;
  if (!(file instanceof File)) return NextResponse.json({ error: 'file field required' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(doc_type as ClientDocType)) {
    return NextResponse.json({ error: `doc_type must be one of: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: 'Empty file' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const stored = await putClientDoc({
      client_id: sess.clientId,
      doc_type,
      file_name: file.name,
      mime: file.type || 'application/octet-stream',
      bytes,
    });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

    // Insert the client_documents row
    const { data: doc, error: insErr } = await sb
      .from('client_documents')
      .insert({
        client_id: sess.clientId,
        doc_type,
        file_name: file.name,
        file_size_bytes: stored.size_bytes,
        file_mime: stored.mime,
        file_sha256: stored.sha256,
        storage_key: stored.storage_key,
        verification_status: 'pending',
        ocr_status: (doc_type === 'pan' || doc_type === 'aadhaar') ? 'queued' : 'not_started',
        uploaded_by_portal_user_id: sess.portalUserId,
        uploaded_via: 'portal',
      })
      .select('id, doc_type, file_name, verification_status, ocr_status, uploaded_at')
      .single();

    if (insErr || !doc) {
      console.error('[Documents:Insert]', insErr?.message || 'unknown');
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Trigger OCR asynchronously for PAN/Aadhaar
    const docRow = doc as { id: number };
    if (doc_type === 'pan' || doc_type === 'aadhaar') {
      // Fire-and-forget — don't block the upload response
      triggerDocOcr(docRow.id).catch((err) => {
        console.error(`[portal/upload] OCR trigger failed for doc ${docRow.id}:`, err);
      });
    }

    return NextResponse.json({ ok: true, document: doc });
  } catch (err) {
    console.error('[Documents:Upload]', err);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 },
    );
  }
}
