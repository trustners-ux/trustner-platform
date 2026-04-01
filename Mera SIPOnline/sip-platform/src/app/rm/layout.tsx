import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trustner MIS | Employee Performance Dashboard',
  description: 'Track your business performance, incentives, and career progress at Trustner.',
  robots: { index: false, follow: false },
};

export default function RMLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
