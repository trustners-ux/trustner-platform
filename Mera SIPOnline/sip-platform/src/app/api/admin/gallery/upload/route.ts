import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyToken, COOKIE_NAME } from '@/lib/auth/jwt';
import { canAccess } from '@/lib/auth/config';
import { cookies } from 'next/headers';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    // Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || !canAccess(payload.role, 'editor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    const imageData = {
      src: blob.url,
      caption,
      category,
      filename: blobPath,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: payload.email,
    };

    return NextResponse.json({ success: true, image: imageData });
  } catch (error) {
    console.error('Gallery upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
