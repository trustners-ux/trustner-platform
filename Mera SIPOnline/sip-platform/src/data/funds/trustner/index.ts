import { MARCH_2026_FUND_LIST } from './march-2026';
import { TrustnerFundList, TrustnerCuratedFund, FundCategory } from '@/types/funds';

// Current active fund list — update this when publishing a new month
export const CURRENT_TRUSTNER_LIST: TrustnerFundList = MARCH_2026_FUND_LIST;

// Utility functions
export function getTotalFundCount(list: TrustnerFundList = CURRENT_TRUSTNER_LIST): number {
  return list.categories.reduce((sum, cat) => sum + cat.funds.length, 0);
}

export function getCategoryCount(list: TrustnerFundList = CURRENT_TRUSTNER_LIST): number {
  return list.categories.length;
}

export function getFundsByRank(
  category: FundCategory,
  list: TrustnerFundList = CURRENT_TRUSTNER_LIST
): TrustnerCuratedFund[] {
  const cat = list.categories.find((c) => c.name === category);
  if (!cat) return [];
  return [...cat.funds].sort((a, b) => a.rank - b.rank);
}

export function getTopRankedFunds(
  limit: number = 15,
  list: TrustnerFundList = CURRENT_TRUSTNER_LIST
): TrustnerCuratedFund[] {
  return list.categories
    .flatMap((cat) => cat.funds.filter((f) => f.rank === 1))
    .slice(0, limit);
}
