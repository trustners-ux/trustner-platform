import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Sukanya Samriddhi Yojana (SSY) Planner | Maturity, Sec 80C & Alternatives',
  description:
    "Project your girl child's SSY maturity corpus at 8.2% p.a., calculate partial-withdrawal value at age 18, and compare SSY with PPF and Equity Mutual Funds. Includes Sec 80C tax savings and a 50/50 blended plan for parents of daughters below age 10.",
  path: '/calculators/ssy-planner',
  keywords: [
    'Sukanya Samriddhi Yojana calculator',
    'SSY calculator',
    'SSY maturity calculator',
    'SSY vs PPF',
    'SSY vs mutual fund',
    'Sukanya Samriddhi interest rate 2026',
    'SSY tax benefit 80C',
    'SSY planner for girl child',
    'SSY 8.2%',
    'SSY 21 years corpus',
  ],
});

export default function SSYPlannerLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['ssy-planner'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'SSY Planner', url: '/calculators/ssy-planner' },
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
