import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Portal | Trustner - POSP, Sub-Broker & Referral Partners',
  description: 'Login to the Trustner Partner Portal. Access your POSP, Sub-broker, or Referral partner dashboard to track business, commissions, and performance.',
  robots: { index: false, follow: false },
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
