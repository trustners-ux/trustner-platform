import { Metadata } from "next";
import Link from "next/link";
import {
  Landmark,
  Coins,
  PiggyBank,
  Banknote,
  ArrowRight,
  Globe,
  ChevronRight,
  BadgeCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { REGULATORY } from "@/lib/constants/regulatory";

export const metadata: Metadata = {
  title: "Investment Products - NPS, Gold, PPF, FD & More | Trustner",
  description:
    "Explore investment options beyond mutual funds. NPS, Sovereign Gold Bonds, Digital Gold, PPF, Fixed Deposits. Plan your financial future with Trustner.",
  keywords: [
    "NPS investment",
    "sovereign gold bonds",
    "digital gold",
    "PPF",
    "fixed deposits India",
    "GIFT City funds",
  ],
};

const PRODUCTS = [
  {
    title: "National Pension System (NPS)",
    description:
      "Government-backed retirement savings scheme with tax benefits under Section 80CCD. Choose from multiple pension fund managers and asset allocation strategies.",
    href: "/investments/nps",
    icon: Landmark,
    color: "from-blue-500 to-indigo-600",
    tag: "Tax Saver",
    features: [
      "Extra ₹50,000 deduction u/s 80CCD(1B)",
      "Tier I and Tier II accounts",
      "Multiple fund manager options",
      "60% tax-free withdrawal at maturity",
    ],
  },
  {
    title: "Sovereign Gold Bonds (SGBs)",
    description:
      "Government securities denominated in grams of gold. Earn 2.5% annual interest plus capital appreciation linked to gold prices.",
    href: "/investments/sgb",
    icon: Coins,
    color: "from-amber-500 to-amber-600",
    tag: "Safe Haven",
    features: [
      "2.5% annual interest over gold price",
      "No capital gains tax on maturity",
      "Safer than physical gold",
      "Available during RBI-announced tranches",
    ],
  },
  {
    title: "Digital Gold",
    description:
      "Buy and sell 24K gold online. Store it safely in insured vaults. Start with as little as ₹1. Convert to physical gold anytime.",
    href: "/investments/digital-gold",
    icon: Sparkles,
    color: "from-yellow-500 to-orange-500",
    tag: "Flexible",
    features: [
      "Buy from ₹1",
      "24K purity guaranteed",
      "Insured vault storage",
      "Convert to physical gold or jewellery",
    ],
  },
  {
    title: "Public Provident Fund (PPF)",
    description:
      "15-year government-backed savings scheme with guaranteed returns and tax benefits. One of the safest investment options in India.",
    href: "/investments/ppf",
    icon: PiggyBank,
    color: "from-emerald-500 to-green-600",
    tag: "Guaranteed",
    features: [
      "Current rate: 7.1% p.a.",
      "Tax-free returns (EEE status)",
      "15-year lock-in with extensions",
      "Max ₹1.5 Lakh per year",
    ],
  },
  {
    title: "Fixed Deposits",
    description:
      "Compare FD rates across major banks and NBFCs. Get the best interest rates for your fixed deposit investments.",
    href: "/investments/fixed-deposits",
    icon: Banknote,
    color: "from-purple-500 to-violet-600",
    tag: "Stable",
    features: [
      "Compare rates across 20+ banks",
      "FD from leading NBFCs",
      "Senior citizen higher rates",
      "Flexible tenure options",
    ],
  },
  {
    title: "GIFT City International Funds",
    description:
      "Access global markets through India's first IFSC. USD-denominated funds for portfolio diversification.",
    href: "/gift-city",
    icon: Globe,
    color: "from-cyan-500 to-teal-600",
    tag: "Coming Soon",
    features: [
      "Global market access",
      "USD-denominated",
      "Tax advantages under IFSC",
      "IFSCA regulated",
    ],
  },
];

const STATS = [
  { value: "6+", label: "Product Categories" },
  { value: "Tax-Free", label: "PPF & SGB Returns" },
  { value: "₹1", label: "Min. Digital Gold" },
  { value: "8.96%", label: "Best FD Rate" },
];

export default function InvestmentsPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-12 lg:py-20">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-white">Investments</span>
          </div>

          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
            <BadgeCheck size={13} /> AMFI Registered | {REGULATORY.AMFI_ARN}
          </div>

          <h1 className="mb-4 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            Investment Products
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              {" "}Beyond Mutual Funds
            </span>
          </h1>
          <p className="mb-8 max-w-2xl text-gray-400 lg:text-lg">
            Diversify your portfolio with NPS, Sovereign Gold Bonds, Digital
            Gold, PPF, and Fixed Deposits. Each product serves a unique role in
            building long-term wealth.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <p className="text-lg font-extrabold text-white sm:text-xl">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container-custom py-10 lg:py-14">
        <div className="space-y-5">
          {PRODUCTS.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:shadow-card-hover"
            >
              <div className="grid lg:grid-cols-5">
                {/* Left icon strip */}
                <div
                  className={`flex flex-row items-center gap-4 bg-gradient-to-br ${product.color} p-5 text-white lg:col-span-1 lg:flex-col lg:justify-center lg:p-6`}
                >
                  <product.icon size={40} className="flex-shrink-0 lg:mx-auto" />
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                    {product.tag}
                  </span>
                </div>

                {/* Right content */}
                <div className="p-6 lg:col-span-4">
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-gray-900 transition group-hover:text-primary-500">
                      {product.title}
                    </h2>
                    <ArrowRight
                      size={16}
                      className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-primary-500"
                    />
                  </div>
                  <p className="mb-4 text-sm leading-relaxed text-gray-500">
                    {product.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {product.features.map((f) => (
                      <p
                        key={f}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                        {f}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] p-8 text-center text-white lg:p-12">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <TrendingUp size={28} className="text-primary-400" />
            </div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Not Sure Where to Start?
            </h2>
            <p className="text-sm text-gray-400">
              Take our free Risk Profile Quiz to discover the right investment
              mix for your goals, or speak with our certified advisors for
              personalized guidance.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/risk-profile"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-lg transition hover:bg-gray-100"
              >
                Take Risk Profile Quiz <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Talk to Advisor
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="text-xs font-semibold text-amber-700">
            {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            Investment in securities is subject to market risk. Past performance
            is not indicative of future results. Please read all scheme-related
            documents carefully before investing.
          </p>
        </div>
      </div>
    </div>
  );
}
