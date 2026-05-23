import { NextResponse } from 'next/server';
import { CURRENT_TRUSTNER_LIST } from '@/data/funds/trustner';
import { TrustnerCuratedFund, FundCategory } from '@/types/funds';

/* ─────────────────────────────────────────────────────────
   Top Performers API

   GET /api/funds/top-performers
   GET /api/funds/top-performers?category=Large+Cap

   Returns top-ranked funds from the Trustner curated list.
   Optionally filter by a specific category.

   For each category, returns up to 5 funds sorted by rank.
   Cached for 12 hours via Cache-Control header.
   ───────────────────────────────────────────────────────── */

interface TrustnerFundSummary {
  id: string;
  name: string;
  category: FundCategory;
  returns: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
  };
  aumCr: number;
  ter: number;
  sharpeRatio: number;
  rank: number;
  schemeCode?: number;
}

const MAX_FUNDS_PER_CATEGORY = 5;

function mapToSummary(fund: TrustnerCuratedFund): TrustnerFundSummary {
  return {
    id: fund.id,
    name: fund.name,
    category: fund.category,
    returns: {
      oneYear: fund.returns.oneYear,
      threeYear: fund.returns.threeYear,
      fiveYear: fund.returns.fiveYear,
    },
    aumCr: fund.aumCr,
    ter: fund.ter,
    sharpeRatio: fund.sharpeRatio,
    rank: fund.rank,
    ...(fund.schemeCode ? { schemeCode: fund.schemeCode } : {}),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get('category');

    const validCategoryNames = CURRENT_TRUSTNER_LIST.categories.map((c) => c.name);

    // If a category filter is specified, validate it
    if (categoryParam) {
      const matchedCategory = validCategoryNames.find(
        (name) => name.toLowerCase() === categoryParam.toLowerCase()
      );

      if (!matchedCategory) {
        return NextResponse.json(
          {
            error: `Invalid category: "${categoryParam}". Valid categories: ${validCategoryNames.join(', ')}`,
          },
          { status: 400 }
        );
      }

      // Return funds for a single category
      const cat = CURRENT_TRUSTNER_LIST.categories.find(
        (c) => c.name === matchedCategory
      );

      if (!cat) {
        return NextResponse.json(
          { error: `No funds found for category: ${matchedCategory}` },
          { status: 404 }
        );
      }

      const sortedFunds = [...cat.funds]
        .sort((a, b) => a.rank - b.rank)
        .slice(0, MAX_FUNDS_PER_CATEGORY);

      return NextResponse.json(
        [
          {
            category: cat.name,
            funds: sortedFunds.map(mapToSummary),
          },
        ],
        {
          headers: {
            'Cache-Control': 'public, max-age=43200',
          },
        }
      );
    }

    // No category filter — return top performers from all categories
    const result = CURRENT_TRUSTNER_LIST.categories.map((cat) => {
      const sortedFunds = [...cat.funds]
        .sort((a, b) => a.rank - b.rank)
        .slice(0, MAX_FUNDS_PER_CATEGORY);

      return {
        category: cat.name,
        funds: sortedFunds.map(mapToSummary),
      };
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=43200',
      },
    });
  } catch (error) {
    console.error('[API] Top performers error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch top performers.',
      },
      { status: 500 }
    );
  }
}
