import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Senior Citizen Income Architect | SCSS + RBI Bonds + POMIS + SWP Allocator',
  description:
    'Auto-allocate your retirement corpus across SCSS, RBI Floating Rate Bonds, POMIS, Tax-Free Bonds, FD ladders and mutual fund SWP to maximise post-tax monthly income. Built for Indian seniors aged 60-85.',
  path: '/calculators/senior-income',
  keywords: [
    'senior citizen income calculator',
    'SCSS calculator',
    'RBI floating rate bond calculator',
    'POMIS calculator',
    'senior citizen savings scheme',
    'retirement income allocation',
    'tax-free bonds for seniors',
    'mutual fund SWP for seniors',
    'post-tax monthly income retirement',
    'senior citizen investment plan India',
    'decumulation strategy',
    'corpus sustainability calculator',
  ],
});

export default function SeniorIncomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = (calculatorSchemas as Record<string, unknown>)['senior-income'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Senior Citizen Income Architect', url: '/calculators/senior-income' },
  ]);
  return (
    <>
      {schema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
