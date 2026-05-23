import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Mutual Fund Explorer | Compare & Analyze Top Funds',
  description:
    'Explore and compare top-performing mutual funds in India. Analyze fund returns, risk metrics, expense ratios, and portfolio composition to pick the best funds for SIP.',
  path: '/funds',
  keywords: [
    'mutual fund explorer',
    'compare mutual funds',
    'best mutual funds India',
    'mutual fund analysis',
    'top SIP mutual funds',
    'fund comparison tool',
    'mutual fund returns comparison',
    'best funds for SIP investment',
  ],
});

export default function FundsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
