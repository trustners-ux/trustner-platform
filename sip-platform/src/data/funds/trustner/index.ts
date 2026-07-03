import { MARCH_2026_FUND_LIST } from './march-2026';
import { MAY_2026_FUND_LIST } from './may-2026';
import { TrustnerFundList, TrustnerCuratedFund, FundCategory } from '@/types/funds';

// Current active fund list — update this when publishing a new month
export const CURRENT_TRUSTNER_LIST: TrustnerFundList = MAY_2026_FUND_LIST;

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

// ─── Track Record — real month-over-month diff between two published lists ───
// Used for public transparency (what changed on the shortlist, and when) —
// computed from the actual snapshot data, never hand-authored.
export interface CategoryFundDiff {
  category: FundCategory;
  categoryDisplayName: string;
  added: string[];
  removed: string[];
}

export interface FundListDiff {
  fromMonth: string;
  toMonth: string;
  categoryDiffs: CategoryFundDiff[];
  categoriesDropped: { name: FundCategory; displayName: string; funds: string[] }[];
  categoriesAdded: { name: FundCategory; displayName: string; funds: string[] }[];
}

export function diffFundLists(from: TrustnerFundList, to: TrustnerFundList): FundListDiff {
  const fromCats = new Map(from.categories.map((c) => [c.name, c]));
  const toCats = new Map(to.categories.map((c) => [c.name, c]));

  const categoryDiffs: CategoryFundDiff[] = [];
  for (const [name, toCat] of toCats) {
    const fromCat = fromCats.get(name);
    if (!fromCat) continue; // handled as a categoriesAdded entry below
    const fromNames = new Set(fromCat.funds.map((f) => f.name));
    const toNames = new Set(toCat.funds.map((f) => f.name));
    const added = toCat.funds.filter((f) => !fromNames.has(f.name)).map((f) => f.name);
    const removed = fromCat.funds.filter((f) => !toNames.has(f.name)).map((f) => f.name);
    if (added.length || removed.length) {
      categoryDiffs.push({ category: name, categoryDisplayName: toCat.displayName, added, removed });
    }
  }

  const categoriesDropped = [...fromCats.entries()]
    .filter(([name]) => !toCats.has(name))
    .map(([name, cat]) => ({ name, displayName: cat.displayName, funds: cat.funds.map((f) => f.name) }));

  const categoriesAdded = [...toCats.entries()]
    .filter(([name]) => !fromCats.has(name))
    .map(([name, cat]) => ({ name, displayName: cat.displayName, funds: cat.funds.map((f) => f.name) }));

  return { fromMonth: `${from.month} ${from.year}`, toMonth: `${to.month} ${to.year}`, categoryDiffs, categoriesDropped, categoriesAdded };
}

export function getTrackRecord(): FundListDiff {
  return diffFundLists(MARCH_2026_FUND_LIST, MAY_2026_FUND_LIST);
}
