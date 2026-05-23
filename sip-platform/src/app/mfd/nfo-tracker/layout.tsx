import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MFD NFO Incentive Tracker | Trustner',
  description:
    'Model NFO trail vs existing-fund trail. See whether the incentive step-down adds up over the full holding period. Internal tool for authorized distributors.',
  alternates: {
    canonical: '/mfd/nfo-tracker',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function MFDNFOTrackerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
