import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Health Insurance Calculator | Find Ideal Coverage for Your Family',
  description: 'Calculate adequate health insurance coverage based on your city tier, family size, age, hospital preference, and medical inflation. Find the right health cover for your family in India.',
  path: '/calculators/health-insurance',
  keywords: ['health insurance calculator', 'medical insurance coverage', 'health cover calculator India', 'family health insurance', 'medical inflation calculator'],
});

export default function HealthInsuranceCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
