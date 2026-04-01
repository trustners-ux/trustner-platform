import { NextRequest, NextResponse } from 'next/server';
import { getAllFunds, getFundsByCategory } from '@/data/funds';
import { FundCategory } from '@/types/funds';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const funds = category
      ? getFundsByCategory(category as FundCategory)
      : getAllFunds();

    return NextResponse.json(
      {
        funds,
        total: funds.length,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Failed to fetch funds' }, { status: 500 });
  }
}
