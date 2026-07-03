import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Portfolio Check-Up | Trustner',
  description:
    "A free, 2-minute self-reported check on your mutual fund portfolio — spot concentration, review-gap, and planning flags, then request a full Portfolio Diagnostic from your Relationship Manager.",
  path: '/portfolio-check-up',
  keywords: [
    'portfolio check up',
    'mutual fund portfolio health check',
    'free portfolio check',
    'portfolio review',
    'mutual fund concentration check',
  ],
});

export default function PortfolioCheckUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Portfolio Check-Up', url: '/portfolio-check-up' },
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
