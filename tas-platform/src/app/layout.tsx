import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/layout/TopBar";
import Header from "@/components/layout/Header";
import MarketTicker from "@/components/layout/MarketTicker";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/ui/FloatingCTA";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trustner - AMFI Registered Mutual Fund Distributor | Invest in Mutual Funds, Insurance & More",
    template: "%s | Trustner",
  },
  description:
    "India's trusted AMFI registered mutual fund distributor and IRDAI licensed insurance broker. Compare 5000+ mutual funds, start SIP, get insurance quotes, plan your financial future. ARN-286886.",
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
    "mutual fund SIP",
    "best mutual funds India",
    "NPS investment",
    "tax saving investment",
    "wealth management India",
  ],
  authors: [{ name: "Trustner Asset Services Pvt. Ltd." }],
  creator: "Trustner",
  publisher: "Trustner Asset Services Pvt. Ltd.",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://wealthyhub.in",
    siteName: "Trustner",
    title: "Trustner - Your Trusted Investment & Insurance Partner",
    description:
      "Compare mutual funds, start SIP, get insurance quotes. One platform for all your financial needs. AMFI ARN-286886.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trustner - Investments & Insurance",
    description:
      "Compare mutual funds, start SIP, get insurance quotes. AMFI ARN-286886.",
  },
  metadataBase: new URL("https://wealthyhub.in"),
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
        <meta name="theme-color" content="#0A1628" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FinancialService",
              name: "Trustner Asset Services Pvt. Ltd.",
              alternateName: "Trustner",
              url: "https://wealthyhub.in",
              description:
                "AMFI registered mutual fund distributor and IRDAI licensed insurance broker. One platform for investments and insurance.",
              telephone: "+91-6003903737",
              email: "wecare@wealthyhub.in",
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
        <Header />
        <MarketTicker />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <FloatingCTA />
      </body>
    </html>
  );
}
