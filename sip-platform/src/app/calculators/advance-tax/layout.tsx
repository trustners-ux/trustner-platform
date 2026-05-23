import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Advance Tax Calculator FY 2026-27 | Quarterly Installment Schedule with 234B/234C Interest',
  description:
    'Calculate your quarterly advance tax installments (15%/45%/75%/100%) under Old and New regimes for FY 2026-27. Sections 234B & 234C interest modelled for salaried, self-employed, presumptive (44AD/ADA) and senior-citizen taxpayers.',
  path: '/calculators/advance-tax',
  keywords: [
    'advance tax calculator',
    'advance tax FY 2026-27',
    '234C interest calculator',
    '234B interest calculator',
    'quarterly tax installments',
    'advance tax due dates',
    'old regime vs new regime tax',
    'presumptive taxation 44AD',
    'presumptive taxation 44ADA',
    'senior citizen advance tax',
  ],
});

export default function AdvanceTaxLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Advance Tax Calculator', url: '/calculators/advance-tax' },
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
