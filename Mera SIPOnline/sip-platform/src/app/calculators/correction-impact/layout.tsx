import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Market Correction Impact Calculator | Crash Simulator',
  description:
    'Simulate how market corrections and crashes impact your SIP portfolio. Visualize recovery timelines and see why continuing SIP during downturns builds long-term wealth.',
  path: '/calculators/correction-impact',
  keywords: [
    'market correction calculator',
    'market crash impact SIP',
    'SIP during market crash',
    'crash simulator calculator',
    'market downturn SIP impact',
    'portfolio crash recovery',
    'SIP correction impact',
    'bear market SIP calculator',
  ],
});

export default function CorrectionImpactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
