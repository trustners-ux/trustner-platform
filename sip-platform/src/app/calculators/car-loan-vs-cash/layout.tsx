import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Car Loan vs Paying Cash Calculator | Which Is Better Financially?',
  description: 'Should you take a car loan or pay cash? Compare the total cost of financing vs the opportunity cost of paying upfront. Data-driven verdict.',
  path: '/calculators/car-loan-vs-cash',
  keywords: ['car loan vs cash', 'car loan calculator', 'buy car loan or cash', 'car loan opportunity cost', 'car financing calculator', 'car loan vs investment', 'should I take car loan'],
});

export default function CarLoanVsCashLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['car-loan-vs-cash'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Car Loan vs Paying Cash Calculator', url: '/calculators/car-loan-vs-cash' },
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
