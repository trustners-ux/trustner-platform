import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

const NAV_BLOB_KEY = 'funds/nav-data.json';

/**
 * GET /api/funds/nav-data
 * Public endpoint — serves the latest NAV data for all Trustner curated funds.
 * Cached for 5 minutes (CDN) + stale-while-revalidate for 1 hour.
 */
export async function GET() {
  try {
    const result = await list({ prefix: NAV_BLOB_KEY, limit: 1 });

    if (result.blobs.length > 0) {
      const res = await fetch(result.blobs[0].url);
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
          },
        });
      }
    }

    return NextResponse.json(
      { funds: [], updatedAt: null },
      { headers: { 'Cache-Control': 'public, s-maxage=60' } }
    );
  } catch (err) {
    console.error('[Public NAV]', err);
    return NextResponse.json(
      { funds: [], updatedAt: null },
      { status: 200, headers: { 'Cache-Control': 'public, s-maxage=30' } }
    );
  }
}
