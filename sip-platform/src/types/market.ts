export interface MarketIndicator {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  icon: string;
  color: string;
}

export interface MarketCommentary {
  id: string;
  title: string;
  date: string;
  weekRange: string;
  summary: string;
  keyPoints: string[];
  outlook: 'Bullish' | 'Neutral' | 'Bearish' | 'Cautiously Optimistic';
  sipAdvice: string;
}

export interface MarketInsight {
  id: string;
  title: string;
  category: 'SIP Timing' | 'Market Education' | 'Industry News' | 'Strategy';
  content: string;
  date: string;
  icon: string;
  color: string;
}

export interface SIPTimingInsight {
  title: string;
  description: string;
  recommendation: string;
  icon: string;
}
