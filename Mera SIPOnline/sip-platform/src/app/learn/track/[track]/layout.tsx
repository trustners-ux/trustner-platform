import type { Metadata } from 'next';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { getTrackInfo } from '@/data/learn-tracks';
import type { LearnTrack } from '@/types/learning';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ track: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const { track } = await params;
  const info = getTrackInfo(track as LearnTrack);
  if (!info) {
    return generateSEOMetadata({
      title: 'Learning Track | Trustner',
      description: 'Investor education across mutual funds, SIF, PMS, AIF, GIFT City, international funds and insurance.',
      path: `/learn/track/${track}`,
    });
  }
  return generateSEOMetadata({
    title: `${info.name} (${info.shortName}) — Investor Foundation | Trustner Learn`,
    description: info.description,
    path: `/learn/track/${info.id}`,
    keywords: [
      info.name,
      info.shortName,
      `${info.name} for investors`,
      `${info.name} India`,
      `${info.shortName} explained`,
      `${info.shortName} foundation`,
      `Trustner ${info.shortName}`,
      `${info.name} regulation`,
    ],
  });
}

export default async function TrackLayout({ children, params }: LayoutProps) {
  const { track } = await params;
  const info = getTrackInfo(track as LearnTrack);
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Learn', url: '/learn' },
    { name: info?.name ?? 'Track', url: `/learn/track/${track}` },
  ]);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
