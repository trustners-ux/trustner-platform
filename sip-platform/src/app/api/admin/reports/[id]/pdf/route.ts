import { NextRequest, NextResponse } from 'next/server';
import { getReportPdf } from '@/lib/admin/report-queue-store';

/**
 * Serves the latest PDF from blob storage with strong no-cache headers.
 *
 * Why this exists: Vercel Blob URLs are CDN-cached for 30 days by default
 * (`Cache-Control: public, max-age=2592000`). When we overwrite a blob at
 * the same path during scenario regeneration, the CDN still serves the old
 * cached bytes. Even appending `?v=N` to the URL does not bust this cache
 * because Vercel Blob's edge ignores query strings.
 *
 * By proxying through this Next.js route we control the Cache-Control
 * header explicitly. The iframe gets fresh bytes every time.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const buf = await getReportPdf(id);
    if (!buf) {
      return new NextResponse('PDF not found', { status: 404 });
    }
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${id}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
        // Global next.config.ts sets X-Frame-Options: DENY which blocks the
        // admin page from embedding this PDF in its preview iframe — even on
        // the same origin. Override to SAMEORIGIN so the admin iframe can
        // render the PDF but the file still can't be embedded by third parties.
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy': "frame-ancestors 'self'",
      },
    });
  } catch (e) {
    console.error(`[PDF proxy] Failed for ${id}:`, e);
    return new NextResponse('Failed to load PDF', { status: 500 });
  }
}
