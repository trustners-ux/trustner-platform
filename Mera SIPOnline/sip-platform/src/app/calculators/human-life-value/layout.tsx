import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Human Life Value Calculator | How Much Life Insurance Do You Need?',
  description: 'Calculate your Human Life Value (HLV) based on income, expenses, liabilities, and future goals. Find out exactly how much life insurance coverage you need to protect your family.',
  path: '/calculators/human-life-value',
  keywords: ['HLV calculator', 'life insurance need', 'human life value', 'insurance coverage calculator', 'life insurance calculator', 'income replacement method', 'term insurance calculator'],
});

export default function HumanLifeValueCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
