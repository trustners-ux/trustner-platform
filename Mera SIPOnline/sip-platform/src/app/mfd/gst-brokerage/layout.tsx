import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GST on MFD Brokerage Calculator | Trustner',
  description:
    'Compute 18% output GST on mutual fund brokerage, claim Input Tax Credit on GST-invoiced business expenses, and see net take-home income. Built for Indian MFDs.',
  alternates: {
    canonical: '/mfd/gst-brokerage',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function MFDGSTBrokerageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
