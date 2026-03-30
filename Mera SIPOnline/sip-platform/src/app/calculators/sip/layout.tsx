import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SIP Calculator | Calculate SIP Returns & Future Value',
  description:
    'Free online SIP calculator to estimate future value of your monthly SIP investments. Get year-by-year breakdown, interactive growth charts, and detailed return projections.',
  path: '/calculators/sip',
  keywords: [
    'SIP calculator',
    'SIP returns calculator',
    'mutual fund SIP calculator',
    'SIP future value calculator',
    'monthly SIP calculator',
    'SIP compounding calculator',
    'SIP investment returns',
    'calculate SIP online',
  ],
});

export default function SIPCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
