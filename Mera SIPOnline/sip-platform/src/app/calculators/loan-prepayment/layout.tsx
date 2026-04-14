import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Loan Prepayment Calculator | Calculate Interest Saved & Tenure Reduction',
  description: 'Calculate how much interest you save and how many years you cut by prepaying your loan. Compare with and without prepayment scenarios.',
  path: '/calculators/loan-prepayment',
  keywords: ['loan prepayment calculator', 'home loan prepayment', 'interest saved calculator', 'loan tenure reduction', 'prepayment benefit calculator', 'part payment calculator', 'loan foreclosure calculator'],
});

export default function LoanPrepaymentLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['loan-prepayment'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Loan Prepayment Calculator', url: '/calculators/loan-prepayment' },
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
