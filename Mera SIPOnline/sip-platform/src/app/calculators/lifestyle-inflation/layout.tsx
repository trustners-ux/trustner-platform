import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Lifestyle Inflation Calculator | How Lifestyle Creep Erodes Your Savings',
  description: 'See how lifestyle inflation silently erodes your savings rate over time. Model income growth vs expense growth and find the year your savings hit zero.',
  path: '/calculators/lifestyle-inflation',
  keywords: ['lifestyle inflation calculator', 'lifestyle creep', 'expense growth calculator', 'savings rate erosion', 'income vs expenses', 'lifestyle inflation India', 'spending growth calculator'],
});

export default function LifestyleInflationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
