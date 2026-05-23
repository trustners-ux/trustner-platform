/* ─────────────────────────────────────────────────────────
   Live Fund Data Types
   Merged from MFapi.in + Captnemo/Kuvera APIs

   These types power the mutual fund comparison system,
   combining free NAV data from MFapi.in with enrichment
   data (ratings, expense ratio, AUM, peers) from Kuvera
   via the Captnemo proxy.
   ───────────────────────────────────────────────────────── */

// ─── Core Fund Detail (merged from both sources) ───

export interface LiveFundDetail {
  // From MFapi.in
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  schemeCategory: string;
  schemeType: string;
  isinGrowth: string | null;
  isinDivReinvestment: string | null;
  currentNav: number;
  navDate: string;
  // Calculated CAGR from MFapi NAV history
  calculatedReturns: {
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
  };
  // From Captnemo (nullable -- enrichment may fail)
  enriched: CaptnemoEnrichment | null;
  // Metadata
  slug: string;
  fetchedAt: string;
  cached: boolean;
}

// ─── Captnemo / Kuvera Enrichment Data ───

export interface CaptnemoEnrichment {
  shortName: string;
  returns: {
    oneWeek: number | null;
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
    sinceInception: number | null;
  };
  expenseRatio: number | null;
  expenseRatioDate: string | null;
  fundManager: string | null;
  startDate: string | null;
  crisilRating: string | null;
  fundRating: number | null;
  fundRatingDate: string | null;
  aum: number | null;
  volatility: number | null;
  lockInPeriod: number | null;
  investmentObjective: string | null;
  category: string | null;
  fundType: string | null;
  fundCategory: string | null;
  lumpMin: number | null;
  sipMin: number | null;
  sipAvailable: boolean;
  tags: string[];
  comparison: PeerFund[];
}

// ─── Peer Fund (used in comparison arrays) ───

export interface PeerFund {
  name: string;
  shortName: string;
  code: string;
  slug: string;
  oneYear: number | null;
  threeYear: number | null;
  fiveYear: number | null;
  sinceInception: number | null;
  volatility: number | null;
  expenseRatio: number | null;
  aum: number | null;
}

// ─── Search Result ───

export interface FundSearchResult {
  schemeCode: number;
  schemeName: string;
  fundHouse?: string;
  category?: string;
}

// ─── NAV History Point (for charts) ───

export interface NavHistoryPoint {
  date: string;   // YYYY-MM-DD
  nav: number;
}

// ─── Screener Filters (for fund screener UI) ───

export interface ScreenerFilters {
  category: string | null;
  minRating: number | null;
  aumMin: number | null;
  aumMax: number | null;
  expenseRatioMax: number | null;
  returnPeriod: '1Y' | '3Y' | '5Y';
  returnMin: number | null;
  sortBy: 'returns' | 'aum' | 'expenseRatio' | 'rating';
  sortOrder: 'asc' | 'desc';
}

// ─── Fund Summary (lighter version for lists/cards) ───

export interface LiveFundSummary {
  schemeCode: number;
  schemeName: string;
  fundHouse: string;
  category: string;
  currentNav: number;
  navDate: string;
  returns: {
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
  };
  aum: number | null;
  expenseRatio: number | null;
  rating: number | null;
  slug: string;
}
