import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Mutual Fund Screener - Filter & Compare | MeraSIP',
  description:
    'Screen and filter mutual funds by category, returns, AUM, expense ratio, risk level, and Sharpe ratio. Find the best mutual funds for your portfolio with our advanced screener tool.',
  path: '/funds/screener',
  keywords: [
    'mutual fund screener',
    'fund screener India',
    'filter mutual funds',
    'best mutual funds 2026',
    'mutual fund comparison tool',
    'screen funds by returns',
    'low expense ratio funds',
    'high return mutual funds',
  ],
});

export default function ScreenerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
