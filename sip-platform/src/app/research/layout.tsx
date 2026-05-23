import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SIP Research & Data Studies | MeraSIP.com',
  description:
    'Data-driven SIP research and analysis — historical returns, rolling return studies, volatility simulations, bull vs bear market performance, and XIRR case studies backed by 20+ years of Indian market data.',
  path: '/research',
  keywords: [
    'SIP research',
    'SIP data analysis',
    'historical SIP returns India',
    'rolling returns study',
    'SIP volatility analysis',
    'mutual fund research India',
    'SIP performance data',
  ],
});

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Research', url: '/research' },
]);

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
