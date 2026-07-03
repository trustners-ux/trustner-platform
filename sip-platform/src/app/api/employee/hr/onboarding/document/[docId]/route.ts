/**
 * Onboarding KYC document — authenticated proxy (HR only — requires can_access_onboarding).
 *
 * GET /api/employee/hr/onboarding/document/[docId]
 *
 * The underlying file lives in a PRIVATE Vercel Blob (PAN/Aadhaar scans are
 * real government-ID documents) — this route is the only way to read it,
 * gated the same way as the rest of the onboarding admin API.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
import { NextRequest, NextResponse } from 'next/server';
import { get } from '@vercel/blob';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { verifyEmployeeToken, EMPLOYEE_COOKIE } from '@/lib/auth/employee-jwt';
import { getEffectivePermissions } from '@/lib/hr/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

const PRIVATE_TOKEN = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;

async function actorOk(req: NextRequest) {
  const tok = req.cookies.get(EMPLOYEE_COOKIE)?.value;
  if (!tok) return null;
  const actor = await verifyEmployeeToken(tok);
  if (!actor) return null;
  const perms = await getEffectivePermissions(actor.email, actor.role);
  return perms.can_access_onboarding ? actor : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const actor = await actorOk(req);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { docId } = await params;
  const numericId = parseInt(docId, 10);
  if (Number.isNaN(numericId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 });

  const { data: doc } = await supabase
    .from('hr_onboarding_documents')
    .select('blob_url, filename, mime_type')
    .eq('id', numericId)
    .maybeSingle();
  if (!doc?.blob_url) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const blob = await get(doc.blob_url, { access: 'private', useCache: false, token: PRIVATE_TOKEN });
  if (!blob?.stream) return NextResponse.json({ error: 'Document not found in storage' }, { status: 404 });

  return new NextResponse(blob.stream, {
    status: 200,
    headers: {
      'Content-Type': (doc.mime_type as string) || blob.blob.contentType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${(doc.filename as string) || 'document'}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
