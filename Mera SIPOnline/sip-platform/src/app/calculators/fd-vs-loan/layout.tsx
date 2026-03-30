import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Break FD vs Take Loan Calculator | Which Option Saves More Money?',
  description: 'Should you break your fixed deposit or take a loan? Compare the net cost of breaking an FD (with penalty and tax) vs taking a personal or gold loan.',
  path: '/calculators/fd-vs-loan',
  keywords: ['break FD or take loan', 'FD vs loan calculator', 'fixed deposit premature withdrawal', 'FD penalty calculator', 'personal loan vs FD', 'loan against FD', 'FD break cost calculator'],
});

export default function FDvsLoanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
