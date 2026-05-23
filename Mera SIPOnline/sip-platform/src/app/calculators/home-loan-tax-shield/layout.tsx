import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Home Loan Tax Shield Calculator | Old vs New Regime | Year-by-Year',
  description:
    'See the actual rupee tax benefit of your home loan under Old Regime vs New Regime, year by year. Most buyers overstate the tax benefit — this tool gives the honest number including Section 24(b), 80C, 80EE and 80EEA for FY 2026-27.',
  path: '/calculators/home-loan-tax-shield',
  keywords: [
    'home loan tax shield calculator',
    'home loan tax benefit old vs new regime',
    'section 24(b) calculator',
    'home loan 80C principal deduction',
    '80EEA affordable housing calculator',
    '80EE first-time home buyer',
    'home loan tax saving FY 2026-27',
    'self-occupied home loan tax benefit new regime',
    'let-out property interest deduction',
    'effective post-tax interest rate home loan',
  ],
});

export default function HomeLoanTaxShieldLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Home Loan Tax Shield Calculator', url: '/calculators/home-loan-tax-shield' },
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
