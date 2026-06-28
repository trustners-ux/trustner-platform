import type { Metadata } from 'next';
import FreeCheckClient from './FreeCheckClient';

export const metadata: Metadata = {
  title: 'Free Mutual Fund Portfolio Check | 60-Second Health Report | MeraSIP by Trustner',
  description:
    'Upload your CAS or portfolio statement and get a free 60-second health check — corpus, allocation mix, duplicate funds, and risk concentration. Reviewed by an AMFI-registered distributor (ARN-286886). No charges, no obligation.',
  alternates: { canonical: 'https://www.merasip.com/portfolio-check' },
  keywords: [
    'free portfolio review mutual funds',
    'CAS statement analysis',
    'mutual fund portfolio health check India',
    'portfolio overlap check',
    'mutual fund review free',
  ],
};

export default function PortfolioCheckPage() {
  return <FreeCheckClient />;
}
