import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Child Education Planner | SIP Calculator for Future Education Costs',
  description:
    'Plan your child\'s education with real cost projections for engineering, medical, MBA, and abroad studies. Calculate the monthly SIP needed to build the target corpus, factor in education inflation, and compare flat vs step-up SIP scenarios.',
  path: '/calculators/child-education',
  keywords: [
    'child education planner',
    'child education calculator',
    'education SIP calculator',
    'future cost of education',
    'IIT cost calculator',
    'MBBS cost India',
    'abroad education cost',
    'MBA cost calculator',
    'SIP for child education',
    'education inflation calculator',
  ],
});

export default function ChildEducationPlannerLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['child-education'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Child Education Planner', url: '/calculators/child-education' },
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
