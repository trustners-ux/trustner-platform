import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Market Correction Impact Calculator | Crash Simulator',
  description:
    'Simulate how market corrections and crashes impact your SIP portfolio. Visualize recovery timelines and see why continuing SIP during downturns builds long-term wealth.',
  path: '/calculators/correction-impact',
  keywords: [
    'market correction calculator',
    'market crash impact SIP',
    'SIP during market crash',
    'crash simulator calculator',
    'market downturn SIP impact',
    'portfolio crash recovery',
    'SIP correction impact',
    'bear market SIP calculator',
  ],
});

export default function CorrectionImpactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['correction-impact'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Market Correction Impact Calculator', url: '/calculators/correction-impact' },
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
