import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { PageTracker } from '@/components/analytics/PageTracker';
import { WhatsAppButton } from '@/components/sections/WhatsAppButton';
import { ChatWidget } from '@/components/sections/ChatWidget';
import { LeadCaptureModal } from '@/components/sections/LeadCaptureModal';
import { FloatingInvestCTA } from '@/components/sections/FloatingInvestCTA';
import { ContentProtection } from '@/components/security/ContentProtection';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Mera SIP Online | India\'s Most Intelligent SIP Learning & Research Hub | Trustner',
    template: '%s | Mera SIP Online by Trustner',
  },
  description:
    'India\'s most comprehensive SIP education platform. Learn SIP basics, advanced strategies, use smart calculators, research historical returns, and plan your financial goals. Free SIP calculator, step-up SIP, retirement planner & more.',
  keywords: [
    'SIP calculator',
    'what is SIP',
    'SIP meaning',
    'SIP returns',
    'best SIP plan',
    'SIP vs lump sum',
    'power of compounding',
    'step up SIP',
    'retirement SIP planning',
    'SIP taxation',
    'mutual fund SIP',
    'SIP investment',
    'SIP for beginners',
    'SIP goal planning',
    'Trustner',
    'Mera SIP Online',
  ],
  authors: [{ name: 'CFP Ram Shah', url: 'https://www.merasip.com/about' }],
  creator: 'Trustner',
  publisher: 'Trustner Asset Services Pvt. Ltd.',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.merasip.com',
    siteName: 'Mera SIP Online by Trustner',
    title: 'Mera SIP Online | India\'s Most Intelligent SIP Research Hub',
    description: 'Master SIP investing with India\'s most comprehensive education platform. Smart calculators, research-grade content, and goal planning tools.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mera SIP Online by Trustner',
    description: 'India\'s most intelligent SIP learning & research hub. Smart calculators, education, and goal planning.',
  },
  metadataBase: new URL('https://www.merasip.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#1A1A2E" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['EducationalOrganization', 'FinancialService'],
              name: 'Mera SIP Online by Trustner',
              alternateName: 'Mera SIP',
              url: 'https://www.merasip.com',
              description: 'India\'s most comprehensive SIP education and research platform by Trustner Asset Services.',
              foundingDate: '2014',
              numberOfEmployees: {
                '@type': 'QuantitativeValue',
                value: 100,
              },
              areaServed: {
                '@type': 'Country',
                name: 'India',
              },
              slogan: 'Start Your SIP. Build Your Wealth.',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Sethi Trust Building, Unit 2, 4th Floor, G S Road, Bhangagarh',
                addressLocality: 'Guwahati',
                addressRegion: 'Assam',
                postalCode: '781005',
                addressCountry: 'IN',
              },
              parentOrganization: {
                '@type': 'FinancialService',
                name: 'Trustner Asset Services Pvt. Ltd.',
                url: 'https://www.merasip.com',
              },
              founder: {
                '@type': 'Person',
                name: 'Ram Shah',
                jobTitle: 'Certified Financial Planner',
                url: 'https://www.merasip.com/about',
              },
              telephone: '+91-6003903737',
              email: 'wecare@merasip.com',
              sameAs: [
                'https://www.linkedin.com/company/trustner',
                'https://www.instagram.com/trustner',
                'https://twitter.com/trustner',
                'https://www.youtube.com/@trustner',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Mera SIP Online',
              url: 'https://www.merasip.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://www.merasip.com/glossary?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased bg-surface-100 text-primary-700">
        <GoogleAnalytics />
        <PageTracker />
        <ContentProtection />
        <Header />
        <main className="min-h-screen pt-24 lg:pt-[104px]">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
        <ChatWidget />
        <LeadCaptureModal />
        <FloatingInvestCTA />
      </body>
    </html>
  );
}
