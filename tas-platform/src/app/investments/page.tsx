import { Metadata } from "next";
import Link from "next/link";
import { Landmark, Coins, Building2, PiggyBank, Banknote, ArrowRight, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Investment Products - NPS, Gold, PPF, FD & More",
  description: "Explore investment options beyond mutual funds. NPS, Sovereign Gold Bonds, Digital Gold, PPF, Fixed Deposits. Plan your financial future with Trustner.",
};

const PRODUCTS = [
  { title: "National Pension System (NPS)", description: "Government-backed retirement savings scheme with tax benefits under Section 80CCD. Choose from multiple pension fund managers and asset allocation strategies.", href: "/investments/nps", icon: Landmark, color: "from-blue-500 to-blue-600", tag: "Tax Saver", features: ["Extra ₹50,000 deduction u/s 80CCD(1B)", "Tier I and Tier II accounts", "Multiple fund manager options", "Partial withdrawal allowed"] },
  { title: "Sovereign Gold Bonds (SGBs)", description: "Government securities denominated in grams of gold. Earn 2.5% annual interest plus capital appreciation linked to gold prices.", href: "/investments/sgb", icon: Coins, color: "from-amber-500 to-amber-600", tag: "Safe Haven", features: ["2.5% annual interest over gold price", "No capital gains tax on maturity", "Safer than physical gold", "Available during RBI-announced tranches"] },
  { title: "Digital Gold", description: "Buy and sell 24K gold online. Store it safely in insured vaults. Start with as little as ₹1. Convert to physical gold anytime.", href: "/investments/digital-gold", icon: Coins, color: "from-yellow-500 to-yellow-600", tag: "Flexible", features: ["Buy from ₹1", "24K purity guaranteed", "Insured vault storage", "Convert to physical gold or jewellery"] },
  { title: "Public Provident Fund (PPF)", description: "15-year government-backed savings scheme with guaranteed returns and tax benefits. One of the safest investment options in India.", href: "/investments/ppf", icon: PiggyBank, color: "from-green-500 to-green-600", tag: "Guaranteed", features: ["Current rate: 7.1% p.a.", "Tax-free returns (EEE status)", "15-year lock-in with extensions", "Max ₹1.5 Lakh per year"] },
  { title: "Fixed Deposits", description: "Compare FD rates across major banks and NBFCs. Get the best interest rates for your fixed deposit investments.", href: "/investments/fixed-deposits", icon: Banknote, color: "from-purple-500 to-purple-600", tag: "Stable", features: ["Compare rates across 20+ banks", "FD from leading NBFCs", "Senior citizen higher rates", "Flexible tenure options"] },
  { title: "GIFT City International Funds", description: "Coming soon — access global markets through India's first IFSC. USD-denominated funds for portfolio diversification.", href: "/gift-city", icon: Globe, color: "from-cyan-500 to-cyan-600", tag: "Coming Soon", features: ["Global market access", "USD-denominated", "Tax advantages", "IFSCA regulated"] },
];

export default function InvestmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">Investment Products</h1>
          <p className="text-gray-500">Explore a range of investment options to diversify your portfolio and achieve your financial goals.</p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="space-y-6">
          {PRODUCTS.map((product) => (
            <Link key={product.title} href={product.href} className="card-hover group block overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <div className="grid lg:grid-cols-5">
                <div className={`flex flex-col items-center justify-center bg-gradient-to-br ${product.color} p-6 text-white lg:col-span-1 lg:p-8`}>
                  <product.icon size={48} />
                  <span className="mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">{product.tag}</span>
                </div>
                <div className="p-6 lg:col-span-4">
                  <h2 className="mb-2 text-xl font-extrabold text-gray-900 group-hover:text-primary-500">{product.title}</h2>
                  <p className="mb-4 text-sm text-gray-500">{product.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {product.features.map((f) => (
                      <p key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" /> {f}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
