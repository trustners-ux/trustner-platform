import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Inflation-Adjusted SIP Calculator | Real Value Calculator',
  description:
    'Calculate the real inflation-adjusted value of your SIP investments. See how inflation impacts your corpus and find the true purchasing power of your future returns.',
  path: '/calculators/inflation-adjusted',
  keywords: [
    'inflation-adjusted SIP calculator',
    'real return SIP calculator',
    'SIP inflation impact',
    'real value calculator',
    'inflation adjusted returns',
    'purchasing power calculator',
    'SIP real returns India',
    'inflation vs SIP returns',
  ],
});

export default function InflationAdjustedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['inflation-adjusted'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Inflation-Adjusted SIP Calculator', url: '/calculators/inflation-adjusted' },
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
