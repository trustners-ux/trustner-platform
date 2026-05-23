import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SIP Renewal & Churn Impact Calculator | MFD Business Planner',
  description:
    'Model the impact of retention/churn rates on an MFD SIP book. Compare 85% / 90% / 95% / 98% continuation scenarios.',
  alternates: { canonical: '/mfd/sip-churn' },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function MFDChurnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
