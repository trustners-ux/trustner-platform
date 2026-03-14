import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Market Pulse | Weekly Market Commentary & SIP Insights',
  description:
    'Stay updated with weekly market commentary, Nifty and Sensex analysis, and SIP-focused market insights. Understand how market trends affect your SIP investments.',
  path: '/market-pulse',
  keywords: [
    'market pulse',
    'weekly market commentary',
    'market analysis India',
    'Nifty Sensex analysis',
    'SIP market insights',
    'stock market weekly update',
    'mutual fund market trends',
    'Indian market commentary',
  ],
});

export default function MarketPulseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
