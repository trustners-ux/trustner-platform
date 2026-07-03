/**
 * PUBLIC document upload endpoint.
 *
 * POST /api/onboarding/<token>/upload
 *   Multipart form data: file=<File>, category=<string>
 *   Writes the file to Vercel Blob (private) and creates a row in
 *   hr_onboarding_documents.
 *
 * Constraints:
 *   - File size capped at 10 MB
 *   - Allowed MIME: PDF + common image types
 *   - Token must be valid and not expired/approved/rejected
 */
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getSupabaseAdmin } from '@/lib/db/supabase';

// KYC scans (PAN/Aadhaar) are real government-ID documents — stored in the
// dedicated PRIVATE store (its own token; the original project store is
// public-only and rejects private writes outright).
const PRIVATE_TOKEN = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
]);

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: rec } = await supabase
    .from('hr_onboarding')
    .select('id, status, expires_at, candidate_name, entity')
    .eq('token', token)
    .single();
  if (!rec) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  if (new Date(rec.expires_at) < new Date()) return NextResponse.json({ error: 'Token expired' }, { status: 410 });
  if (['approved', 'rejected'].includes(rec.status)) {
    return NextResponse.json({ error: `Onboarding already ${rec.status}` }, { status: 409 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const category = String(form.get('category') || '');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: 'category is required' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: `File exceeds ${MAX_SIZE / 1024 / 1024} MB limit` }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
  }

  // Path keeps blobs grouped per onboarding record
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
  const key = `hr-onboarding/${rec.id}/${category}-${Date.now()}-${safeName}`;
  const blob = await put(key, file, { access: 'private', addRandomSuffix: true, token: PRIVATE_TOKEN });

  // Update onboarding status to in_progress if still 'invited'
  if (rec.status === 'invited') {
    await supabase.from('hr_onboarding').update({ status: 'in_progress' }).eq('id', rec.id);
  }

  const { data, error } = await supabase
    .from('hr_onboarding_documents')
    .insert({
      onboarding_id: rec.id,
      category,
      filename: file.name,
      blob_url: blob.url,
      size_bytes: file.size,
      mime_type: file.type,
    })
    .select('id, category, filename, uploaded_at, status')
    .single();

  if (error) {
    console.error('[OnboardingUpload]', error.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
  return NextResponse.json({ document: data });
}
