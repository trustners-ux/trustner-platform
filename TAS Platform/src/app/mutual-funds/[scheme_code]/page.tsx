import { Metadata } from "next";
import FundDetailView from "@/components/mutual-funds/FundDetailView";
import { MOCK_TOP_FUNDS } from "@/data/mock-funds";

interface Props {
  params: Promise<{ scheme_code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scheme_code } = await params;
  const fund = MOCK_TOP_FUNDS.find(
    (f) => f.schemeCode === Number(scheme_code)
  );
  return {
    title: fund ? `${fund.schemeName} - NAV, Returns, Details` : "Fund Details",
    description: fund
      ? `${fund.schemeName} by ${fund.amcName}. NAV: ₹${fund.nav}. 1Y Returns: ${fund.returns?.oneYear}%. Compare and invest.`
      : "Mutual fund details, NAV, returns, and portfolio analysis.",
  };
}

export default async function FundDetailPage({ params }: Props) {
  const { scheme_code } = await params;
  return <FundDetailView schemeCode={scheme_code} />;
}
