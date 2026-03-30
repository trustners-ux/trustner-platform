import { NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { canAccess } from '@/lib/auth/config';
import { cookies } from 'next/headers';

// GET — list all gallery images from Vercel Blob
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || !canAccess(payload.role, 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // List blobs with gallery/ prefix
    const { blobs } = await list({ prefix: 'gallery/' });

    const images = blobs.map((blob) => {
      const filename = blob.pathname.split('/').pop() || blob.pathname;
      // Extract category from filename pattern: category-timestamp.ext
      const category = guessCategory(filename);

      return {
        filename: blob.pathname,
        src: blob.url,
        caption: filename.replace(/\.[^.]+$/, '').replace(/[-_]\d+$/, '').replace(/[-_]/g, ' '),
        category,
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
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || !canAccess(payload.role, 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
  if (lower.startsWith('team')) return 'team';
  if (lower.startsWith('event')) return 'events';
  if (lower.startsWith('office')) return 'office';
  if (lower.startsWith('milestone')) return 'milestones';
  return 'team';
}
