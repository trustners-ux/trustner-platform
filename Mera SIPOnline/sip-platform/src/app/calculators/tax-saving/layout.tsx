import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Tax Saving Calculator | Section 80C, 80D, 80CCD Deduction Planner',
  description: 'Plan your tax-saving investments under Section 80C, 80D, and 80CCD. Track utilization, find remaining limits, and maximize your deductions.',
  path: '/calculators/tax-saving',
  keywords: ['tax saving calculator', 'section 80C calculator', '80D deduction', 'tax saving investment', 'NPS tax benefit', '80CCD deduction', 'tax deduction planner India', 'ELSS tax saving'],
});

export default function TaxSavingCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
