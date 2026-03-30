import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Financial Health Score | Trustner Assessment',
  description:
    'I just completed my free Financial Health Assessment on MeraSIP. Get your personalized Financial Health Score (0-900) with CFP-grade analysis covering retirement, insurance, investments, and goals.',
  openGraph: {
    title: 'Free Financial Health Score — Powered by Trustner',
    description:
      'Get your personalized Financial Health Score (0-900) with CFP-grade analysis. Free, instant, and comprehensive. Powered by Trustner AI.',
    url: 'https://www.merasip.com/financial-planning/teaser',
    siteName: 'Mera SIP Online',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Financial Health Score — Powered by Trustner',
    description:
      'Get your personalized Financial Health Score (0-900) with CFP-grade analysis. Free, instant, and comprehensive.',
  },
};

export default function TeaserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
