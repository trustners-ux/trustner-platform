import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Retirement Bucket Strategy Calculator | Optimize Your Retirement Income',
  description:
    'Plan your retirement income using the 5-bucket strategy. Allocate your corpus across emergency, short-term, medium-term, growth, and equity buckets for maximum safety and returns. Free CFP-grade calculator.',
  path: '/calculators/bucket-strategy',
  keywords: [
    'bucket strategy calculator',
    'retirement bucket strategy',
    'retirement income planning',
    'systematic withdrawal strategy',
    'retirement corpus allocation',
    'bucket approach retirement',
    'retirement fund allocation',
    'retirement income optimization',
    'SWP vs bucket strategy',
    'pension planning calculator',
    'retirement planning India',
    'CFP retirement strategy',
  ],
});

export default function BucketStrategyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
