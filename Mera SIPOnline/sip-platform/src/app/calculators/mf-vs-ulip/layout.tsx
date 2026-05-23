import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Mutual Fund vs ULIP Calculator | 20-Year Rupee Showdown',
  description:
    'Honest 20-year comparison: same premium into a typical ULIP vs Term Insurance + Mutual Fund SIP. See how ULIP charges (allocation, FMC, admin, mortality) erode compounding. Rupee-for-rupee verdict.',
  path: '/calculators/mf-vs-ulip',
  keywords: [
    'ULIP vs mutual fund calculator',
    'MF vs ULIP 20 years',
    'ULIP charges calculator',
    'term insurance plus mutual fund vs ULIP',
    'ULIP charges FMC allocation mortality',
    'mutual fund SIP vs ULIP returns',
    'which is better ULIP or mutual fund',
  ],
});

export default function MFvsULIPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['mf-vs-ulip'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Mutual Fund vs ULIP Calculator', url: '/calculators/mf-vs-ulip' },
  ]);
  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
