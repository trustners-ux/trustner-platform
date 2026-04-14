import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Emergency Fund Calculator | How Much Emergency Fund Do You Need?',
  description: 'Calculate your ideal emergency fund based on monthly expenses, dependents, job stability, and income type. Get personalized 3-12 month recommendations with savings plan.',
  path: '/calculators/emergency-fund',
  keywords: ['emergency fund calculator', 'emergency fund how much', 'rainy day fund', 'emergency savings calculator', 'financial safety net', 'emergency fund India', 'liquidity buffer calculator'],
});

export default function EmergencyFundLayout({ children }: { children: React.ReactNode }) {
  const schema = calculatorSchemas['emergency-fund'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Emergency Fund Calculator', url: '/calculators/emergency-fund' },
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
