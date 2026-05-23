import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MFD Cost-to-Commission Ratio Calculator | Internal Tool',
  description: 'Internal operating-cost vs commission calculator for authorized distributors',
  alternates: { canonical: '/mfd/cost-ratio' },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function MFDCostRatioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
