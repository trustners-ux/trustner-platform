import { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Learn SIP & Mutual Fund Investing | Free Learning Academy | MeraSIP',
  description:
    'Structured, academy-style learning covering SIP fundamentals to advanced strategies. 12 modules, 100+ topics, MCQs, real-life examples, and formulas. NISM VA-aligned curriculum by CFP Ram Shah.',
  path: '/learn',
  keywords: [
    'learn SIP investing',
    'mutual fund learning',
    'SIP academy',
    'investment education India',
    'NISM mutual fund course',
    'SIP for beginners course',
    'financial literacy India',
    'mutual fund basics free course',
    'SIP knowledge academy',
    'investment course online free',
  ],
});

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Learn', url: '/learn' },
]);

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'SIP Knowledge Academy',
            description:
              'Structured, academy-style learning covering SIP fundamentals to advanced strategies. NISM VA-aligned curriculum.',
            url: 'https://www.merasip.com/learn',
            provider: {
              '@type': 'Organization',
              name: 'Trustner Asset Services Pvt. Ltd.',
              url: 'https://www.merasip.com',
            },
            isAccessibleForFree: true,
            inLanguage: 'en-IN',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
