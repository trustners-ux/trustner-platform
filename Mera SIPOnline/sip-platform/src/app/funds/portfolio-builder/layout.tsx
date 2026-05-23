import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Model Portfolio Builder | Build & Test Your Mutual Fund Portfolio',
  description:
    'Build a custom mutual fund model portfolio from Trustner’s curated 130-fund universe. Set allocations, see weighted returns, expense ratio, risk metrics, cap-bucket mix and SIP projections in real-time. Save, share, or hand off to your Trustner Relationship Manager for execution.',
  path: '/funds/portfolio-builder',
  keywords: [
    'model portfolio builder',
    'mutual fund portfolio builder india',
    'asset allocation calculator',
    'sip portfolio designer',
    'multi fund sip planner',
    'weighted returns calculator',
    'large cap mid cap small cap allocation',
    'fund of funds allocation',
    'Trustner portfolio builder',
    'mera sip model portfolio',
  ],
});

export default function PortfolioBuilderLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Funds', url: '/funds' },
    { name: 'Portfolio Builder', url: '/funds/portfolio-builder' },
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
