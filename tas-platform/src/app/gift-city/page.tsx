import { Metadata } from "next";
import Link from "next/link";
import { Globe, TrendingUp, Shield, ArrowRight, Building2, Landmark } from "lucide-react";

export const metadata: Metadata = {
  title: "GIFT City Funds - International Investment from India",
  description: "Invest in international funds through GIFT City IFSC. Access global markets, USD-denominated funds, and diversify beyond India.",
};

export default function GIFTCityPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1a2744] to-[#0F172A] py-20 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, #4C9AFF 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        </div>
        <div className="container-custom relative text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-5 py-2 text-sm font-bold text-amber-400">
            <Globe size={16} /> Coming Soon
          </span>
          <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl lg:text-6xl">
            Invest Globally from
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
              GIFT City, India
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-300">
            Access international markets through India&apos;s first IFSC. Diversify your portfolio with USD-denominated funds, global equities, and more.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* What is GIFT City */}
        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-extrabold text-gray-900">What is GIFT City IFSC?</h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              GIFT (Gujarat International Finance Tec-City) in Gandhinagar is India&apos;s first and only International Financial Services Centre (IFSC), regulated by IFSCA (International Financial Services Centres Authority).
            </p>
            <p className="text-gray-600 leading-relaxed">
              GIFT City allows Indian and global investors to access international financial products in a globally competitive regulatory and tax environment, right from India.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Globe, title: "Global Access", desc: "Invest in US, Europe, Asia markets" },
              { icon: TrendingUp, title: "Tax Benefits", desc: "Favorable tax treatment under IFSC" },
              { icon: Shield, title: "IFSCA Regulated", desc: "Robust regulatory framework" },
              { icon: Building2, title: "USD Denominated", desc: "Invest in dollar-based funds" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-100 bg-white p-5">
                <item.icon size={24} className="mb-3 text-primary-500" />
                <h3 className="mb-1 font-bold text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Register Interest */}
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-700 p-8 text-center text-white lg:p-12">
          <Landmark size={48} className="mx-auto mb-4 text-primary-200" />
          <h2 className="mb-3 text-2xl font-extrabold">Be the First to Know</h2>
          <p className="mx-auto mb-6 max-w-lg text-primary-200">
            We&apos;re building our GIFT City fund offerings. Register your interest and we&apos;ll notify you as soon as international funds are available on Trustner.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-primary transition hover:bg-gray-100">
            Register Interest <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
