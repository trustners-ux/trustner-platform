import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'ULIP IRR Analyzer | Real Returns After All Charges',
  description:
    'Decode what your ULIP actually earns. Year-by-year simulator of allocation, FMC, admin, and mortality charges — with realized IRR, surrender value trajectory, and MF + Term alternative comparison.',
  path: '/calculators/ulip-irr',
  keywords: [
    'ULIP IRR calculator',
    'ULIP real return calculator',
    'ULIP charges analyzer',
    'ULIP allocation FMC admin mortality',
    'ULIP surrender value calculator',
    'ULIP vs mutual fund IRR',
    'ULIP fund value decoder',
    'HDFC Life ICICI Pru ULIP IRR',
  ],
});

export default function ULIPIRRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['ulip-irr'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'ULIP IRR Analyzer', url: '/calculators/ulip-irr' },
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
