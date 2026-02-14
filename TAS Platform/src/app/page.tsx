import HeroSection from "@/components/home/Hero";
import ProductCategories from "@/components/home/ProductCategories";
import MarketOverview from "@/components/home/MarketOverview";
import SIPCalculatorPreview from "@/components/home/SIPCalculatorPreview";
import NewsHighlights from "@/components/home/NewsHighlights";
import TrustSignals from "@/components/home/TrustSignals";
import Testimonials from "@/components/home/Testimonials";
import CTABanner from "@/components/home/CTABanner";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProductCategories />
      <MarketOverview />
      <SIPCalculatorPreview />
      <NewsHighlights />
      <TrustSignals />
      <Testimonials />
      <CTABanner />
      <SEBIDisclaimer variant="banner" />
    </>
  );
}
