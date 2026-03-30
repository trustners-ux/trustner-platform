import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Retirement SIP Planner | Plan Your Retirement Corpus',
  description:
    'Plan your retirement with our SIP retirement calculator. Estimate the monthly SIP needed to build your retirement corpus factoring in inflation and life expectancy.',
  path: '/calculators/retirement',
  keywords: [
    'retirement SIP calculator',
    'retirement planner',
    'retirement corpus calculator',
    'SIP for retirement',
    'retirement planning India',
    'pension SIP calculator',
    'early retirement calculator',
    'retirement fund calculator',
  ],
});

export default function RetirementSIPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
