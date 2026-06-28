/**
 * Document OCR — India-region PAN + Aadhaar extraction (audit P0-2).
 *
 * The provider is selected by OCR_PROVIDER (see ocr-providers.ts). It defaults
 * to DISABLED so that no Aadhaar/PAN image leaves India until an India-region
 * provider is provisioned; in that case OCR is skipped and staff enter the
 * fields manually. Raw text → structured fields happens in the pure, testable
 * ocr-extract.ts.
 *
 * State machine on client_documents.ocr_status:
 *   not_started → queued → running → done | skipped | failed
 *
 * Output:
 *   - ocr_text: raw text extracted from the doc
 *   - ocr_extracted_fields: structured JSON {name, dob, pan_number, aadhaar_last_4}
 *   - ocr_mismatch_flags: {pan_mismatch, name_mismatch, dob_mismatch}
 */

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { signedClientDocUrl } from './storage';
import type { ClientDocType } from './types';
import { runOcr } from './ocr-providers';
import { extractPanFields, extractAadhaarFields, type IdFields } from './ocr-extract';

type Fields = IdFields;

function computeMismatchFlags(
  docType: ClientDocType,
  extracted: Fields,
  master: { display_name: string; pan: string | null; aadhaar_last4: string | null; dob: string | null },
): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  if (docType === 'pan' && 'pan_number' in extracted && extracted.pan_number) {
    flags.pan_mismatch = master.pan ? master.pan.toUpperCase() !== extracted.pan_number.toUpperCase() : false;
  }
  if (docType === 'aadhaar' && 'aadhaar_last_4' in extracted && extracted.aadhaar_last_4) {
    flags.aadhaar_last4_mismatch = master.aadhaar_last4 ? master.aadhaar_last4 !== extracted.aadhaar_last_4 : false;
  }
  if (extracted.dob && master.dob) {
    flags.dob_mismatch = master.dob.slice(0, 10) !== extracted.dob.slice(0, 10);
  }
  if (extracted.name && master.display_name) {
    // Loose name match — case + whitespace-insensitive substring
    const m = master.display_name.toLowerCase().replace(/[^a-z]/g, '');
    const e = extracted.name.toLowerCase().replace(/[^a-z]/g, '');
    flags.name_mismatch = !(m.includes(e) || e.includes(m));
  }
  return flags;
}

/**
 * Fire-and-forget OCR trigger. Caller (the upload route) should call this
 * without awaiting — we run the OCR + write back to the row inline since
 * Vercel functions don't have great background-job support.
 *
 * For docs other than PAN/Aadhaar this is a no-op.
 */
export async function triggerDocOcr(doc_id: number): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  // Fetch doc + client
  const { data, error } = await sb
    .from('client_documents')
    .select('id, client_id, doc_type, storage_key, file_mime, clients!inner(display_name, pan, aadhaar_last4, dob)')
    .eq('id', doc_id)
    .maybeSingle();
  if (error || !data) return;
  type Row = {
    id: number; client_id: number; doc_type: ClientDocType; storage_key: string; file_mime: string;
    clients: { display_name: string; pan: string | null; aadhaar_last4: string | null; dob: string | null };
  };
  const row = data as unknown as Row;
  if (row.doc_type !== 'pan' && row.doc_type !== 'aadhaar') return;
  if (!row.file_mime.startsWith('image/')) {
    // PDFs/etc. — we'd need a different pipeline (pdf → image). Mark as failed for now.
    await sb.from('client_documents').update({
      ocr_status: 'failed',
      ocr_error: 'OCR currently supports image uploads only (jpg/png/heic). PDF support coming soon.',
      ocr_attempted_at: new Date().toISOString(),
    }).eq('id', doc_id);
    return;
  }

  await sb.from('client_documents').update({
    ocr_status: 'running',
    ocr_attempted_at: new Date().toISOString(),
  }).eq('id', doc_id);

  try {
    // Short-lived signed URL the OCR provider fetches. The provider is selected
    // by OCR_PROVIDER and is India-region by policy (audit P0-2).
    const url = await signedClientDocUrl(row.storage_key, 120);
    const ocr = await runOcr({ imageUrl: url, mimeType: row.file_mime, docType: row.doc_type });

    if (!ocr.ok) {
      // Terminal either way. `reason` distinguishes "OCR off by policy → enter
      // PAN/Aadhaar manually" from a genuine provider error, for the staff UI.
      await sb.from('client_documents').update({
        ocr_status: 'failed',
        ocr_error: ocr.reason,
        ocr_completed_at: new Date().toISOString(),
      }).eq('id', doc_id);
      return;
    }

    const fields: Fields = row.doc_type === 'pan'
      ? extractPanFields(ocr.rawText)
      : extractAadhaarFields(ocr.rawText);

    const flags = computeMismatchFlags(row.doc_type, fields, row.clients);

    await sb.from('client_documents').update({
      ocr_status: 'done',
      ocr_text: fields.raw_text || null,
      ocr_extracted_fields: fields,
      ocr_mismatch_flags: flags,
      ocr_completed_at: new Date().toISOString(),
      ocr_error: null,
    }).eq('id', doc_id);
  } catch (err) {
    await sb.from('client_documents').update({
      ocr_status: 'failed',
      ocr_error: err instanceof Error ? err.message : 'OCR failed',
      ocr_completed_at: new Date().toISOString(),
    }).eq('id', doc_id);
  }
}
