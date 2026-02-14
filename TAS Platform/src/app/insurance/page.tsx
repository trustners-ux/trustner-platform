import { Metadata } from "next";
import Link from "next/link";
import { Heart, Shield, Car, Plane, ArrowRight, CheckCircle } from "lucide-react";
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

export default function InsurancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-700 py-16 text-white">
        <div className="container-custom text-center">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold">
            IRDAI Licensed Insurance Broker
          </span>
          <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
            Insurance That Protects What Matters
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-200">
            Compare plans from 30+ top insurers. Get the best coverage at the lowest price. Distributed by Trustner Insurance Brokers Private Limited.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="space-y-8">
          {INSURANCE_TYPES.map((insurance) => (
            <div key={insurance.title} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <div className="grid lg:grid-cols-5">
                <div className={`flex items-center justify-center bg-gradient-to-br ${insurance.color} p-8 lg:col-span-1`}>
                  <insurance.icon size={64} className="text-white" />
                </div>
                <div className="p-6 lg:col-span-4 lg:p-8">
                  <h2 className="mb-2 text-2xl font-extrabold text-gray-900">{insurance.title}</h2>
                  <p className="mb-4 text-gray-500">{insurance.description}</p>
                  <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {insurance.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle size={14} className="flex-shrink-0 text-positive" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Link href={insurance.href} className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-600">
                    Get Free Quote <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Insurance Disclaimer */}
        <div className="mt-8 rounded-xl bg-gray-100 p-4 text-center text-xs text-gray-500">
          <p>{REGULATORY.INSURANCE_DISCLAIMER}</p>
          <p className="mt-1">Distributed by {REGULATORY.INSURANCE_ENTITY}. {REGULATORY.IRDAI_LICENSE}</p>
        </div>
      </div>
    </div>
  );
}
