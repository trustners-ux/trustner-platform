import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'NRE vs NRO vs FCNR Deposit Comparator | NRI Post-Tax Returns',
  description:
    'Compare NRE, NRO, and FCNR deposits side-by-side. Post-tax returns, repatriation rules, and rupee depreciation modelled for NRIs.',
  path: '/calculators/nre-nro-fcnr',
  keywords: [
    'NRE vs NRO',
    'NRE vs FCNR',
    'NRI deposit comparator',
    'FCNR deposit calculator',
    'NRO FD tax',
    'NRI fixed deposit calculator',
    'repatriation rules NRI',
    'DTAA FCNR',
  ],
});

export default function NreNroFcnrLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['nre-nro-fcnr'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'NRE vs NRO vs FCNR Deposit Comparator', url: '/calculators/nre-nro-fcnr' },
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
