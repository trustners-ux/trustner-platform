import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MFD Business Planner | Trail Income Calculator',
  description: 'Internal trail commission calculator for authorized distributors',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function MFDTrailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
