import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Net Worth Calculator | Track Your Assets, Liabilities & Wealth Score',
  description: 'Calculate your net worth by adding assets and liabilities. Get liquid net worth, debt-to-asset ratio, and wealth score with interactive charts.',
  path: '/calculators/net-worth',
  keywords: ['net worth calculator', 'net worth tracker', 'wealth calculator India', 'assets vs liabilities', 'financial health score', 'debt to asset ratio', 'liquid net worth calculator'],
});

export default function NetWorthLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['net-worth'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Net Worth Calculator', url: '/calculators/net-worth' },
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
