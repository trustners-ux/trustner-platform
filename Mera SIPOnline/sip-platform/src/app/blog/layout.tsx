import type { Metadata } from 'next';

const BASE_URL = 'https://www.merasip.com';

export const metadata: Metadata = {
  title: 'SIP & Mutual Fund Blog | Expert Insights by CFP Ram Shah',
  description:
    'Read expert articles on SIP investing, mutual fund strategies, market analysis, tax planning, and wealth building. Written by Certified Financial Planner Ram Shah with 20+ years of experience. Free actionable advice for Indian investors.',
  keywords: [
    'SIP blog',
    'mutual fund blog India',
    'SIP investing tips',
    'market analysis India',
    'financial planning blog',
    'SIP strategy',
    'mutual fund tax planning',
    'CFP Ram Shah',
    'Trustner blog',
    'Mera SIP Online blog',
    'best SIP advice',
    'mutual fund expert India',
    'SIP investment articles',
    'personal finance blog India',
  ],
  authors: [{ name: 'CFP Ram Shah', url: `${BASE_URL}/about` }],
  openGraph: {
    type: 'website',
    title: 'SIP & Mutual Fund Blog | CFP Ram Shah | Mera SIP Online',
    description:
      'Expert articles on SIP investing, mutual fund strategies, market analysis, and financial planning by Certified Financial Planner Ram Shah.',
    url: `${BASE_URL}/blog`,
    siteName: 'Mera SIP Online by Trustner',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIP & Mutual Fund Blog | Mera SIP Online',
    description:
      'Expert insights on SIP investing and mutual funds by CFP Ram Shah.',
  },
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
