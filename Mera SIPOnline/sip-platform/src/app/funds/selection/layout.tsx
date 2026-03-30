import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Trustner Fund Selection — Monthly Curated Top Funds List',
  description:
    'Trustner\'s research-backed monthly curated list of top-performing mutual funds across 15 categories. Ranked by TER, Sharpe ratio, standard deviation, returns, and skin in the game.',
  path: '/funds/selection',
  keywords: [
    'trustner fund selection',
    'best mutual funds March 2026',
    'curated mutual fund list',
    'top mutual funds India',
    'mutual fund ranking',
    'best SIP funds',
    'mutual fund Sharpe ratio',
    'skin in the game mutual funds',
    'Trustner top funds list',
    'monthly fund recommendation',
  ],
});

export default function FundSelectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
