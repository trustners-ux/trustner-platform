import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Free Financial Planning | Basic, Standard & Comprehensive Plans | MeraSIP',
  description:
    'Get your personalized Financial Health Score (0-900) with professional-grade analysis. Free comprehensive assessment covering retirement, insurance, investments, and goals. Powered by Trustner AI.',
  path: '/financial-planning',
  keywords: [
    'financial planning',
    'financial health score',
    'retirement planning',
    'insurance gap',
    'investment planning',
    'free financial assessment',
    'financial health score',
    'Trustner',
    'goal based financial plan',
    'financial plan online free',
  ],
});

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Financial Planning', url: '/financial-planning' },
]);

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'FinancialProduct',
  name: 'Personalized Financial Planning',
  description:
    'Free personalized financial assessment with 3 tiers — Basic (5-min health check), Standard (goal-based plan), and Comprehensive (professional-grade blueprint).',
  url: 'https://www.merasip.com/financial-planning',
  provider: {
    '@type': 'Organization',
    name: 'Trustner Asset Services Pvt. Ltd.',
    url: 'https://www.merasip.com',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
    description: 'Free financial planning for all tiers',
  },
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
};

export default function FinancialPlanningLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
