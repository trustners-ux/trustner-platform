import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Cost of Delay Calculator | How Much Does Waiting Cost You?',
  description:
    'See the real cost of delaying your investments by 1, 3, 5, or 10 years. Visualize how procrastination destroys wealth with powerful compound interest charts.',
  path: '/calculators/delay-cost',
  keywords: [
    'cost of delay calculator',
    'delay investing cost',
    'procrastination cost',
    'start investing early',
    'compound interest delay',
    'SIP delay cost',
    'investment delay calculator',
  ],
});

export default function DelayCostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
