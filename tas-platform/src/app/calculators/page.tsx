import { Metadata } from "next";
import Link from "next/link";
import { Calculator, TrendingUp, TrendingDown, Repeat, ArrowRight, Receipt, Target, Sparkles, ChevronRight } from "lucide-react";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

export const metadata: Metadata = {
  title: "Financial Calculators - SIP, Lumpsum, SWP, Goal Planning, Tax",
  description: "Free financial calculators. SIP calculator, lumpsum calculator, SWP calculator, STP calculator, goal planning calculator, mutual fund tax calculator. Plan your investments.",
};

const CALCULATORS = [
  { title: "SIP Calculator", description: "Calculate returns on your monthly SIP investments. See how compounding grows your wealth over time.", href: "/calculators/sip", icon: TrendingUp, color: "from-blue-600 to-blue-700", popular: true },
  { title: "Lumpsum Calculator", description: "Calculate future value of one-time investments. Compare returns across different tenures and rates.", href: "/calculators/lumpsum", icon: Calculator, color: "from-emerald-600 to-emerald-700", popular: false },
  { title: "Goal Planning", description: "Plan for child education, retirement, house purchase, or any financial goal. Get recommended monthly SIP.", href: "/calculators/goal", icon: Target, color: "from-amber-500 to-amber-600", popular: false },
  { title: "SWP Calculator", description: "Plan regular withdrawals from your mutual fund investments. See how long your corpus will last.", href: "/calculators/swp", icon: TrendingDown, color: "from-purple-600 to-purple-700", popular: false },
  { title: "STP Calculator", description: "Calculate returns when transferring money systematically between two mutual fund schemes.", href: "/calculators/stp", icon: Repeat, color: "from-violet-600 to-violet-700", popular: false },
  { title: "Tax Calculator", description: "Compare Old vs New tax regime. Calculate LTCG/STCG on mutual fund redemptions. Plan tax-efficient exits.", href: "/calculators/tax", icon: Receipt, color: "from-rose-600 to-rose-700", popular: false },
];

export default function CalculatorsPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-10 lg:py-14">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white">Calculators</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Calculator size={20} />
            </div>
            <h1 className="text-3xl font-extrabold lg:text-4xl">Financial Calculators</h1>
          </div>
          <p className="max-w-xl text-gray-400">
            Free tools to help you plan your investments and achieve your financial goals. All calculations are for illustration purposes only.
          </p>
        </div>
      </div>

      <div className="container-custom py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATORS.map((calc) => (
            <Link
              key={calc.href}
              href={calc.href}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              {calc.popular && (
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">
                  <Sparkles size={10} /> Most Popular
                </div>
              )}
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${calc.color} shadow-lg`}>
                <calc.icon size={22} className="text-white" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-primary-500 transition-colors">
                {calc.title}
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-gray-500">
                {calc.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-500 transition-all group-hover:gap-2.5">
                Calculate Now <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        {/* Compliance Note */}
        <div className="mt-10 rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-center">
          <p className="text-xs leading-relaxed text-gray-500">
            These calculators are for illustration and educational purposes only. Actual returns may vary based on market conditions.
            Past performance is not indicative of future results. Please consult a financial advisor before making investment decisions.
          </p>
        </div>
      </div>
      <SEBIDisclaimer variant="banner" />
    </div>
  );
}
