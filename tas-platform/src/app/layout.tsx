import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/layout/TopBar";
import Header from "@/components/layout/Header";
import MarketTicker from "@/components/layout/MarketTicker";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trustner - Your Trusted Investment & Insurance Partner",
    template: "%s | Trustner",
  },
  description:
    "India's trusted platform for mutual fund investments and insurance. Compare funds, start SIP, get insurance quotes. AMFI ARN-286886.",
  keywords: [
    "mutual fund distributor India",
    "SIP investment",
    "compare mutual funds",
    "health insurance",
    "life insurance",
    "ELSS tax saving",
    "financial planning India",
    "Trustner",
    "AMFI registered",
    "insurance broker",
  ],
  authors: [{ name: "Trustner Asset Services Pvt. Ltd." }],
  creator: "Trustner",
  publisher: "Trustner Asset Services Pvt. Ltd.",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://trustner.in",
    siteName: "Trustner",
    title: "Trustner - Your Trusted Investment & Insurance Partner",
    description:
      "Compare mutual funds, start SIP, get insurance quotes. One platform for all your financial needs.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trustner - Investments & Insurance",
    description:
      "Compare mutual funds, start SIP, get insurance quotes. AMFI ARN-286886.",
  },
  metadataBase: new URL("https://trustner.in"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#0F172A" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FinancialService",
              name: "Trustner Asset Services Pvt. Ltd.",
              alternateName: "Trustner",
              url: "https://trustner.in",
              description:
                "AMFI registered mutual fund distributor and IRDAI licensed insurance broker. One platform for investments and insurance.",
              telephone: "+91-1800-XXX-XXXX",
              email: "hello@trustner.in",
              address: {
                "@type": "PostalAddress",
                addressCountry: "IN",
              },
              sameAs: [
                "https://www.linkedin.com/company/trustner",
                "https://www.instagram.com/trustner",
                "https://twitter.com/trustner",
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <TopBar />
        <MarketTicker />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
