import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SWP Calculator | Systematic Withdrawal Plan Calculator',
  description:
    'Calculate systematic withdrawal plan returns and see how long your mutual fund corpus will last. Plan monthly withdrawals while your remaining investment continues to grow.',
  path: '/calculators/swp',
  keywords: [
    'SWP calculator',
    'systematic withdrawal plan calculator',
    'SWP mutual fund calculator',
    'monthly withdrawal calculator',
    'SWP returns calculator',
    'mutual fund withdrawal plan',
    'SWP vs SIP',
    'retirement withdrawal calculator',
  ],
});

export default function SWPCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
