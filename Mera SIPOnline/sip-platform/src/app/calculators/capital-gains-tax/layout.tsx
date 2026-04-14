import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Capital Gains Tax Calculator | STCG & LTCG Tax on Stocks, MF, Property',
  description: 'Calculate capital gains tax on stocks, mutual funds, property, and gold. Know STCG vs LTCG classification, tax rates, and indexation benefits.',
  path: '/calculators/capital-gains-tax',
  keywords: ['capital gains tax calculator', 'LTCG tax calculator', 'STCG tax', 'mutual fund capital gains', 'property capital gains tax India', 'indexation benefit calculator', 'long term capital gains tax'],
});

export default function CapitalGainsTaxCalculatorLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['capital-gains-tax'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Capital Gains Tax Calculator', url: '/calculators/capital-gains-tax' },
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
