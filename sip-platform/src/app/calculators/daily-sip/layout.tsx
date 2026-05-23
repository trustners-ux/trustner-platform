import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Daily SIP Calculator | Daily Micro-Investment Returns',
  description:
    'Calculate returns on daily SIP micro-investments. See how investing small amounts every day through daily SIP compounds into significant wealth over time.',
  path: '/calculators/daily-sip',
  keywords: [
    'daily SIP calculator',
    'daily micro SIP',
    'daily investment calculator',
    'daily SIP returns',
    'micro SIP calculator',
    'daily mutual fund SIP',
    'small daily investment returns',
    'daily compounding calculator',
  ],
});

export default function DailySIPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = calculatorSchemas['daily-sip'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Daily SIP Calculator', url: '/calculators/daily-sip' },
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
