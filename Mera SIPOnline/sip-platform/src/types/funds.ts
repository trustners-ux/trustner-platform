export interface MutualFund {
  id: string;
  name: string;
  shortName: string;
  category: FundCategory;
  subCategory: string;
  amcName: string;
  nav: number;
  navDate: string;
  aum: number;
  expenseRatio: number;
  riskLevel: 'Low' | 'Moderate' | 'Moderately High' | 'High' | 'Very High';
  returns: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    tenYear?: number;
    sinceInception: number;
  };
  exitLoad: string;
  minSIP: number;
  minLumpsum: number;
  rating: 1 | 2 | 3 | 4 | 5;
  benchmark: string;
  holdings: string[];
}

export type FundCategory =
  | 'Large Cap' | 'Mid Cap' | 'Small Cap' | 'Flexi Cap' | 'Multi Cap'
  | 'ELSS' | 'Large & Mid Cap' | 'Focused' | 'Value' | 'Index'
  | 'Sectoral' | 'International'
  | 'Contra' | 'Multi Asset' | 'Balanced Advantage' | 'Aggressive Hybrid'
  | 'Equity Savings' | 'Conservative Hybrid' | 'Gold & Silver' | 'Fund of Fund';

export interface FundCategoryInfo {
  name: FundCategory;
  description: string;
  riskLevel: string;
  idealFor: string;
  typicalReturns: string;
  color: string;
}

// ─── Trustner Curated Fund Selection Types ───

export interface TrustnerCuratedFund {
  id: string;
  name: string;
  category: FundCategory;
  fundManager: string;
  ageOfFund: number;
  aumCr: number;
  ter: number;
  standardDeviation: number;
  sharpeRatio: number;
  returns: {
    mtd: number;
    ytd: number;
    oneYear: number;
    twoYear: number;
    threeYear: number;
    fiveYear: number;
    // Extended return periods (populated by NAV auto-fetch)
    oneMonth?: number;
    threeMonth?: number;
    sixMonth?: number;
    tenYear?: number;
  };
  numberOfHoldings: number;
  skinInTheGame?: {
    amountCr: number;
    percentOfAum: number;
  };
  rank: number;
  schemeCode?: number;
  // NAV data metadata
  latestNav?: number;
  latestNavDate?: string;
  navUpdatedAt?: string;
}

// NAV update result stored in Vercel Blob
export interface FundNavData {
  schemeCode: number;
  fundName: string;
  latestNav: number;
  latestNavDate: string;
  returns: {
    oneMonth: number | null;
    threeMonth: number | null;
    sixMonth: number | null;
    ytd: number | null;
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
    tenYear: number | null;
  };
  updatedAt: string;
}

export interface NavUpdateResult {
  updatedAt: string;
  totalFunds: number;
  successCount: number;
  failedCount: number;
  funds: FundNavData[];
  errors: { schemeCode: number; fundName: string; error: string }[];
}

export interface TrustnerFundCategory {
  name: FundCategory;
  displayName: string;
  funds: TrustnerCuratedFund[];
  hasSkinInTheGame: boolean;
}

export interface TrustnerFundList {
  month: string;
  year: number;
  dataAsOn: string;
  lastUpdated: string;
  categories: TrustnerFundCategory[];
}
