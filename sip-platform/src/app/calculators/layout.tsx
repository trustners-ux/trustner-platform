import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { CalculatorCTA } from '@/components/sections/CalculatorCTA';

export const metadata: Metadata = generateSEOMetadata({
  title: '52 Financial Calculators | SIP, Tax, Insurance, Retirement, NRI & Life Planning | Trustner',
  description:
    'Access 52 free financial calculators — SIP, EMI, income tax, LTCG, retirement, FIRE, child education, marriage, SSY, NRE/NRO/FCNR, insurance IRR, PSU benefits, senior citizen income and more. Plan every financial decision with CFP-grade math and real-time charts.',
  path: '/calculators',
  keywords: [
    'financial calculators India',
    'SIP calculator',
    'EMI calculator',
    'income tax calculator',
    'FIRE calculator',
    'retirement planner',
    'net worth calculator',
    'insurance calculator',
    'loan calculator',
    'investment planning tools',
  ],
});

export default function CalculatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CalculatorCTA />
    </>
  );
}
