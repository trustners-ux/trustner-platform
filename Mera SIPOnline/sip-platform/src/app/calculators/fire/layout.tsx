import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'FIRE Calculator | Financial Independence Retire Early India',
  description: 'Calculate your FIRE number, years to financial independence, and safe withdrawal rate. Plan your early retirement with detailed projections and charts.',
  path: '/calculators/fire',
  keywords: ['FIRE calculator', 'financial independence calculator', 'retire early India', 'FIRE number', 'early retirement calculator', '4 percent rule', 'financial independence retire early'],
});

export default function FIRELayout({ children }: { children: React.ReactNode }) {
  return children;
}
