import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Trustner Asset Services | MeraSIP.com',
  description:
    'Learn about Trustner Asset Services Pvt Ltd (ARN-286886) — a SEBI-registered mutual fund distributor led by CFP Ram Shah. Offices in Guwahati, Tezpur, Bangalore, and Kolkata.',
  path: '/about',
  keywords: [
    'Trustner Asset Services',
    'about MeraSIP',
    'CFP Ram Shah',
    'mutual fund distributor India',
    'SEBI registered MFD',
    'ARN-286886',
    'Trustner Guwahati',
  ],
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
