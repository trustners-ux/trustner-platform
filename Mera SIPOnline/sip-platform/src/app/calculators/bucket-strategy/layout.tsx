import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Retirement Bucket Strategy Calculator | Optimize Your Retirement Income',
  description:
    'Plan your retirement income using the 5-bucket strategy. Allocate your corpus across emergency, short-term, medium-term, growth, and equity buckets for maximum safety and returns. Free CFP-grade calculator.',
  path: '/calculators/bucket-strategy',
  keywords: [
    'bucket strategy calculator',
    'retirement bucket strategy',
    'retirement income planning',
    'systematic withdrawal strategy',
    'retirement corpus allocation',
    'bucket approach retirement',
    'retirement fund allocation',
    'retirement income optimization',
    'SWP vs bucket strategy',
    'pension planning calculator',
    'retirement planning India',
    'CFP retirement strategy',
  ],
});

export default function BucketStrategyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['bucket-strategy'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Retirement Bucket Strategy Calculator', url: '/calculators/bucket-strategy' },
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
