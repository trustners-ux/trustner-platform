import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: '30 Financial Calculators | SIP, Tax, Insurance, Loan & Life Planning Tools',
  description:
    'Access 30 free financial calculators — SIP, EMI, tax, insurance, retirement, FIRE, net worth, and more. Plan every financial decision with interactive charts and real-time projections.',
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
  return children;
}
