import { NextResponse } from 'next/server';
import { searchFunds } from '@/lib/services/fund-data';

/* ─────────────────────────────────────────────────────────
   Fund Search API

   GET /api/funds/search?q=HDFC+Large+Cap

   Searches the MFAPI database for mutual fund schemes
   matching the query string. Returns max 20 results.
   ───────────────────────────────────────────────────────── */

const MAX_RESULTS = 20;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Missing required query parameter: q',
          example: '/api/funds/search?q=HDFC+Large+Cap',
        },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    // Enforce minimum query length
    if (trimmedQuery.length < 2) {
      return NextResponse.json(
        {
          error: 'Query must be at least 2 characters long',
        },
        { status: 400 }
      );
    }

    // Search funds via service layer
    const allResults = await searchFunds(trimmedQuery);

    // Cap results at MAX_RESULTS
    const results = allResults.slice(0, MAX_RESULTS);

    return NextResponse.json({
      results,
      total: results.length,
      query: trimmedQuery,
    });
  } catch (error) {
    console.error('[API] Fund search error:', error);

    return NextResponse.json(
      {
        error: 'Failed to search funds. Please try again.',
      },
      { status: 500 }
    );
  }
}
