import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact Us | MeraSIP.com',
  description:
    'Get in touch with Trustner Asset Services for SIP investment guidance, portfolio reviews, or mutual fund queries. Reach us by phone, email, or visit our offices.',
  path: '/contact',
  keywords: [
    'contact MeraSIP',
    'contact Trustner',
    'mutual fund advisor contact',
    'SIP investment help',
    'Trustner phone number',
    'financial advisor India',
  ],
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
