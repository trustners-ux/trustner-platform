import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Lifeline Financial Planner | CFP-Style Investment & Withdrawal Calculator',
  description:
    'Plan your complete financial lifeline like a Certified Financial Planner. Add SIPs, lump sum investments, SWP withdrawals, and one-time withdrawals at any year. The most comprehensive financial planning tool.',
  path: '/calculators/lifeline',
  keywords: [
    'lifeline calculator',
    'CFP calculator',
    'financial planner calculator',
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
    { name: 'Lifeline Financial Planner', url: '/calculators/lifeline' },
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
