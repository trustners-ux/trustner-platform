import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Term Insurance Calculator | Find Your Ideal Coverage Amount',
  description: 'Calculate your ideal term insurance sum assured based on family expenses, loans, education needs, and existing coverage. Free needs-based term plan calculator for India.',
  path: '/calculators/term-insurance',
  keywords: ['term insurance calculator', 'sum assured calculator', 'life insurance coverage', 'term plan calculator India', 'term insurance coverage calculator', 'life cover calculator', 'insurance needs analysis'],
});

export default function TermInsuranceCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
