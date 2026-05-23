import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Safe Withdrawal Rate (SWR) Calculator for India | Monte Carlo Retirement',
  description:
    "India-calibrated Safe Withdrawal Rate calculator with Monte Carlo simulation. Find a sustainable SWR for 25-40 year retirement horizons using 6% inflation, 12% equity and 6.5% debt assumptions. Much richer than the US 4% rule.",
  path: '/calculators/safe-withdrawal-rate',
  keywords: [
    'safe withdrawal rate calculator India',
    'SWR calculator',
    '4 percent rule India',
    'Bengen rule India',
    'Monte Carlo retirement calculator',
    'sequence of returns risk',
    'Guyton-Klinger guardrails',
    'retirement withdrawal India',
    'sustainable withdrawal rate',
    'retirement corpus calculator',
  ],
});

const calculatorSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Safe Withdrawal Rate (SWR) Calculator for India',
  description:
    'India-calibrated Safe Withdrawal Rate calculator with Monte Carlo simulation, sequence-of-returns scenarios, and Guyton-Klinger guardrails for retirees over 25-40 year horizons.',
  url: 'https://www.merasip.com/calculators/safe-withdrawal-rate',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web Browser',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  provider: {
    '@type': 'Organization',
    name: 'Trustner Asset Services Pvt. Ltd.',
    url: 'https://www.merasip.com',
  },
};

export default function SafeWithdrawalRateLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
    { name: 'Safe Withdrawal Rate Calculator', url: '/calculators/safe-withdrawal-rate' },
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
