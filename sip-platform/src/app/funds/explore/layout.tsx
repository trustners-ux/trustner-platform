import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Explore Mutual Funds - Compare 37,000+ Schemes | MeraSIP',
  description:
    'Explore and compare over 37,000 mutual fund schemes across 40+ AMCs. Search by name, filter by category, compare NAVs, returns, expense ratios, and AUM with real-time data from MFapi.in.',
  path: '/funds/explore',
  keywords: [
    'explore mutual funds',
    'mutual fund search',
    'compare mutual fund schemes',
    'mutual fund NAV',
    'real-time NAV data',
    'mutual fund categories India',
    'live mutual fund data',
    'fund explorer',
    '37000 mutual fund schemes',
  ],
});

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
