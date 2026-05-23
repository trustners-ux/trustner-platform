import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Risk Disclosure | SEBI Compliant Risk Factors | Mera SIP Online',
  description:
    'Understand the risk factors associated with mutual fund investments. SEBI-compliant risk disclosure covering market risk, NAV fluctuation, taxation, and more.',
  path: '/risk-disclosure',
  keywords: [
    'mutual fund risk disclosure',
    'SEBI risk factors',
    'market risk mutual funds',
    'NAV fluctuation risk',
    'SIP risk factors',
    'mutual fund investment risks India',
  ],
});

export default function RiskDisclosureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
