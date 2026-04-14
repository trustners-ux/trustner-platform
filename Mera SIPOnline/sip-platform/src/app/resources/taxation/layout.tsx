import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Mutual Fund Taxation Guide 2025-26 | LTCG, STCG, TDS Rules | MeraSIP',
  description:
    'Complete guide to mutual fund taxation in India — equity, debt, hybrid, and international fund tax rules. LTCG, STCG, TDS, indexation, grandfathering, and tax-saving strategies explained by CFP Ram Shah.',
  path: '/resources/taxation',
  keywords: [
    'mutual fund taxation India',
    'LTCG tax mutual fund',
    'STCG tax rate',
    'mutual fund TDS',
    'equity fund tax',
    'debt fund tax 2025',
    'hybrid fund taxation',
    'mutual fund capital gains tax',
    'tax on mutual fund redemption',
    'mutual fund tax rules India',
  ],
});

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Resources', url: '/resources' },
  { name: 'Taxation Guide', url: '/resources/taxation' },
]);

export default function TaxationLayout({
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
