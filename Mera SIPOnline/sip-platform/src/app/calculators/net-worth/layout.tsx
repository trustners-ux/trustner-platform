import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Net Worth Calculator | Track Your Assets, Liabilities & Wealth Score',
  description: 'Calculate your net worth by adding assets and liabilities. Get liquid net worth, debt-to-asset ratio, and wealth score with interactive charts.',
  path: '/calculators/net-worth',
  keywords: ['net worth calculator', 'net worth tracker', 'wealth calculator India', 'assets vs liabilities', 'financial health score', 'debt to asset ratio', 'liquid net worth calculator'],
});

export default function NetWorthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
