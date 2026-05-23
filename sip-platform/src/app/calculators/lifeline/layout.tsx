import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Lifeline Investment Tool | Professional-Grade Investment & Withdrawal Calculator',
  description:
    'Plan your complete investment lifeline with this professional-grade tool. Add SIPs, lump sum investments, SWP withdrawals, and one-time withdrawals at any year. The most comprehensive investment planning tool on MeraSIP.',
  path: '/calculators/lifeline',
  keywords: [
    'lifeline calculator',
    'lifeline investment tool',
    'investment planning calculator',
    'SIP SWP combined calculator',
    'lumpsum invest withdraw planner',
    'life stage investment calculator',
    'financial lifecycle planner',
    'SIP to SWP calculator',
    'wealth accumulation planner',
    'lifetime investment planner',
  ],
});

export default function LifelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['lifeline'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Lifeline Investment Tool', url: '/calculators/lifeline' },
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
