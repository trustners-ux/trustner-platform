import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// Public API — no auth required. Returns gallery images for the public gallery page.
//
// Captions, categories, and object-position values are stored in a single
// `gallery/metadata.json` blob keyed by pathname. We fetch it once per request
// and merge the values into each image object before returning.

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const METADATA_PATH = 'gallery/metadata.json';

interface GalleryMetadataEntry {
  caption?: string;
  category?: string;
  objectPosition?: string;
}

type GalleryMetadata = Record<string, GalleryMetadataEntry>;

function isImagePath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function fallbackCategory(pathname: string): string {
  const filename = pathname.split('/').pop()?.toLowerCase() || '';
  if (filename.startsWith('team-moment')) return 'team-moments';
  if (filename.startsWith('team')) return 'team';
  if (filename.startsWith('event')) return 'events';
  if (filename.startsWith('office')) return 'office-life';
  if (filename.startsWith('award')) return 'awards';
  if (filename.startsWith('milestone')) return 'milestones';
  return 'team';
}

function fallbackCaption(pathname: string): string {
  const filename = pathname.split('/').pop() || pathname;
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]\d+$/, '')
    .replace(/[-_]/g, ' ')
    .trim();
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: 'gallery/' });

    // Fetch metadata.json once and use it to enrich every image
    const metaBlob = blobs.find((b) => b.pathname === METADATA_PATH);
    let metadata: GalleryMetadata = {};
    if (metaBlob) {
      try {
        const res = await fetch(metaBlob.url, { cache: 'no-store' });
        if (res.ok) {
          metadata = (await res.json()) as GalleryMetadata;
        }
      } catch {
        // ignore — fall back to filename-derived caption / category
      }
    }

    // Filter to actual images, enrich with metadata
    const imageBlobs = blobs.filter(
      (b) => b.pathname !== METADATA_PATH && isImagePath(b.pathname),
    );

    const images = imageBlobs
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map((blob) => {
        const meta = metadata[blob.pathname] || {};
        return {
          src: blob.url,
          caption: meta.caption?.trim() || fallbackCaption(blob.pathname),
          category: meta.category || fallbackCategory(blob.pathname),
          objectPosition: meta.objectPosition || 'center',
        };
      });

    return NextResponse.json(
      { images },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    );
  } catch (error) {
    console.error('Public gallery error:', error);
    return NextResponse.json({ images: [] });
  }
}
