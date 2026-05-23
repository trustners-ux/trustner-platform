import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Photo Gallery | MeraSIP.com',
  description:
    'Browse photos from Trustner Asset Services events, investor awareness programmes, team activities, and client meetups across India.',
  path: '/gallery',
  keywords: [
    'Trustner gallery',
    'MeraSIP photos',
    'investor awareness programme',
    'Trustner events',
    'mutual fund distributor gallery',
  ],
});

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
