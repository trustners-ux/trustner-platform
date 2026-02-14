export interface FundCategory {
  id: string;
  name: string;
  group: "equity" | "debt" | "hybrid" | "solution" | "other";
  description: string;
  riskLevel: "Low" | "Moderately Low" | "Moderate" | "Moderately High" | "High" | "Very High";
}

export const FUND_CATEGORY_GROUPS = [
  { id: "equity", name: "Equity", icon: "TrendingUp", color: "#0052CC" },
  { id: "debt", name: "Debt", icon: "Shield", color: "#00875A" },
  { id: "hybrid", name: "Hybrid", icon: "PieChart", color: "#FF6B35" },
  { id: "solution", name: "Solution Oriented", icon: "Target", color: "#6554C0" },
  { id: "other", name: "Other", icon: "Grid", color: "#00B8D9" },
] as const;

export const FUND_CATEGORIES: FundCategory[] = [
  // Equity Funds
  { id: "large-cap", name: "Large Cap", group: "equity", description: "Top 100 companies by market cap", riskLevel: "Very High" },
  { id: "mid-cap", name: "Mid Cap", group: "equity", description: "101st-250th companies by market cap", riskLevel: "Very High" },
  { id: "small-cap", name: "Small Cap", group: "equity", description: "251st company onwards by market cap", riskLevel: "Very High" },
  { id: "multi-cap", name: "Multi Cap", group: "equity", description: "Minimum 25% each in large, mid, small cap", riskLevel: "Very High" },
  { id: "flexi-cap", name: "Flexi Cap", group: "equity", description: "Flexible allocation across market caps", riskLevel: "Very High" },
  { id: "large-mid-cap", name: "Large & Mid Cap", group: "equity", description: "Minimum 35% each in large and mid cap", riskLevel: "Very High" },
  { id: "focused", name: "Focused", group: "equity", description: "Maximum 30 stocks portfolio", riskLevel: "Very High" },
  { id: "elss", name: "ELSS (Tax Saver)", group: "equity", description: "3-year lock-in, tax deduction u/s 80C", riskLevel: "Very High" },
  { id: "sectoral-thematic", name: "Sectoral / Thematic", group: "equity", description: "Specific sector or theme based investing", riskLevel: "Very High" },
  { id: "value", name: "Value", group: "equity", description: "Value investing strategy", riskLevel: "Very High" },
  { id: "contra", name: "Contra", group: "equity", description: "Contrarian investment strategy", riskLevel: "Very High" },
  { id: "dividend-yield", name: "Dividend Yield", group: "equity", description: "High dividend yielding stocks", riskLevel: "Very High" },

  // Debt Funds
  { id: "overnight", name: "Overnight", group: "debt", description: "Securities maturing in 1 day", riskLevel: "Low" },
  { id: "liquid", name: "Liquid", group: "debt", description: "Securities maturing up to 91 days", riskLevel: "Low" },
  { id: "ultra-short", name: "Ultra Short Duration", group: "debt", description: "Macaulay duration 3-6 months", riskLevel: "Low" },
  { id: "low-duration", name: "Low Duration", group: "debt", description: "Macaulay duration 6-12 months", riskLevel: "Moderately Low" },
  { id: "money-market", name: "Money Market", group: "debt", description: "Money market instruments up to 1 year", riskLevel: "Low" },
  { id: "short-duration", name: "Short Duration", group: "debt", description: "Macaulay duration 1-3 years", riskLevel: "Moderately Low" },
  { id: "medium-duration", name: "Medium Duration", group: "debt", description: "Macaulay duration 3-4 years", riskLevel: "Moderate" },
  { id: "medium-long-duration", name: "Medium to Long Duration", group: "debt", description: "Macaulay duration 4-7 years", riskLevel: "Moderate" },
  { id: "long-duration", name: "Long Duration", group: "debt", description: "Macaulay duration > 7 years", riskLevel: "Moderate" },
  { id: "dynamic-bond", name: "Dynamic Bond", group: "debt", description: "Dynamic duration management", riskLevel: "Moderate" },
  { id: "corporate-bond", name: "Corporate Bond", group: "debt", description: "80%+ in AA+ and above corporate bonds", riskLevel: "Moderate" },
  { id: "credit-risk", name: "Credit Risk", group: "debt", description: "65%+ in below AA rated bonds", riskLevel: "Moderately High" },
  { id: "banking-psu", name: "Banking & PSU", group: "debt", description: "80%+ in banking & PSU debt", riskLevel: "Moderately Low" },
  { id: "gilt", name: "Gilt", group: "debt", description: "80%+ in government securities", riskLevel: "Moderate" },
  { id: "gilt-10y", name: "Gilt with 10yr Constant", group: "debt", description: "10 year constant maturity gilts", riskLevel: "Moderate" },
  { id: "floater", name: "Floater", group: "debt", description: "65%+ in floating rate instruments", riskLevel: "Moderately Low" },

  // Hybrid Funds
  { id: "conservative-hybrid", name: "Conservative Hybrid", group: "hybrid", description: "10-25% equity, 75-90% debt", riskLevel: "Moderately Low" },
  { id: "balanced-hybrid", name: "Balanced Hybrid", group: "hybrid", description: "40-60% equity, 40-60% debt (no arbitrage)", riskLevel: "High" },
  { id: "aggressive-hybrid", name: "Aggressive Hybrid", group: "hybrid", description: "65-80% equity, 20-35% debt", riskLevel: "Very High" },
  { id: "dynamic-asset", name: "Dynamic Asset Allocation (BAF)", group: "hybrid", description: "Dynamic equity/debt allocation 0-100%", riskLevel: "High" },
  { id: "multi-asset", name: "Multi Asset Allocation", group: "hybrid", description: "Minimum 10% each in 3+ asset classes", riskLevel: "High" },
  { id: "arbitrage", name: "Arbitrage", group: "hybrid", description: "65%+ in equity arbitrage strategies", riskLevel: "Moderately Low" },
  { id: "equity-savings", name: "Equity Savings", group: "hybrid", description: "Equity, debt & arbitrage combination", riskLevel: "Moderate" },

  // Solution Oriented
  { id: "retirement", name: "Retirement Fund", group: "solution", description: "Retirement planning with 5-year lock-in", riskLevel: "High" },
  { id: "childrens", name: "Children's Fund", group: "solution", description: "Children's education/marriage with 5-year lock-in", riskLevel: "High" },

  // Other
  { id: "index", name: "Index Funds", group: "other", description: "Passively managed, tracks an index", riskLevel: "High" },
  { id: "etf", name: "ETFs", group: "other", description: "Exchange traded funds (requires demat)", riskLevel: "High" },
  { id: "fof", name: "Fund of Funds", group: "other", description: "Invests in other mutual fund schemes", riskLevel: "High" },
  { id: "international", name: "International / Global", group: "other", description: "Invests in overseas markets", riskLevel: "Very High" },
];

export const RISK_LEVELS = [
  "Low",
  "Moderately Low",
  "Moderate",
  "Moderately High",
  "High",
  "Very High",
] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
