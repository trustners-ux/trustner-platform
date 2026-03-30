import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Commission Disclosure | Fee Transparency | Mera SIP Online',
  description:
    'Transparent disclosure of mutual fund distribution commissions. Understand trail commission, expense ratio, direct vs regular plans, and our fee transparency commitment.',
  path: '/commission-disclosure',
  keywords: [
    'mutual fund commission disclosure',
    'trail commission',
    'mutual fund distributor fees',
    'expense ratio transparency',
    'direct vs regular plans',
    'AMFI commission guidelines',
  ],
});

export default function CommissionDisclosureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
