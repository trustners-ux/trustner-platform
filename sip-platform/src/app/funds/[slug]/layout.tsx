/**
 * Per-fund route layout.
 *
 * Metadata is now generated in page.tsx where we can branch between the
 * canonical AMFI-code path (rich SEO + OG image) and the legacy
 * slug-name path.
 */

interface LayoutProps {
  children: React.ReactNode;
}

export default function FundDetailLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
