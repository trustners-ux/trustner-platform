import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Insurance Surrender vs Continue Calculator | Mid-Policy Decision Tool',
  description:
    'Mid-policy dilemma? Should you surrender your traditional life insurance policy now and invest in mutual funds, or continue paying premiums until maturity? Compare both paths side-by-side with IRR, terminal wealth and tax-adjusted rupee delta.',
  path: '/calculators/surrender-vs-continue',
  keywords: [
    'insurance surrender calculator',
    'surrender vs continue policy',
    'life insurance surrender value',
    'should I surrender my LIC policy',
    'endowment surrender calculator',
    'ULIP surrender vs continue',
    'paid-up vs surrender',
    'mid-policy IRR calculator',
    'surrender value vs mutual fund',
    'break-even IRR insurance',
  ],
});

export default function SurrenderVsContinueLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Surrender vs Continue Calculator', url: '/calculators/surrender-vs-continue' },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
