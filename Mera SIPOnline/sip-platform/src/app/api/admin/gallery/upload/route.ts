import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { canAccess, type AdminRole } from '@/lib/auth/config';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const METADATA_PATH = 'gallery/metadata.json';

/**
 * Auth guard — trusts the `x-admin-role` header set by middleware after it
 * validates either admin-session OR employee-session JWT. The previous
 * implementation only honoured the admin-session cookie, which rejected
 * editors logged in via the Employee Portal.
 */
function requireRole(req: NextRequest, minRole: AdminRole): NextResponse | null {
  const role = req.headers.get('x-admin-role') as AdminRole | null;
  if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(role, minRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

interface GalleryMetadataEntry {
  caption?: string;
  category?: string;
  objectPosition?: string;
}

async function readMetadata(): Promise<Record<string, GalleryMetadataEntry>> {
  try {
    const { blobs } = await list({ prefix: METADATA_PATH });
    const meta = blobs.find((b) => b.pathname === METADATA_PATH);
    if (!meta) return {};
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, GalleryMetadataEntry>;
  } catch {
    return {};
  }
}

async function writeMetadata(data: Record<string, GalleryMetadataEntry>): Promise<void> {
  await put(METADATA_PATH, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    allowOverwrite: true,
  });
}

export async function POST(request: NextRequest) {
  try {
    const guard = requireRole(request, 'editor');
    if (guard) return guard;
    const uploaderEmail = request.headers.get('x-admin-email') || 'unknown';

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caption = (formData.get('caption') as string) || '';
    const category = (formData.get('category') as string) || 'team';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum 10MB allowed' },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const blobPath = `gallery/${category}-${Date.now()}.${ext}`;

    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Persist caption + category to gallery/metadata.json so the public
    // /api/gallery endpoint can render the user-entered caption (instead of
    // deriving one from the filename).
    try {
      const metadata = await readMetadata();
      metadata[blobPath] = {
        caption: caption.trim(),
        category,
        objectPosition: 'center',
      };
      await writeMetadata(metadata);
    } catch (metaError) {
      console.error('Gallery metadata persist error:', metaError);
      // Non-fatal — image is uploaded; caption fallback to filename will apply.
    }

    const imageData = {
      src: blob.url,
      caption,
      category,
      filename: blobPath,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploaderEmail,
    };

    return NextResponse.json({ success: true, image: imageData });
  } catch (error) {
    console.error('Gallery upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
