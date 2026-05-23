import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Insurance IRR / XIRR Calculator | Decode Your Life Insurance Policy Returns',
  description:
    'Decode the real rate of return on your life insurance policy. Compute IRR and XIRR of Endowment, Money-Back, ULIP, Guaranteed Income and Whole Life plans — compare against a Mutual Fund alternative. CFP-grade cashflow calculator.',
  path: '/calculators/insurance-irr',
  keywords: [
    'insurance IRR calculator',
    'insurance XIRR calculator',
    'life insurance return calculator',
    'endowment IRR',
    'money back policy IRR',
    'ULIP IRR calculator',
    'LIC policy return calculator',
    'guaranteed income plan IRR',
    'surrender value calculator',
    'insurance vs mutual fund calculator',
  ],
});

export default function InsuranceIRRCalculatorLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['insurance-irr'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Insurance IRR Calculator', url: '/calculators/insurance-irr' },
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
