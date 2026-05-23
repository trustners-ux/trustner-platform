import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Life-Stage Planner | Invest, Grow & Withdraw SIP Calculator',
  description:
    'Plan your financial journey through 3 life stages — Invest with SIP, let your corpus Grow, then Withdraw systematically. See how your wealth builds and sustains through each phase.',
  path: '/calculators/life-stage',
  keywords: [
    'life stage calculator',
    'invest grow withdraw calculator',
    'SIP to SWP calculator',
    '3 phase investment planner',
    'wealth accumulation planner',
    'SIP growth calculator',
    'systematic withdrawal planner',
    'financial lifecycle planner',
    'retirement SIP SWP calculator',
    'life stage investment calculator',
  ],
});

export default function LifeStageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['life-stage'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Life-Stage Planner', url: '/calculators/life-stage' },
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
