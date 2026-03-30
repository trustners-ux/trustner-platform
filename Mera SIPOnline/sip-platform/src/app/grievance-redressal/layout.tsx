import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Investor Grievance Redressal | Complaint Resolution | Mera SIP Online',
  description:
    'Investor grievance redressal mechanism for mutual fund complaints. Step-by-step complaint process through Trustner, AMFI, and SEBI SCORES portal.',
  path: '/grievance-redressal',
  keywords: [
    'investor grievance redressal',
    'mutual fund complaint',
    'SEBI SCORES',
    'AMFI complaint',
    'investor complaint process',
    'mutual fund grievance India',
  ],
});

export default function GrievanceRedressalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
