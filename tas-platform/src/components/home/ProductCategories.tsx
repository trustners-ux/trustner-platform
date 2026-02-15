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
} from "lucide-react";

const PRODUCTS = [
  {
    icon: TrendingUp,
    title: "Mutual Funds",
    description: "Explore 5000+ funds across equity, debt & hybrid categories",
    href: "/mutual-funds",
    color: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
    iconBg: "bg-blue-600",
  },
  {
    icon: Repeat,
    title: "SIP Investment",
    description: "Start with just ₹500/month. Build wealth systematically",
    href: "/calculators/sip",
    color: "bg-green-50 text-green-600 group-hover:bg-green-100",
    iconBg: "bg-green-600",
  },
  {
    icon: Heart,
    title: "Health Insurance",
    description: "Cashless treatment at 12,000+ hospitals. Compare plans",
    href: "/insurance/health",
    color: "bg-red-50 text-red-600 group-hover:bg-red-100",
    iconBg: "bg-red-600",
  },
  {
    icon: Shield,
    title: "Life Insurance",
    description: "Protect your family's future. Term plans from ₹490/month",
    href: "/insurance/life",
    color: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
    iconBg: "bg-purple-600",
  },
  {
    icon: Car,
    title: "Motor Insurance",
    description: "Car & Bike insurance with instant policy issuance",
    href: "/insurance/motor",
    color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
    iconBg: "bg-emerald-600",
  },
  {
    icon: Plane,
    title: "Travel Insurance",
    description: "Domestic & international trip protection plans",
    href: "/insurance/travel",
    color: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
    iconBg: "bg-indigo-600",
  },
  {
    icon: Landmark,
    title: "NPS & Retirement",
    description: "National Pension System for long-term retirement planning",
    href: "/investments/nps",
    color: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
    iconBg: "bg-amber-600",
  },
  {
    icon: Coins,
    title: "Gold & More",
    description: "Sovereign Gold Bonds, Digital Gold, Fixed Deposits",
    href: "/investments",
    color: "bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100",
    iconBg: "bg-yellow-600",
  },
];

export default function ProductCategories() {
  return (
    <section className="section-padding bg-gray-50">
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
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${product.iconBg}`}
              >
                <product.icon size={24} className="text-white" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                {product.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">
                {product.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
