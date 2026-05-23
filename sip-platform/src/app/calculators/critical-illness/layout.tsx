import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Critical Illness & Disability Cover Planner | Size Your CI Cover',
  description:
    'Most Indians have zero or inadequate critical illness cover. Size your CI + disability cover based on real treatment costs (cancer, heart, kidney, stroke), income disruption during recovery, and existing policies. Age-based premium estimates included.',
  path: '/calculators/critical-illness',
  keywords: [
    'critical illness calculator',
    'CI cover calculator India',
    'disability insurance calculator',
    'cancer cover calculator',
    'critical illness premium estimate',
    'CI rider calculator',
    'income replacement insurance',
  ],
});

export default function CriticalIllnessCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['critical-illness'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Critical Illness & Disability Cover Planner', url: '/calculators/critical-illness' },
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
