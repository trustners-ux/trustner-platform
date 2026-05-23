import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Asset Allocation Rebalancer | Tax-Efficient Portfolio Rebalancing India',
  description:
    'Quantify your portfolio drift across Equity, Debt, Gold, Real Estate and Cash. Get rupee-level rebalancing actions and a tax-efficient sequence that minimises LTCG/STCG impact.',
  path: '/calculators/asset-rebalancer',
  keywords: [
    'asset allocation rebalancer India',
    'portfolio rebalancing calculator',
    'rebalance mutual fund portfolio',
    'LTCG tax on equity rebalancing',
    'debt mutual fund slab tax rebalance',
    'tax-efficient rebalancing India',
    'asset allocation drift calculator',
    'portfolio drift 5 percent rule',
    'SGB rebalance tax',
    'equity debt gold allocation',
  ],
});

const calculatorSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Asset Allocation Rebalancer',
  description:
    'India-tax-aware portfolio rebalancing calculator: measure drift, generate buy/sell actions in rupees, and see the most tax-efficient rebalancing sequence.',
  url: 'https://www.merasip.com/calculators/asset-rebalancer',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web Browser',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  provider: {
    '@type': 'Organization',
    name: 'Trustner Asset Services Pvt. Ltd.',
    url: 'https://www.merasip.com',
  },
};

export default function AssetRebalancerLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Asset Allocation Rebalancer', url: '/calculators/asset-rebalancer' },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
