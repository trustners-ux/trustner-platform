import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'SIP Duration Optimizer | How Long to Reach Your Goal',
  description:
    'Find out how long your SIP needs to run to reach your financial target. Optimize SIP duration based on monthly amount, expected returns, and goal corpus.',
  path: '/calculators/duration-optimizer',
  keywords: [
    'SIP duration calculator',
    'SIP duration optimizer',
    'how long to invest SIP',
    'SIP tenure calculator',
    'SIP time to goal',
    'SIP period calculator',
    'investment duration planner',
    'SIP goal timeline calculator',
  ],
});

export default function DurationOptimizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
