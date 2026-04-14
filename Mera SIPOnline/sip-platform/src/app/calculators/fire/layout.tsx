import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'FIRE Calculator | Financial Independence Retire Early India',
  description: 'Calculate your FIRE number, years to financial independence, and safe withdrawal rate. Plan your early retirement with detailed projections and charts.',
  path: '/calculators/fire',
  keywords: ['FIRE calculator', 'financial independence calculator', 'retire early India', 'FIRE number', 'early retirement calculator', '4 percent rule', 'financial independence retire early'],
});

export default function FIRELayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['fire'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'FIRE Calculator', url: '/calculators/fire' },
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
