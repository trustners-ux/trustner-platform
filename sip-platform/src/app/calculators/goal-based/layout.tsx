import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Goal-Based SIP Calculator | Find SIP for Your Target',
  description:
    'Calculate the exact monthly SIP amount needed to reach your financial goal. Set your target corpus, timeline, and expected returns to get a personalized SIP plan.',
  path: '/calculators/goal-based',
  keywords: [
    'goal-based SIP calculator',
    'SIP goal planner',
    'target amount SIP calculator',
    'financial goal calculator',
    'SIP for goal planning',
    'how much SIP for target',
    'reverse SIP calculator',
    'SIP amount calculator',
  ],
});

export default function GoalBasedSIPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['goal-based'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Goal-Based SIP Calculator', url: '/calculators/goal-based' },
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
