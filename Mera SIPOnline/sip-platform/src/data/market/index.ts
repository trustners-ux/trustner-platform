import { marketIndicators } from './indicators';
import { marketCommentaries } from './commentaries';
import { marketInsights } from './insights';
import { sipTimingInsights } from './sip-timing';
import { MarketCommentary, MarketInsight } from '@/types/market';

export { marketIndicators } from './indicators';
export { marketCommentaries } from './commentaries';
export { marketInsights } from './insights';
export { sipTimingInsights } from './sip-timing';

/**
 * Returns the most recent weekly market commentary.
 */
export function getLatestCommentary(): MarketCommentary {
  return marketCommentaries[0];
}

/**
 * Returns all previous commentaries (excluding the latest).
 */
export function getPreviousCommentaries(): MarketCommentary[] {
  return marketCommentaries.slice(1);
}

/**
 * Returns all market insights sorted by date (newest first).
 */
export function getAllInsights(): MarketInsight[] {
  return [...marketInsights].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Returns insights filtered by category.
 */
export function getInsightsByCategory(
  category: MarketInsight['category']
): MarketInsight[] {
  return marketInsights.filter((i) => i.category === category);
}

/**
 * Returns all market indicators.
 */
export function getAllIndicators() {
  return marketIndicators;
}

/**
 * Returns the total count of all market content items.
 */
export function getMarketContentStats() {
  return {
    indicators: marketIndicators.length,
    commentaries: marketCommentaries.length,
    insights: marketInsights.length,
    sipTimingInsights: sipTimingInsights.length,
  };
}
