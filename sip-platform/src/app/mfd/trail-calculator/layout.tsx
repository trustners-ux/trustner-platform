import type { Metadata } from 'next';

// Trail Calculator — INDEXABLE. Used by Trustner team to surface during
// sub-broker onboarding. Not linked from top nav or homepage, but discoverable
// via Google search by anyone intentionally looking for MFD trail tools.
export const metadata: Metadata = {
  title: 'MFD Trail Commission Calculator | New SIP, Lump Sum, AUM Growth, Target Income | Trustner',
  description:
    '8-in-1 trail commission calculator for AMFI-registered Mutual Fund Distributors. Project monthly trail income from new SIPs, lump sums, existing AUM growth, sub-broker scaling, and compare Insurance vs Mutual Fund commissions over 10-30 year horizons.',
  keywords: [
    'MFD trail commission calculator',
    'mutual fund distributor trail income',
    'AUM growth calculator for MFD',
    'sub-broker scale calculator',
    'AMFI ARN trail income',
    'MF vs insurance commission compare',
    'mutual fund distributor business planning',
    'Trustner MFD trail calculator',
  ],
  alternates: { canonical: '/mfd/trail-calculator' },
};

export default function MFDTrailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
