import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Home Loan Affordability Calculator | How Much House Can You Afford?',
  description: 'Calculate the maximum property price you can afford based on your income, existing EMIs, and loan terms. Get comfortable, manageable, and stretch recommendations.',
  path: '/calculators/home-affordability',
  keywords: ['home loan affordability', 'how much house can I afford', 'home loan eligibility', 'property affordability calculator', 'home loan calculator India', 'maximum home loan amount', 'FOIR calculator'],
});

export default function HomeAffordabilityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
