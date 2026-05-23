import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Home Loan Affordability Calculator | How Much House Can You Afford?',
  description: 'Calculate the maximum property price you can afford based on your income, existing EMIs, and loan terms. Get comfortable, manageable, and stretch recommendations.',
  path: '/calculators/home-affordability',
  keywords: ['home loan affordability', 'how much house can I afford', 'home loan eligibility', 'property affordability calculator', 'home loan calculator India', 'maximum home loan amount', 'FOIR calculator'],
});

export default function HomeAffordabilityLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['home-affordability'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Home Loan Affordability Calculator', url: '/calculators/home-affordability' },
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
