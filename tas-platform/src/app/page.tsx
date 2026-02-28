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
  title: "Trustner - India's First AI-Powered Financial Planner | Free Financial Plan",
  description:
    "Create a comprehensive financial plan in 15 minutes — free. AI-powered retirement planning, insurance gap analysis, tax optimization, goal-based investing. 12 free calculators. AMFI ARN-286886. IRDAI License 1067.",
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
