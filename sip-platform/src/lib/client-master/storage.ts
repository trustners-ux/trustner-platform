/**
 * Client KYC document storage — Supabase Storage bucket 'client-docs'.
 *
 * Bucket: client-docs (private, signed-URL access only)
 * Path:   <client_id>/<doc_type>/<sha256>.<ext>
 *
 * Content-addressed (sha256 in filename) so re-uploading identical bytes
 * is idempotent — no duplicate objects.
 *
 * The bucket itself must be created out-of-band — see the deploy
 * checklist in README. This module assumes the bucket exists.
 */

import * as crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/db/supabase';

export const CLIENT_DOCS_BUCKET = 'client-docs';

const ALLOWED_EXT = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff', 'heic', 'heif']);
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'image/tiff', 'image/heic', 'image/heif',
]);

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per doc

function safeExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]{1,8})$/);
  if (!m) return 'bin';
  return ALLOWED_EXT.has(m[1]) ? m[1] : 'bin';
}

export interface StoredClientDoc {
  storage_key: string;
  size_bytes: number;
  sha256: string;
  mime: string;
}

export interface PutClientDocInput {
  client_id: number;
  doc_type: string;
  file_name: string;
  mime: string;
  bytes: Buffer;
}

/** Upload a client KYC doc to Supabase Storage. Returns the storage key. */
export async function putClientDoc(input: PutClientDocInput): Promise<StoredClientDoc> {
  if (!Number.isInteger(input.client_id) || input.client_id <= 0) {
    throw new Error('Invalid client_id');
  }
  if (input.bytes.length === 0) throw new Error('Empty file');
  if (input.bytes.length > MAX_FILE_BYTES) {
    throw new Error(`File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB per doc)`);
  }
  if (!ALLOWED_MIMES.has(input.mime)) {
    throw new Error(`File type "${input.mime}" not allowed for KYC docs`);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');

  const sha256 = crypto.createHash('sha256').update(input.bytes).digest('hex');
  const ext = safeExt(input.file_name);
  const storage_key = `${input.client_id}/${input.doc_type}/${sha256}.${ext}`;

  // upsert: true so re-uploading the same bytes is idempotent
  const { error } = await supabase.storage
    .from(CLIENT_DOCS_BUCKET)
    .upload(storage_key, input.bytes, {
      contentType: input.mime,
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return {
    storage_key,
    size_bytes: input.bytes.length,
    sha256,
    mime: input.mime,
  };
}

/**
 * Returns a short-lived signed URL for downloading a client doc.
 * Used when admins click "Download" on a KYC doc.
 */
export async function signedClientDocUrl(
  storage_key: string,
  expires_in_seconds = 60,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.storage
    .from(CLIENT_DOCS_BUCKET)
    .createSignedUrl(storage_key, expires_in_seconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${error?.message || 'unknown'}`);
  }
  return data.signedUrl;
}

/** Hard-delete a client doc object from storage (e.g. on doc record removal). */
export async function deleteClientDoc(storage_key: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.storage
    .from(CLIENT_DOCS_BUCKET)
    .remove([storage_key]);

  if (error) throw new Error(`Storage delete failed: ${error.message}`);
}
