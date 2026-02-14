export interface MutualFund {
  schemeCode: number;
  schemeName: string;
  amcName: string;
  category: string;
  subCategory: string;
  nav: number;
  navDate: string;
  isinGrowth: string;
  isinReinvestment?: string;
  returns?: FundReturns;
  aum?: number;
  expenseRatio?: number;
  riskLevel?: string;
  fundManager?: string;
  benchmark?: string;
  launchDate?: string;
  minInvestment?: number;
  minSipAmount?: number;
  exitLoad?: string;
  planType?: "Direct" | "Regular";
}

export interface FundReturns {
  oneMonth?: number;
  threeMonth?: number;
  sixMonth?: number;
  oneYear?: number;
  twoYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
  sinceInception?: number;
}

export interface NAVDataPoint {
  date: string;
  nav: number;
}

export interface FundDetail extends MutualFund {
  navHistory: NAVDataPoint[];
  holdings?: FundHolding[];
  sectorAllocation?: SectorAllocation[];
  schemeDocuments?: SchemeDocuments;
}

export interface FundHolding {
  name: string;
  sector: string;
  percentage: number;
  instrument: string;
}

export interface SectorAllocation {
  sector: string;
  percentage: number;
}

export interface SchemeDocuments {
  sid?: string; // Scheme Information Document
  sai?: string; // Statement of Additional Information
  kim?: string; // Key Information Memorandum
  factsheet?: string;
}

export interface FundComparison {
  funds: MutualFund[];
  metrics: ComparisonMetric[];
}

export interface ComparisonMetric {
  label: string;
  values: (string | number)[];
  type: "text" | "number" | "percent" | "currency";
  highlight?: "higher" | "lower";
}
