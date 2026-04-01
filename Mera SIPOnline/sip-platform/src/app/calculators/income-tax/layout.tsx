import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Income Tax Calculator | Old vs New Regime Comparison FY 2026-27',
  description: 'Compare income tax under Old and New regimes. Calculate tax, deductions, and find which regime saves you more. Updated for FY 2026-27 tax slabs.',
  path: '/calculators/income-tax',
  keywords: ['income tax calculator', 'old vs new tax regime', 'tax calculator India', 'income tax comparison', 'FY 2026-27 tax calculator', 'section 80C deductions', 'new tax regime calculator'],
});

export default function IncomeTaxCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
