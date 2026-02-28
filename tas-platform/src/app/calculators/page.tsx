import { Metadata } from "next";
import Link from "next/link";
import { Calculator, TrendingUp, TrendingDown, Repeat, ArrowRight, Receipt, Target, Sparkles, ChevronRight, Landmark, CreditCard, Shield, HeartPulse, GraduationCap, Users } from "lucide-react";
import SEBIDisclaimer from "@/components/compliance/SEBIDisclaimer";

export const metadata: Metadata = {
  title: "Financial Calculators - SIP, Retirement, EMI, Insurance, Tax & More",
  description: "12 free financial calculators. SIP, lumpsum, retirement, EMI, term insurance, health insurance, child education, HUF tax planner, goal planning, SWP, STP and tax calculator.",
};

const CALCULATORS = [
  { title: "SIP Calculator", description: "Calculate returns on your monthly SIP investments. See how compounding grows your wealth over time.", href: "/calculators/sip", icon: TrendingUp, color: "from-blue-600 to-blue-700", popular: true, category: "investment" },
  { title: "Retirement Calculator", description: "Plan your FIRE journey. Calculate corpus needed, required SIP, and year-by-year growth projections.", href: "/calculators/retirement", icon: Landmark, color: "from-indigo-600 to-indigo-700", popular: true, category: "planning" },
  { title: "EMI Calculator", description: "Calculate EMI for home, car, personal or education loans. Full amortization schedule with prepayment analysis.", href: "/calculators/emi", icon: CreditCard, color: "from-cyan-600 to-cyan-700", popular: true, category: "planning" },
  { title: "Lumpsum Calculator", description: "Calculate future value of one-time investments. Compare returns across different tenures and rates.", href: "/calculators/lumpsum", icon: Calculator, color: "from-emerald-600 to-emerald-700", popular: false, category: "investment" },
  { title: "Goal Planning", description: "Plan for child education, retirement, house purchase, or any financial goal. Get recommended monthly SIP.", href: "/calculators/goal", icon: Target, color: "from-amber-500 to-amber-600", popular: false, category: "planning" },
  { title: "Term Insurance Calculator", description: "Find your ideal life cover using HLV, income replacement or expense methods. Identify your insurance gap.", href: "/calculators/term-insurance", icon: Shield, color: "from-teal-600 to-teal-700", popular: false, category: "insurance" },
  { title: "Health Insurance Calculator", description: "Check if your health cover is adequate. City-wise medical cost analysis with family-adjusted recommendations.", href: "/calculators/health-insurance", icon: HeartPulse, color: "from-pink-600 to-pink-700", popular: false, category: "insurance" },
  { title: "Education Planner", description: "Plan for IIT, IIM, MBBS or study abroad. Calculate future costs and required monthly SIP investments.", href: "/calculators/education", icon: GraduationCap, color: "from-orange-500 to-orange-600", popular: false, category: "planning" },
  { title: "SWP Calculator", description: "Plan regular withdrawals from your mutual fund investments. See how long your corpus will last.", href: "/calculators/swp", icon: TrendingDown, color: "from-purple-600 to-purple-700", popular: false, category: "investment" },
  { title: "STP Calculator", description: "Calculate returns when transferring money systematically between two mutual fund schemes.", href: "/calculators/stp", icon: Repeat, color: "from-violet-600 to-violet-700", popular: false, category: "investment" },
  { title: "Tax Calculator", description: "Compare Old vs New tax regime. Calculate LTCG/STCG on mutual fund redemptions. Plan tax-efficient exits.", href: "/calculators/tax", icon: Receipt, color: "from-rose-600 to-rose-700", popular: false, category: "tax" },
  { title: "HUF Tax Planner", description: "Save taxes as a Hindu Undivided Family. Compare HUF vs individual filing and maximise family tax savings.", href: "/calculators/huf", icon: Users, color: "from-slate-600 to-slate-700", popular: false, category: "tax" },
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
