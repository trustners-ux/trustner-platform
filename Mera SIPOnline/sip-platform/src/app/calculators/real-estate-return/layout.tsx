import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Real Estate Actual Return Calculator | Real IRR vs Naive Price CAGR',
  description: 'Calculate the honest IRR on your property — factoring stamp duty, registration, home loan interest, maintenance, property tax, brokerage, and capital gains tax. Usually 4-6%, not the 10% you think.',
  path: '/calculators/real-estate-return',
  keywords: [
    'real estate return calculator India',
    'property IRR calculator',
    'real estate actual return',
    'property vs mutual fund',
    'stamp duty registration India',
    'LTCG property Budget 2024',
    'property capital gains tax',
    'home loan interest property return',
  ],
});

export default function RealEstateReturnCalculatorLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Real Estate Actual Return Calculator', url: '/calculators/real-estate-return' },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
