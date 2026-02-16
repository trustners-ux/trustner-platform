import { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  TrendingUp,
  Users,
  Award,
  Target,
  Heart,
  BadgeCheck,
  ChevronRight,
  ArrowRight,
  Building2,
  Globe,
  Lightbulb,
  Handshake,
  Eye,
  Scale,
  MessageCircle,
  Phone,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { COMPANY } from "@/lib/constants/company";
import { REGULATORY } from "@/lib/constants/regulatory";

export const metadata: Metadata = {
  title: "About Us - Trustner Asset Services & Insurance Brokers",
  description:
    "Learn about Trustner. AMFI registered mutual fund distributor (ARN-286886) and IRDAI licensed insurance broker. Your trusted financial partner.",
};

const HERO_STATS = [
  { value: "5,000+", label: "Mutual Funds", icon: TrendingUp },
  { value: "30+", label: "Insurance Partners", icon: Shield },
  { value: "ARN-286886", label: "AMFI Registered", icon: BadgeCheck },
  { value: "Pan-India", label: "Service Coverage", icon: Globe },
];

const JOURNEY_MILESTONES = [
  {
    title: "The Beginning",
    description:
      "Trustner was founded with a simple belief: every Indian deserves access to quality financial products and unbiased advice, regardless of their investment size.",
  },
  {
    title: "AMFI Registration",
    description:
      "Secured AMFI registration (ARN-286886) as a mutual fund distributor, enabling us to offer a curated selection of 5,000+ mutual fund schemes across all major AMCs.",
  },
  {
    title: "Insurance Broking",
    description:
      "Expanded into insurance broking with IRDAI licensing, partnering with 30+ top insurers to offer comprehensive Health, Life, Motor, and Travel insurance solutions.",
  },
  {
    title: "Technology & Scale",
    description:
      "Built a modern fintech platform with SIP calculators, fund comparison tools, risk profiling, and portfolio analytics to empower investors with data-driven decisions.",
  },
];

const VALUES = [
  {
    icon: Handshake,
    title: "Trust & Transparency",
    description:
      "We build relationships on honesty. Every recommendation is backed by data, and our fee structure is always transparent.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Users,
    title: "Client First",
    description:
      "Your financial goals drive every decision we make. We recommend what is best for you, not what pays us the highest commission.",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We leverage technology to make investing simpler. From AI-powered fund analysis to intuitive calculators, we keep building better tools.",
    color: "from-amber-500 to-amber-600",
  },
  {
    icon: Scale,
    title: "Regulatory Compliance",
    description:
      "Full compliance with SEBI, AMFI, and IRDAI regulations. We follow the highest standards of governance and investor protection.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Eye,
    title: "Unbiased Advice",
    description:
      "As a distributor and broker, we compare products across providers to find the right fit for your unique financial situation.",
    color: "from-rose-500 to-rose-600",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description:
      "Whether you are investing Rs.500 or Rs.5 Crore, we provide the same level of expert guidance and personalized service.",
    color: "from-cyan-500 to-cyan-600",
  },
];

export default function AboutPage() {
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
            <span className="text-white">About</span>
          </div>

          {/* Badge */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
              <BadgeCheck size={13} /> AMFI Registered
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
              <Shield size={13} /> IRDAI Licensed
            </span>
          </div>

          <h1 className="mb-4 text-3xl font-extrabold sm:text-4xl lg:text-5xl">
            Your Trusted Investment
            <br className="hidden sm:inline" /> & Insurance Partner
          </h1>
          <p className="mb-8 max-w-2xl text-gray-400 lg:text-lg">
            {COMPANY.description}
          </p>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <stat.icon size={18} className="text-primary-400" />
                </div>
                <p className="text-lg font-extrabold text-white sm:text-xl">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom py-12 lg:py-16">
        {/* Mission & Vision */}
        <div className="mb-16 grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-card transition-all hover:shadow-card-hover">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary-500 to-primary-600" />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
              <Target size={24} className="text-primary-500" />
            </div>
            <h2 className="mb-3 text-2xl font-extrabold text-gray-900">
              Our Mission
            </h2>
            <p className="leading-relaxed text-gray-600">
              To democratize access to quality financial products across India.
              We believe every Indian deserves expert financial guidance, whether
              they are investing Rs.500 or Rs.5 Crore. Through technology and
              personalized advice, we make investing simple, transparent, and
              accessible.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-card transition-all hover:shadow-card-hover">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent to-orange-500" />
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
              <Heart size={24} className="text-accent" />
            </div>
            <h2 className="mb-3 text-2xl font-extrabold text-gray-900">
              Our Vision
            </h2>
            <p className="leading-relaxed text-gray-600">
              To become India&apos;s most trusted fintech platform for
              investments and insurance. We envision a future where every Indian
              household has access to the right financial products, guided by
              unbiased advice and powered by technology.
            </p>
          </div>
        </div>

        {/* Our Journey */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <span className="mb-2 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-500">
              Our Journey
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Building Trust, One Step at a Time
            </h2>
          </div>
          <div className="relative">
            {/* Timeline line - visible on lg+ */}
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-100 lg:block" />
            <div className="space-y-6 lg:space-y-10">
              {JOURNEY_MILESTONES.map((milestone, idx) => (
                <div
                  key={milestone.title}
                  className={`relative flex flex-col lg:flex-row lg:items-center ${
                    idx % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Card */}
                  <div className="lg:w-[calc(50%-2rem)]">
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all hover:shadow-card-hover">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                          {idx + 1}
                        </span>
                        <h3 className="text-lg font-extrabold text-gray-900">
                          {milestone.title}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  {/* Timeline dot */}
                  <div className="hidden lg:flex lg:w-16 lg:justify-center">
                    <div className="h-4 w-4 rounded-full border-4 border-primary-500 bg-white" />
                  </div>
                  {/* Spacer */}
                  <div className="hidden lg:block lg:w-[calc(50%-2rem)]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The Trustner Group - Entity Cards */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <span className="mb-2 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-500">
              The Trustner Group
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Two Entities, One Mission
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              Trustner operates through two regulated entities to serve your
              complete financial needs.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* MF Entity */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:shadow-card-hover">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 to-blue-600" />
              <div className="p-8">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 shadow-lg shadow-primary-500/20">
                    <TrendingUp size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                      {COMPANY.mfEntity.name}
                    </h3>
                    <p className="text-sm font-semibold text-primary-500">
                      {COMPANY.mfEntity.type}
                    </p>
                  </div>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-gray-600">
                  Your trusted mutual fund distribution partner. We help you
                  navigate the world of mutual funds with expert guidance,
                  comprehensive fund analysis, and personalized investment
                  strategies across 5,000+ schemes from 40+ AMCs.
                </p>
                <div className="mb-5 grid grid-cols-2 gap-3">
                  {[
                    "5,000+ Mutual Funds",
                    "40+ AMC Partners",
                    "SIP from Rs.500",
                    "NISM Certified Advisors",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <BadgeCheck
                        size={14}
                        className="flex-shrink-0 text-primary-500"
                      />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-primary-50/70 p-3.5">
                  <p className="text-sm font-bold text-primary-600">
                    {REGULATORY.AMFI_ARN}
                  </p>
                  <p className="text-xs text-gray-500">
                    AMFI Registered Mutual Fund Distributor
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {REGULATORY.CIN_MF}
                  </p>
                </div>
              </div>
            </div>

            {/* Insurance Entity */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-all hover:shadow-card-hover">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600" />
              <div className="p-8">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20">
                    <Shield size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                      {COMPANY.insuranceEntity.name}
                    </h3>
                    <p className="text-sm font-semibold text-emerald-600">
                      {COMPANY.insuranceEntity.type}
                    </p>
                  </div>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-gray-600">
                  Licensed insurance broker offering Health, Life, Motor, and
                  Travel insurance from 30+ top insurers. We compare, advise,
                  and help you choose the right insurance protection for your
                  family and assets.
                </p>
                <div className="mb-5 grid grid-cols-2 gap-3">
                  {[
                    "30+ Insurance Partners",
                    "Health, Life, Motor, Travel",
                    "Dedicated Claims Support",
                    "Best Price Guarantee",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <BadgeCheck
                        size={14}
                        className="flex-shrink-0 text-emerald-500"
                      />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-emerald-50/70 p-3.5">
                  <p className="text-sm font-bold text-emerald-600">
                    {REGULATORY.IRDAI_LICENSE}
                  </p>
                  <p className="text-xs text-gray-500">
                    IRDAI Licensed Insurance Broker
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {REGULATORY.CIN_INSURANCE}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Locations */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <span className="mb-2 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-500">
              Our Presence
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Branch Locations
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              Serving clients across India with a growing network of offices.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMPANY.branches.map((branch) => (
              <div
                key={branch.city}
                className={`rounded-2xl border bg-white p-5 shadow-card transition-all hover:shadow-card-hover ${
                  branch.type === "head-office"
                    ? "border-primary-200 ring-1 ring-primary-100"
                    : branch.type === "coming-soon"
                    ? "border-dashed border-gray-200"
                    : "border-gray-100"
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <MapPin
                    size={16}
                    className={
                      branch.type === "head-office"
                        ? "text-primary-500"
                        : branch.type === "coming-soon"
                        ? "text-gray-400"
                        : "text-gray-500"
                    }
                  />
                  <h3 className="text-sm font-bold text-gray-900">
                    {branch.city}
                  </h3>
                  {branch.type === "head-office" && (
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-600">
                      Head Office
                    </span>
                  )}
                  {branch.type === "coming-soon" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{branch.state}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <span className="mb-2 inline-block rounded-full bg-primary-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-500">
              What Drives Us
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Our Core Values
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              These values are the foundation of everything we do at Trustner.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all hover:shadow-card-hover"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${value.color} shadow-lg`}
                >
                  <value.icon size={22} className="text-white" />
                </div>
                <h3 className="mb-2 text-base font-bold text-gray-900">
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Trustner */}
        <div className="mb-16 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] p-8 text-white lg:p-12">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Why Choose Trustner?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-400">
              We combine expertise, technology, and trust to deliver
              exceptional financial services.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Award,
                value: COMPANY.stats.yearsExperience,
                label: "Years of Experience",
                description: "Dedicated to helping Indians achieve financial goals",
              },
              {
                icon: Users,
                value: COMPANY.stats.clients,
                label: "Happy Clients",
                description: "Trusting us with their investments and insurance",
              },
              {
                icon: Building2,
                value: COMPANY.stats.amcPartners,
                label: "AMC Partners",
                description: "Offering the widest selection of mutual funds",
              },
              {
                icon: Shield,
                value: COMPANY.stats.claimSettlement,
                label: "Claim Settlement",
                description: "Ensuring your claims are processed quickly",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur"
              >
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <item.icon size={20} className="text-primary-400" />
                </div>
                <p className="text-2xl font-extrabold text-white">
                  {item.value}
                </p>
                <p className="mb-1 text-sm font-semibold text-gray-300">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Compliance */}
        <div className="mb-16">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 lg:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Regulatory Information
              </h2>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-100 bg-white p-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                    Mutual Fund Distribution
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {COMPANY.mfEntity.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {REGULATORY.AMFI_ARN}
                  </p>
                  <p className="text-xs text-gray-500">
                    {REGULATORY.CIN_MF}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-white p-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                    Insurance Broking
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {COMPANY.insuranceEntity.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {REGULATORY.IRDAI_LICENSE}
                  </p>
                  <p className="text-xs text-gray-500">
                    {REGULATORY.CIN_INSURANCE}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-100 bg-white p-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                    Registered Address
                  </p>
                  <p className="text-sm text-gray-700">
                    {COMPANY.address.full}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-white p-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                    CIN Numbers
                  </p>
                  <p className="text-sm text-gray-700">
                    {REGULATORY.CIN_MF}
                  </p>
                  <p className="text-sm text-gray-700">
                    {REGULATORY.CIN_INSURANCE}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-amber-100 bg-white p-4">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                  Compliance Officer
                </p>
                <p className="text-sm text-gray-700">
                  {REGULATORY.COMPLIANCE_OFFICER.name} |{" "}
                  <a
                    href={`mailto:${REGULATORY.COMPLIANCE_OFFICER.email}`}
                    className="text-primary-500 hover:underline"
                  >
                    {REGULATORY.COMPLIANCE_OFFICER.email}
                  </a>
                </p>
              </div>
              <div className="space-y-2 rounded-xl bg-white p-4">
                <p className="text-xs font-semibold text-amber-700">
                  {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}
                </p>
                <p className="text-[11px] text-gray-500">
                  {REGULATORY.INSURANCE_DISCLAIMER}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <div className="grid lg:grid-cols-5">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-8 text-white lg:col-span-2 lg:p-10">
              <h2 className="mb-3 text-2xl font-extrabold lg:text-3xl">
                Ready to Start Your Financial Journey?
              </h2>
              <p className="text-sm text-primary-200">
                Book a free consultation with our certified advisors. Whether
                you are starting with SIP or planning for retirement, we are
                here to guide you.
              </p>
            </div>
            <div className="flex flex-col items-start justify-center gap-4 p-8 lg:col-span-3 lg:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition hover:bg-primary-600"
                >
                  Book Free Consultation <ArrowRight size={16} />
                </Link>
                <a
                  href={`https://wa.me/${COMPANY.contact.whatsapp.replace(/[^0-9]/g, "")}?text=Hi%20Trustner,%20I%20would%20like%20to%20know%20more%20about%20your%20services.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-6 py-3.5 text-sm font-bold text-green-700 transition hover:bg-green-100"
                >
                  <MessageCircle size={16} /> WhatsApp Us
                </a>
                <a
                  href={`tel:${COMPANY.contact.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3.5 text-sm font-bold text-gray-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-500"
                >
                  <Phone size={16} /> {COMPANY.contact.phone}
                </a>
              </div>
              <p className="text-xs text-gray-400">
                Free consultation. No obligation. Your data is secure and never
                shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
