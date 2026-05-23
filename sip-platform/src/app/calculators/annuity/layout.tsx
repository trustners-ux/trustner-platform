import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { calculatorSchemas } from '@/components/seo/CalculatorSchemas';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Annuity Decoder | Immediate vs Deferred, Single vs Joint, ROP vs No-ROP',
  description:
    'Decode Indian annuities: compare Immediate vs Deferred, Single Life vs Joint Life, and Return of Purchase Price (ROP) vs no-ROP. See the real IRR of each variant before buying an annuity in India.',
  path: '/calculators/annuity',
  keywords: [
    'annuity calculator India',
    'immediate annuity IRR',
    'deferred annuity',
    'return of purchase price annuity',
    'LIC Jeevan Akshay calculator',
    'HDFC Life annuity',
    'ICICI Pru Guaranteed Pension',
    'SBI Life annuity',
    'single life vs joint life annuity',
    'annuity vs SWP',
    'retirement income India',
    'pension calculator 2026',
  ],
});

export default function AnnuityLayout({ children }: { children: React.ReactNode }) {
  const schema = (calculatorSchemas as Record<string, unknown>)['annuity'];
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Annuity Decoder', url: '/calculators/annuity' },
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
