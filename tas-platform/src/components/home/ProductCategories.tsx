import Link from "next/link";
import {
  TrendingUp,
  Repeat,
  Heart,
  Shield,
  Car,
  Plane,
  Landmark,
  Coins,
  Globe,
  ArrowRight,
} from "lucide-react";

const PRODUCTS = [
  {
    icon: TrendingUp,
    title: "Mutual Funds",
    description: "Explore 5000+ funds across equity, debt & hybrid categories",
    href: "/mutual-funds",
    iconBg: "bg-blue-600",
  },
  {
    icon: Repeat,
    title: "SIP Investment",
    description: "Start with just ₹500/month. Build wealth systematically",
    href: "/calculators/sip",
    iconBg: "bg-green-600",
  },
  {
    icon: Heart,
    title: "Health Insurance",
    description: "Cashless treatment at 12,000+ hospitals. Compare plans",
    href: "/insurance/health",
    iconBg: "bg-red-600",
  },
  {
    icon: Shield,
    title: "Life Insurance",
    description: "Protect your family's future. Term plans from ₹490/month",
    href: "/insurance/life",
    iconBg: "bg-purple-600",
  },
  {
    icon: Car,
    title: "Motor Insurance",
    description: "Car & Bike insurance with instant policy issuance",
    href: "/insurance/motor",
    iconBg: "bg-emerald-600",
  },
  {
    icon: Plane,
    title: "Travel Insurance",
    description: "Domestic & international trip protection plans",
    href: "/insurance/travel",
    iconBg: "bg-indigo-600",
  },
  {
    icon: Landmark,
    title: "NPS & Retirement",
    description: "National Pension System for long-term retirement planning",
    href: "/investments/nps",
    iconBg: "bg-amber-600",
  },
  {
    icon: Coins,
    title: "Gold & More",
    description: "Sovereign Gold Bonds, Digital Gold, Fixed Deposits",
    href: "/investments",
    iconBg: "bg-yellow-600",
  },
];

export default function ProductCategories() {
  return (
    <section className="section-padding bg-surface-100">
      <div className="container-custom">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-500">
            Our Products
          </span>
          <h2 className="mb-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Everything You Need, One Platform
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-500">
            From mutual fund investments to insurance protection — manage all
            your financial products in one place.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="card-hover group rounded-2xl border border-gray-100 bg-white p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${product.iconBg}`}
                >
                  <product.icon size={24} className="text-white" />
                </div>
                <ArrowRight
                  size={18}
                  className="text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                {product.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {product.description}
              </p>
            </Link>
          ))}

          {/* GIFT City - Coming Soon */}
          <Link
            href="/gift-city"
            className="card-hover group relative rounded-2xl border border-gray-100 bg-white p-6"
          >
            <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Coming Soon
            </span>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600">
                <Globe size={24} className="text-white" />
              </div>
              <ArrowRight
                size={18}
                className="text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">GIFT City</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              International investments through GIFT City IFSC route
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
