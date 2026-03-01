"use client";

import {
  ShieldCheck,
  Award,
  Users,
  Building2,
  BadgeCheck,
  TrendingUp,
} from "lucide-react";

const COMPLIANCE_BADGES = [
  {
    icon: Award,
    label: "AMFI Registered",
    detail: "ARN-286886",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: ShieldCheck,
    label: "IRDAI Licensed",
    detail: "License 1067",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: BadgeCheck,
    label: "SEBI Compliant",
    detail: "Mutual Fund Distributor",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
];

const WHY_TRUSTNER = [
  {
    icon: TrendingUp,
    title: "Planning-First Approach",
    description:
      "We believe in understanding your financial life before recommending any product. Our AI analyzes 6 dimensions of your finances.",
  },
  {
    icon: Users,
    title: "Expert-Backed Technology",
    description:
      "Built by financial professionals and technologists. Our algorithms are based on CFP-level planning frameworks adapted for Indian markets.",
  },
  {
    icon: Building2,
    title: "Regulated & Transparent",
    description:
      "AMFI registered, IRDAI licensed. Every recommendation comes with full regulatory compliance and transparent disclosures.",
  },
];

export default function AuthoritySection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#132240] to-[#0A1628] py-16 sm:py-20">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container-custom relative">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Why Trust Us
          </p>
          <h2 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
            Built by Financial Experts,
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Trustner Asset Services Pvt. Ltd. combines decades of financial
            expertise with cutting-edge AI technology to deliver CFP-quality
            financial planning — accessible to everyone, absolutely free.
          </p>
        </div>

        {/* Compliance Badges */}
        <div className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-4">
          {COMPLIANCE_BADGES.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
            >
              <div className={`rounded-lg ${badge.bg} p-2`}>
                <badge.icon size={18} className={badge.color} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{badge.label}</p>
                <p className="text-[10px] text-gray-400">{badge.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Why Trustner */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {WHY_TRUSTNER.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-blue-500/30 hover:bg-white/10"
            >
              <div className="inline-flex rounded-xl bg-blue-500/20 p-2.5">
                <item.icon size={20} className="text-blue-400" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Founder note */}
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
          <p className="text-sm italic leading-relaxed text-gray-300">
            &ldquo;Every Indian family deserves access to professional-grade
            financial planning. We built Trustner to democratize financial advice
            — using AI to deliver what used to cost ₹15,000-25,000, completely
            free.&rdquo;
          </p>
          <p className="mt-3 text-xs font-bold text-white">
            — Trustner Team
          </p>
          <p className="text-[10px] text-gray-500">
            Trustner Asset Services Pvt. Ltd.
          </p>
        </div>
      </div>
    </section>
  );
}
