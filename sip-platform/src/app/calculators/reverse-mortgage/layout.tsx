import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Reverse Mortgage Calculator | RML & RMLeA Monthly Payout Estimator',
  description:
    'Calculate monthly payout from Reverse Mortgage Loan (RML) or RML-enabled Annuity (RMLeA) schemes for senior citizens (60+) in India. Compare with sell-and-SWP alternative. NHB-rule-aware loan-to-value tiers, accumulated loan projection, and heir inheritance visualisation.',
  path: '/calculators/reverse-mortgage',
  keywords: [
    'reverse mortgage calculator India',
    'RML calculator',
    'RMLeA calculator',
    'reverse mortgage loan enabled annuity',
    'senior citizen home equity',
    'NHB reverse mortgage',
    'monthly payout from home',
    'reverse mortgage vs SWP',
    'reverse mortgage vs sell property',
    'senior citizen income from home',
    'reverse mortgage interest rate India',
    'no negative equity rule',
    'home equity for retirees',
    'property annuity India',
  ],
});

export default function ReverseMortgageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = (calculatorSchemas as Record<string, unknown>)['reverse-mortgage'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Reverse Mortgage Calculator', url: '/calculators/reverse-mortgage' },
  ]);
  return (
    <>
      {schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
