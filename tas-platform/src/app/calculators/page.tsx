import { Metadata } from "next";
import Link from "next/link";
import { Calculator, TrendingUp, TrendingDown, Repeat, ArrowRight, Receipt } from "lucide-react";

export const metadata: Metadata = {
  title: "Financial Calculators - SIP, Lumpsum, SWP, Tax",
  description: "Free financial calculators. SIP calculator, lumpsum calculator, SWP calculator, STP calculator, mutual fund tax calculator. Plan your investments.",
};

const CALCULATORS = [
  { title: "SIP Calculator", description: "Calculate returns on your monthly SIP investments. See how compounding grows your wealth.", href: "/calculators/sip", icon: TrendingUp, color: "bg-blue-600" },
  { title: "Lumpsum Calculator", description: "Calculate future value of one-time investments. Compare returns across different tenures.", href: "/calculators/lumpsum", icon: Calculator, color: "bg-green-600" },
  { title: "SWP Calculator", description: "Plan regular withdrawals from your mutual fund investments for steady income.", href: "/calculators/swp", icon: TrendingDown, color: "bg-purple-600" },
  { title: "STP Calculator", description: "Calculate returns when transferring money systematically between two mutual fund schemes.", href: "/calculators/stp", icon: Repeat, color: "bg-orange-600" },
  { title: "Tax Calculator", description: "Calculate LTCG and STCG tax on your mutual fund redemptions. Plan tax-efficient exits.", href: "/calculators/tax", icon: Receipt, color: "bg-red-600" },
];

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="container-custom py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">Financial Calculators</h1>
          <p className="text-gray-500">Free tools to help you plan your investments and financial goals.</p>
        </div>
      </div>
      <div className="container-custom py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATORS.map((calc) => (
            <Link key={calc.href} href={calc.href} className="card-hover group rounded-2xl border border-gray-100 bg-white p-6">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${calc.color}`}>
                <calc.icon size={24} className="text-white" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-primary-500">{calc.title}</h2>
              <p className="mb-4 text-sm leading-relaxed text-gray-500">{calc.description}</p>
              <span className="flex items-center gap-1 text-sm font-bold text-primary-500">
                Calculate Now <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
