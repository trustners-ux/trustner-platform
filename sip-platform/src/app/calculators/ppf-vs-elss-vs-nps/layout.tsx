import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'PPF vs ELSS vs NPS Calculator | Section 80C Post-Tax Showdown',
  description:
    'The honest Section 80C comparison over 15–40 years. Route the same ₹1.5L into PPF (EEE, 7.1%), ELSS (equity 12%, LTCG-taxed), or NPS (60% lump tax-free + 40% annuity). See which maximises post-tax corpus — and why a Smart Mix usually wins.',
  path: '/calculators/ppf-vs-elss-vs-nps',
  keywords: [
    'PPF vs ELSS vs NPS',
    'Section 80C comparison calculator',
    'best 80C investment',
    'PPF ELSS NPS post-tax returns',
    'NPS 80CCD 1B extra 50000',
    'ELSS LTCG tax calculator',
    'PPF 7.1% compounding',
    '80C tax saving calculator',
    'Smart Mix 80C portfolio',
  ],
});

export default function PPFvsELSSvsNPSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['ppf-vs-elss-vs-nps'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'PPF vs ELSS vs NPS Calculator', url: '/calculators/ppf-vs-elss-vs-nps' },
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
