import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Human Life Value Calculator | How Much Life Insurance Do You Need?',
  description: 'Calculate your Human Life Value (HLV) based on income, expenses, liabilities, and future goals. Find out exactly how much life insurance coverage you need to protect your family.',
  path: '/calculators/human-life-value',
  keywords: ['HLV calculator', 'life insurance need', 'human life value', 'insurance coverage calculator', 'life insurance calculator', 'income replacement method', 'term insurance calculator'],
});

export default function HumanLifeValueCalculatorLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['human-life-value'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Human Life Value Calculator', url: '/calculators/human-life-value' },
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
