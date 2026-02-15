import { Metadata } from "next";
import FundExplorer from "@/components/mutual-funds/FundExplorer";

export const metadata: Metadata = {
  title: "Explore Mutual Funds - Compare & Invest",
  description:
    "Explore 5000+ mutual funds across Equity, Debt, Hybrid categories. Compare returns, NAV, risk. Start SIP from ₹500. AMFI ARN-286886.",
};

export default function MutualFundsPage() {
  return <FundExplorer />;
}
