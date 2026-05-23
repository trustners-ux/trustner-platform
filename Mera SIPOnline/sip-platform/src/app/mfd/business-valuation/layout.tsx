import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MFD Business Valuation Calculator | Estimate Book Sale Value',
  description:
    'Estimate the fair market value of your MFD business using three industry-standard methods: AUM %, income multiple of annual trail, and DCF of trail. For authorized distributors only.',
  alternates: {
    canonical: '/mfd/business-valuation',
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

export default function MFDBusinessValuationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
