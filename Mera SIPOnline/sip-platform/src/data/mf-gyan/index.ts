import type { GyanCategory, GyanTopic } from '@/types/mf-gyan';

// Category imports — lazy loaded via dynamic imports would be ideal for 100+ topics
// but static imports keep it simple and allow tree-shaking
import { EQUITY_MARKET } from './categories/equity-market';
import { DEBT_MARKET } from './categories/debt-market';
import { DERIVATIVES } from './categories/derivatives';
import { FINANCIAL_ANALYSIS } from './categories/financial-analysis';
import { FINANCIAL_RATIO } from './categories/financial-ratio';
import { INTERNATIONAL_FINANCE } from './categories/international-finance';
import { MACRO_ECONOMICS } from './categories/macro-economics';

export const ALL_GYAN_CATEGORIES: GyanCategory[] = [
  EQUITY_MARKET,
  DEBT_MARKET,
  DERIVATIVES,
  FINANCIAL_ANALYSIS,
  FINANCIAL_RATIO,
  INTERNATIONAL_FINANCE,
  MACRO_ECONOMICS,
];

export function getCategoryBySlug(slug: string): GyanCategory | undefined {
  return ALL_GYAN_CATEGORIES.find((c) => c.id === slug);
}

export function getTopicBySlug(
  categorySlug: string,
  topicSlug: string
): { category: GyanCategory; topic: GyanTopic } | undefined {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return undefined;
  const topic = category.topics.find((t) => t.id === topicSlug);
  if (!topic) return undefined;
  return { category, topic };
}

export function getGyanStats() {
  const categories = ALL_GYAN_CATEGORIES.length;
  const topics = ALL_GYAN_CATEGORIES.reduce((sum, c) => sum + c.topics.length, 0);
  return { categories, topics };
}

export function getTopicNavigation(
  categorySlug: string,
  topicSlug: string
): { prev: GyanTopic | null; next: GyanTopic | null } {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return { prev: null, next: null };
  const idx = category.topics.findIndex((t) => t.id === topicSlug);
  return {
    prev: idx > 0 ? category.topics[idx - 1] : null,
    next: idx < category.topics.length - 1 ? category.topics[idx + 1] : null,
  };
}
