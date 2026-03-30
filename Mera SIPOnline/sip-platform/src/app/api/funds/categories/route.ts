import { NextResponse } from 'next/server';
import { FUND_CATEGORIES } from '@/data/funds/categories';

/* ─────────────────────────────────────────────────────────
   Fund Categories API

   GET /api/funds/categories

   Returns the 20 fund categories with metadata including
   name, description, risk level, ideal investor profile,
   typical returns range, and UI color class.

   Pure static data — no external API calls.
   Cached for 24 hours via Cache-Control header.
   ───────────────────────────────────────────────────────── */

export async function GET() {
  try {
    const categories = FUND_CATEGORIES.map((cat) => ({
      name: cat.name,
      description: cat.description,
      riskLevel: cat.riskLevel,
      idealFor: cat.idealFor,
      typicalReturns: cat.typicalReturns,
      color: cat.color,
    }));

    return NextResponse.json(
      {
        categories,
        total: categories.length,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400',
        },
      }
    );
  } catch (error) {
    console.error('[API] Fund categories error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch fund categories.',
      },
      { status: 500 }
    );
  }
}
