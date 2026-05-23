import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Mutual Fund & SIP Glossary | 200+ Investment Terms Explained | MeraSIP',
  description:
    'Complete glossary of SIP, mutual fund, and investment terms explained in simple language. Learn key financial concepts from NAV and AUM to XIRR and expense ratio.',
  path: '/glossary',
  keywords: [
    'SIP glossary',
    'mutual fund glossary',
    'financial terms dictionary',
    'investment terminology',
    'SIP terms explained',
    'NAV meaning',
    'AUM meaning',
    'mutual fund terminology India',
    'ELSS meaning',
    'expense ratio meaning',
    'XIRR explained',
  ],
});

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Glossary', url: '/glossary' },
]);

const glossarySchema = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  name: 'Mutual Fund & SIP Glossary',
  description:
    'Comprehensive glossary of 200+ mutual fund, SIP, and investment terms explained in simple language.',
  url: 'https://www.merasip.com/glossary',
  inLanguage: 'en-IN',
  publisher: {
    '@type': 'Organization',
    name: 'Trustner Asset Services Pvt. Ltd.',
    url: 'https://www.merasip.com',
  },
};

export default function GlossaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(glossarySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
