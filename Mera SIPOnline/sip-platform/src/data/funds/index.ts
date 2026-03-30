import { SAMPLE_FUNDS } from './sample-funds';
import { FUND_CATEGORIES } from './categories';
import { MutualFund, FundCategory, FundCategoryInfo } from '@/types/funds';

export { SAMPLE_FUNDS } from './sample-funds';
export { FUND_CATEGORIES } from './categories';

export function getAllFunds(): MutualFund[] {
  return SAMPLE_FUNDS;
}

export function getFundById(id: string): MutualFund | undefined {
  return SAMPLE_FUNDS.find(f => f.id === id);
}

export function getFundsByCategory(category: FundCategory): MutualFund[] {
  return SAMPLE_FUNDS.filter(f => f.category === category);
}

export function getTopPerformers(period: 'oneYear' | 'threeYear' | 'fiveYear', limit = 10): MutualFund[] {
  return [...SAMPLE_FUNDS].sort((a, b) => b.returns[period] - a.returns[period]).slice(0, limit);
}

export function getCategoryInfo(category: FundCategory): FundCategoryInfo | undefined {
  return FUND_CATEGORIES.find(c => c.name === category);
}

export function getUniqueCategories(): FundCategory[] {
  return [...new Set(SAMPLE_FUNDS.map(f => f.category))];
}

export function calculateHoldingsOverlap(fund1: MutualFund, fund2: MutualFund): number {
  const common = fund1.holdings.filter(h => fund2.holdings.includes(h));
  return Math.round((common.length / Math.max(fund1.holdings.length, fund2.holdings.length)) * 100);
}
