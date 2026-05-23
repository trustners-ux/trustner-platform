import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';
import { canAccess, type AdminRole } from '@/lib/auth/config';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const METADATA_PATH = 'gallery/metadata.json';

interface GalleryMetadataEntry {
  caption?: string;
  category?: string;
  objectPosition?: string;
}

function isImagePath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Auth guard — trusts the `x-admin-role` header set by middleware after it
 * validates either the admin-session JWT or the employee-session JWT.
 *
 * The previous implementation only checked the admin-session cookie, which
 * meant editors logged in via the Employee Portal (issuing EMPLOYEE_COOKIE)
 * were rejected with 401 even though middleware had already authenticated
 * them.
 */
function requireRole(req: NextRequest, minRole: AdminRole): NextResponse | null {
  const role = req.headers.get('x-admin-role') as AdminRole | null;
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!canAccess(role, minRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// GET — list all gallery images from Vercel Blob (admin view)
export async function GET(request: NextRequest) {
  try {
    const guard = requireRole(request, 'editor');
    if (guard) return guard;

    // List blobs with gallery/ prefix
    const { blobs } = await list({ prefix: 'gallery/' });

    // Fetch metadata.json for caption/category enrichment
    const metaBlob = blobs.find((b) => b.pathname === METADATA_PATH);
    let metadata: Record<string, GalleryMetadataEntry> = {};
    if (metaBlob) {
      try {
        const res = await fetch(metaBlob.url, { cache: 'no-store' });
        if (res.ok) {
          metadata = (await res.json()) as Record<string, GalleryMetadataEntry>;
        }
      } catch {
        // ignore — fall back to filename-derived caption
      }
    }

    const imageBlobs = blobs.filter(
      (b) => b.pathname !== METADATA_PATH && isImagePath(b.pathname),
    );

    const images = imageBlobs.map((blob) => {
      const filename = blob.pathname.split('/').pop() || blob.pathname;
      const meta = metadata[blob.pathname] || {};
      return {
        filename: blob.pathname,
        src: blob.url,
        caption:
          meta.caption?.trim() ||
          filename.replace(/\.[^.]+$/, '').replace(/[-_]\d+$/, '').replace(/[-_]/g, ' '),
        category: meta.category || guessCategory(filename),
        objectPosition: meta.objectPosition || 'center',
        size: blob.size,
        uploadedAt: blob.uploadedAt.toISOString(),
      };
    });

    // Sort newest first
    images.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Gallery list error:', error);
    return NextResponse.json({ error: 'Failed to list images' }, { status: 500 });
  }
}

// DELETE — remove a specific image from Vercel Blob
export async function DELETE(request: NextRequest) {
  try {
    const guard = requireRole(request, 'editor');
    if (guard) return guard;

    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'Blob URL required' }, { status: 400 });
    }

    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gallery delete error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}

function guessCategory(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.startsWith('team-moment')) return 'team-moments';
  if (lower.startsWith('team')) return 'team';
  if (lower.startsWith('event')) return 'events';
  if (lower.startsWith('office')) return 'office-life';
  if (lower.startsWith('award')) return 'awards';
  if (lower.startsWith('milestone')) return 'milestones';
  return 'team';
}
