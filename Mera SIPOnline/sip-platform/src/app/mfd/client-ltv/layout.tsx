import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MFD Client LTV Calculator | Lifetime Trail vs CAC',
  description:
    'Compute per-client lifetime trail value vs acquisition cost. Plan sustainable client acquisition with LTV/CAC ratios. For authorized distributors only.',
  alternates: {
    canonical: '/mfd/client-ltv',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function MFDClientLTVLayout({ children }: { children: React.ReactNode }) {
  return children;
}
