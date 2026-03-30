import type { Metadata } from 'next';
import { COMPANY } from '@/lib/constants/company';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params;

  // Extract a readable name from the slug (remove scheme code prefix)
  const parts = slug.split('-');
  const nameFromSlug = parts.length > 1
    ? parts.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : slug;

  return {
    title: `${nameFromSlug} - ${COMPANY.platform}`,
    description: `View detailed analysis, NAV history, returns, expense ratio, and peer comparison for ${nameFromSlug}. Research mutual funds on ${COMPANY.platform}.`,
    openGraph: {
      title: `${nameFromSlug} | Fund Detail - ${COMPANY.platform}`,
      description: `Detailed mutual fund analysis including returns, NAV chart, key metrics, and peer comparison for ${nameFromSlug}.`,
      type: 'website',
      siteName: COMPANY.platform,
    },
  };
}

export default function FundDetailLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
