import { Metadata } from "next";
import HeroSection from "@/components/home/Hero";
import ProductCategories from "@/components/home/ProductCategories";
import MarketOverview from "@/components/home/MarketOverview";
import SIPCalculatorPreview from "@/components/home/SIPCalculatorPreview";
import NewsHighlights from "@/components/home/NewsHighlights";
import TrustSignals from "@/components/home/TrustSignals";
import Testimonials from "@/components/home/Testimonials";
import CTABanner from "@/components/home/CTABanner";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

export const metadata: Metadata = {
  title: "Trustner - AMFI Registered Mutual Fund Distributor & Insurance Broker",
  description:
    "Compare 5000+ mutual funds, start SIP with ₹500/month, get health & life insurance quotes. AMFI ARN-286886. SEBI compliant. Trusted by 10,000+ investors across India.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProductCategories />
      <MarketOverview />
      <SIPCalculatorPreview />
      <TrustSignals />
      <NewsHighlights />
      <Testimonials />
      <CTABanner />
      <SEBIDisclaimer variant="banner" />
    </>
  );
}
