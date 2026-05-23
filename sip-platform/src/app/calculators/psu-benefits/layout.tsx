import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'PSU Retirement Benefits Calculator | EPF, Gratuity, NPS, Leave Encashment',
  description:
    'Project your total retirement corpus across PF, VPF, NPS, Gratuity, Leave Encashment, Pension, and insurance maturity. CFP-grade calculator built for PSU, Government, and Large Corporate employees.',
  path: '/calculators/psu-benefits',
  keywords: [
    'PSU retirement calculator',
    'EPF calculator',
    'gratuity calculator',
    'leave encashment calculator',
    'NPS calculator',
    'government employee retirement',
    'VPF calculator',
    'OIL retirement benefits',
    'ONGC retirement',
    'NTPC retirement',
    'PSU bank pension',
  ],
});

export default function PSUBenefitsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'PSU Retirement Benefits Calculator', url: '/calculators/psu-benefits' },
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
