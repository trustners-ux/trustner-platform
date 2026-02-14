import { Metadata } from "next";
import SIPCalculatorFull from "@/components/calculators/SIPCalculator";

export const metadata: Metadata = {
  title: "SIP Calculator - Calculate Returns on Systematic Investment",
  description:
    "Free SIP calculator. Calculate expected returns on your monthly SIP investment. See how ₹500/month can grow. Plan your wealth journey with Trustner.",
};

export default function SIPCalculatorPage() {
  return <SIPCalculatorFull />;
}
