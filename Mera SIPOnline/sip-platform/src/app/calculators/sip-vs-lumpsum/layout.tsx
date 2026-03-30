import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SIP vs Lump Sum Calculator | Compare Investment Strategies',
  description:
    'Compare SIP vs lump sum investment returns side by side. See which strategy works better for your goals with interactive charts, risk analysis, and detailed projections.',
  path: '/calculators/sip-vs-lumpsum',
  keywords: [
    'SIP vs lump sum calculator',
    'SIP vs lumpsum comparison',
    'SIP or lump sum which is better',
    'investment strategy comparison',
    'SIP vs one-time investment',
    'lump sum vs SIP returns',
    'mutual fund SIP vs lump sum',
    'rupee cost averaging calculator',
  ],
});

export default function SIPvsLumpsumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
