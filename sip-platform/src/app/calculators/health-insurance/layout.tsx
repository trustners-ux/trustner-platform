import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Health Insurance Calculator | Find Ideal Coverage for Your Family',
  description: 'Calculate adequate health insurance coverage based on your city tier, family size, age, hospital preference, and medical inflation. Find the right health cover for your family in India.',
  path: '/calculators/health-insurance',
  keywords: ['health insurance calculator', 'medical insurance coverage', 'health cover calculator India', 'family health insurance', 'medical inflation calculator'],
});

export default function HealthInsuranceCalculatorLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['health-insurance'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Health Insurance Calculator', url: '/calculators/health-insurance' },
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
