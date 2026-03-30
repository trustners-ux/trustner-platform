import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Loan Prepayment Calculator | Calculate Interest Saved & Tenure Reduction',
  description: 'Calculate how much interest you save and how many years you cut by prepaying your loan. Compare with and without prepayment scenarios.',
  path: '/calculators/loan-prepayment',
  keywords: ['loan prepayment calculator', 'home loan prepayment', 'interest saved calculator', 'loan tenure reduction', 'prepayment benefit calculator', 'part payment calculator', 'loan foreclosure calculator'],
});

export default function LoanPrepaymentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
