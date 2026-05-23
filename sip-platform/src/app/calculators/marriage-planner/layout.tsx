import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Marriage Planner | Wedding Cost SIP Calculator with Gold Inflation (Son or Daughter)',
  description: 'Plan a wedding for your son or daughter with gold-inflation-aware projections. Estimate future ceremony, gold, clothes & gift budgets and find the monthly SIP needed \u2014 with fixed-\u20b9 or percentage annual step-up. Split between Equity SIP and Sovereign Gold Bonds for a complete plan.',
  path: '/calculators/marriage-planner',
  keywords: [
    'marriage calculator',
    'son marriage planner',
    'daughter marriage planner',
    'wedding planner sip',
    'marriage goal sip calculator',
    'sovereign gold bond calculator',
    'gold inflation calculator',
    'wedding cost calculator india',
    'sgb vs equity sip',
    'wedding corpus sip',
    'fixed amount step up sip',
    'percentage step up sip',
  ],
});

export default function MarriagePlannerCalculatorLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['marriage-planner'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Marriage Planner', url: '/calculators/marriage-planner' },
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
