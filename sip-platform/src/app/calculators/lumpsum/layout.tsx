import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Lumpsum Investment Planner | Plan Lump Sum Investments & Withdrawals',
  description:
    'Plan lump sum investments and withdrawals over time. Visualize corpus growth with multiple cash flow events and see how your wealth evolves year by year.',
  path: '/calculators/lumpsum',
  keywords: [
    'lumpsum calculator',
    'lump sum investment calculator',
    'one-time investment returns',
    'lumpsum mutual fund calculator',
    'lumpsum planner',
    'lumpsum growth calculator',
    'lump sum investment India',
  ],
});

export default function LumpsumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['lumpsum'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Lumpsum Investment Planner', url: '/calculators/lumpsum' },
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
