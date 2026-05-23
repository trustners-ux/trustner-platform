import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SWP + SIP Combo Calculator | Lumpsum in BAF, SWP into Small Cap SIP',
  description:
    'Trustner\'s signature "safety bhi, return bhi" strategy. Park lumpsum in a Balanced Advantage Fund, withdraw a fixed annual rate via SWP, route it monthly as SIP into an aggressive Small Cap fund. See how lumpsum stays stable while SIP corpus compounds.',
  path: '/calculators/swp-sip-combo',
  keywords: [
    'SWP SIP combo calculator',
    'BAF SWP small cap SIP',
    'safety bhi return bhi',
    'balanced advantage fund SWP',
    'lumpsum to SIP strategy',
    'ICICI BAF SWP small cap',
    'mutual fund STP alternative',
    'monthly income plus growth',
  ],
});

export default function SwpSipComboLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'SWP + SIP Combo Calculator', url: '/calculators/swp-sip-combo' },
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
