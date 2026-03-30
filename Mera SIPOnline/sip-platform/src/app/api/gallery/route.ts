import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

// Public API — no auth required. Returns gallery images for the public gallery page.
export async function GET() {
  try {
    const { blobs } = await list({ prefix: 'gallery/' });

    const images = blobs.map((blob) => {
      const filename = blob.pathname.split('/').pop() || blob.pathname;
      const category = guessCategory(filename);

      return {
        src: blob.url,
        caption: filename.replace(/\.[^.]+$/, '').replace(/[-_]\d+$/, '').replace(/[-_]/g, ' '),
        category,
      };
    });

    // Sort newest first
    images.sort((a, b) => {
      const aBlob = blobs.find((bl) => bl.url === a.src);
      const bBlob = blobs.find((bl) => bl.url === b.src);
      return (bBlob?.uploadedAt.getTime() || 0) - (aBlob?.uploadedAt.getTime() || 0);
    });

    return NextResponse.json({ images }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Public gallery error:', error);
    // Return empty if blob store not configured
    return NextResponse.json({ images: [] });
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
