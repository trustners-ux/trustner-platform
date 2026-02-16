import { Metadata } from "next";
import Link from "next/link";
import { Heart, Shield, Car, Plane, ArrowRight, CheckCircle, ChevronRight, BadgeCheck, Users, Headphones, TrendingDown } from "lucide-react";
import { REGULATORY } from "@/lib/constants/regulatory";

export const metadata: Metadata = {
  title: "Insurance - Health, Life, Motor, Travel Insurance",
  description: "Compare and buy insurance online. Health, Life, Motor & Travel insurance from 30+ top insurers. Get best quotes instantly. Trustner Insurance Brokers.",
};

const INSURANCE_TYPES = [
  { title: "Health Insurance", description: "Complete health coverage for you and your family. Cashless treatment at 12,000+ hospitals across India.", href: "/insurance/health", icon: Heart, color: "from-red-500 to-red-600", features: ["Cashless Hospitalization", "No Claim Bonus", "Pre & Post Hospitalization", "Day Care Procedures", "Maternity Coverage", "Free Health Check-ups"] },
  { title: "Life Insurance", description: "Secure your family's financial future with comprehensive term and life insurance plans.", href: "/insurance/life", icon: Shield, color: "from-blue-500 to-blue-600", features: ["High Sum Assured", "Tax Benefits u/s 80C", "Accidental Death Benefit", "Critical Illness Cover", "Waiver of Premium", "Flexible Premium Payment"] },
  { title: "Motor Insurance", description: "Hassle-free car and bike insurance with instant policy issuance and quick claim settlement.", href: "/insurance/motor", icon: Car, color: "from-green-500 to-green-600", features: ["Instant Policy", "Cashless Repairs at 6,000+ garages", "NCB Transfer", "Zero Depreciation Cover", "Engine Protection", "24/7 Roadside Assistance"] },
  { title: "Travel Insurance", description: "Trip protection for domestic and international travel. Medical emergencies, trip cancellation and more.", href: "/insurance/travel", icon: Plane, color: "from-purple-500 to-purple-600", features: ["Medical Emergency Cover", "Trip Cancellation/Delay", "Baggage Loss/Delay", "Flight Delay Compensation", "Adventure Sports Cover", "Visa Rejection Cover"] },
];

const VALUE_PROPS = [
  { icon: Users, title: "Expert Guidance", description: "Personalized advice from certified insurance advisors" },
  { icon: TrendingDown, title: "Compare Plans", description: "Compare plans from 30+ top insurance companies" },
  { icon: Headphones, title: "Hassle-Free Claims", description: "Dedicated claims support for quick settlement" },
  { icon: BadgeCheck, title: "IRDAI Licensed", description: "Trustner Insurance Brokers — licensed and compliant" },
];

export default function InsurancePage() {
  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white">
        <div className="container-custom py-12 lg:py-16">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-white">Home</Link>
            <ChevronRight size={14} />
            <span className="text-white">Insurance</span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              <BadgeCheck size={13} /> IRDAI Licensed Insurance Broker
            </span>
          </div>
          <h1 className="mb-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            Insurance That Protects<br className="hidden sm:inline" /> What Matters Most
          </h1>
          <p className="max-w-xl text-gray-400">
            Compare plans from 30+ top insurers. Get the best coverage at the lowest price. Distributed by Trustner Insurance Brokers Private Limited.
          </p>
        </div>
      </div>

      <div className="container-custom py-10">
        {/* Insurance Cards */}
        <div className="space-y-6">
          {INSURANCE_TYPES.map((insurance) => (
            <div key={insurance.title} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:shadow-card-hover">
              <div className="grid lg:grid-cols-5">
                <div className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br ${insurance.color} p-8 text-white lg:col-span-1`}>
                  <insurance.icon size={48} strokeWidth={1.5} />
                  <span className="text-sm font-bold">{insurance.title}</span>
                </div>
                <div className="p-6 lg:col-span-4 lg:p-8">
                  <h2 className="mb-2 text-xl font-extrabold text-gray-900 lg:text-2xl">{insurance.title}</h2>
                  <p className="mb-5 text-sm text-gray-500">{insurance.description}</p>
                  <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {insurance.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} className="flex-shrink-0 text-positive" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={insurance.href} className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-600">
                      Explore Plans <ArrowRight size={16} />
                    </Link>
                    <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-500">
                      Get Free Quote
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Why Trustner */}
        <div className="mt-12">
          <h2 className="mb-6 text-center text-2xl font-extrabold text-gray-900">Why Buy Insurance Through Trustner?</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((vp) => (
              <div key={vp.title} className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                  <vp.icon size={22} className="text-primary-500" />
                </div>
                <h3 className="font-bold text-gray-900">{vp.title}</h3>
                <p className="text-xs text-gray-500">{vp.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Insurance Compliance */}
        <div className="mt-10 space-y-3">
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-center">
            <p className="text-xs font-semibold text-gray-600">{REGULATORY.INSURANCE_DISCLAIMER}</p>
            <p className="mt-1.5 text-[11px] text-gray-500">
              Distributed by {REGULATORY.INSURANCE_ENTITY}. {REGULATORY.IRDAI_LICENSE}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
