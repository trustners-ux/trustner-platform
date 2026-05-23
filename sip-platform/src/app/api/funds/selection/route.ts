import { NextResponse } from 'next/server';
import { CURRENT_TRUSTNER_LIST, getTotalFundCount, getCategoryCount } from '@/data/funds/trustner';

export async function GET() {
  return NextResponse.json({
    month: CURRENT_TRUSTNER_LIST.month,
    year: CURRENT_TRUSTNER_LIST.year,
    dataAsOn: CURRENT_TRUSTNER_LIST.dataAsOn,
    lastUpdated: CURRENT_TRUSTNER_LIST.lastUpdated,
    totalFunds: getTotalFundCount(),
    totalCategories: getCategoryCount(),
    categories: CURRENT_TRUSTNER_LIST.categories.map((cat) => ({
      name: cat.name,
      displayName: cat.displayName,
      fundCount: cat.funds.length,
      hasSkinInTheGame: cat.hasSkinInTheGame,
      funds: cat.funds,
    })),
  });
}
