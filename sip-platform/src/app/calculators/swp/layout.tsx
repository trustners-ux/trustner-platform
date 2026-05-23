import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SWP Calculator | Systematic Withdrawal Plan Calculator',
  description:
    'Calculate systematic withdrawal plan returns and see how long your mutual fund corpus will last. Plan monthly withdrawals while your remaining investment continues to grow.',
  path: '/calculators/swp',
  keywords: [
    'SWP calculator',
    'systematic withdrawal plan calculator',
    'SWP mutual fund calculator',
    'monthly withdrawal calculator',
    'SWP returns calculator',
    'mutual fund withdrawal plan',
    'SWP vs SIP',
    'retirement withdrawal calculator',
  ],
});

export default function SWPCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['swp'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'SWP Calculator', url: '/calculators/swp' },
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
