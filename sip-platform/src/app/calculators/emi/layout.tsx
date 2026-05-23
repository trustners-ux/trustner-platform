import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'EMI Calculator | Calculate Loan EMI, Interest & Amortization',
  description: 'Free online EMI calculator for home loan, car loan, and personal loan. Get monthly EMI, total interest, amortization schedule with interactive charts.',
  path: '/calculators/emi',
  keywords: ['EMI calculator', 'loan EMI calculator', 'home loan EMI', 'car loan EMI', 'personal loan calculator', 'EMI amortization schedule', 'loan interest calculator', 'monthly EMI calculator'],
});

export default function EMICalculatorLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['emi'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'EMI Calculator', url: '/calculators/emi' },
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
