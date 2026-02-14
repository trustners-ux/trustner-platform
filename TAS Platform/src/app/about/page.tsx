import { Metadata } from "next";
import { Shield, TrendingUp, Users, Award, Target, Heart, BadgeCheck } from "lucide-react";
import { COMPANY } from "@/lib/constants/company";
import { REGULATORY } from "@/lib/constants/regulatory";

export const metadata: Metadata = {
  title: "About Us - Trustner Asset Services & Insurance Brokers",
  description: "Learn about Trustner. AMFI registered mutual fund distributor (ARN-286886) and IRDAI licensed insurance broker. Your trusted financial partner.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-700 py-16 text-white">
        <div className="container-custom text-center">
          <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">About Trustner</h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-200">{COMPANY.description}</p>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Mission & Vision */}
        <div className="mb-16 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-8">
            <Target size={32} className="mb-4 text-primary-500" />
            <h2 className="mb-3 text-2xl font-extrabold text-gray-900">Our Mission</h2>
            <p className="leading-relaxed text-gray-600">
              To democratize access to quality financial products across India. We believe every Indian deserves expert financial guidance, whether they are investing ₹500 or ₹5 Crore. Through technology and personalized advice, we make investing simple, transparent, and accessible.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-8">
            <Heart size={32} className="mb-4 text-accent" />
            <h2 className="mb-3 text-2xl font-extrabold text-gray-900">Our Vision</h2>
            <p className="leading-relaxed text-gray-600">
              To become India&apos;s most trusted fintech platform for investments and insurance. We envision a future where every Indian household has access to the right financial products, guided by unbiased advice and powered by technology.
            </p>
          </div>
        </div>

        {/* Two Entities */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-extrabold text-gray-900">The Trustner Group</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border-2 border-primary-100 bg-white p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500"><TrendingUp size={24} className="text-white" /></div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">{COMPANY.mfEntity.name}</h3>
                  <p className="text-sm text-primary-500">{COMPANY.mfEntity.type}</p>
                </div>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                Your trusted mutual fund distribution partner. We help you navigate the world of mutual funds with expert guidance, comprehensive fund analysis, and personalized investment strategies.
              </p>
              <div className="rounded-lg bg-primary-50 p-3 text-sm">
                <span className="font-bold text-primary-500">{REGULATORY.AMFI_ARN}</span> | AMFI Registered Mutual Fund Distributor
              </div>
            </div>

            <div className="rounded-2xl border-2 border-green-100 bg-white p-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600"><Shield size={24} className="text-white" /></div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">{COMPANY.insuranceEntity.name}</h3>
                  <p className="text-sm text-green-600">{COMPANY.insuranceEntity.type}</p>
                </div>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                Licensed insurance broker offering Health, Life, Motor, and Travel insurance from 30+ top insurers. We compare, advise, and help you choose the right insurance protection for your family.
              </p>
              <div className="rounded-lg bg-green-50 p-3 text-sm">
                <span className="font-bold text-green-600">{REGULATORY.IRDAI_LICENSE}</span> | IRDAI Licensed Insurance Broker
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-3xl font-extrabold text-gray-900">Why Choose Trustner?</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BadgeCheck, title: "Regulatory Compliance", desc: "AMFI registered (ARN-286886) and IRDAI licensed. Full compliance with SEBI regulations.", color: "bg-blue-600" },
              { icon: Users, title: "Expert Guidance", desc: "Certified financial advisors with NISM qualification to guide your investment decisions.", color: "bg-green-600" },
              { icon: Shield, title: "Unbiased Advice", desc: "We recommend what's best for you, not what pays us the highest commission.", color: "bg-purple-600" },
              { icon: TrendingUp, title: "Technology Driven", desc: "Modern tools for fund comparison, SIP calculators, and portfolio analytics.", color: "bg-orange-600" },
              { icon: Award, title: "Pan-India Service", desc: "Serving clients across India and globally. Multi-language support coming soon.", color: "bg-red-600" },
              { icon: Heart, title: "Client First", desc: "Your financial goals are our priority. Personalized strategies for every life stage.", color: "bg-cyan-600" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-white p-6">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon size={24} className="text-white" />
                </div>
                <h3 className="mb-2 font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory Details */}
        <div className="rounded-2xl bg-gray-100 p-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Regulatory Information</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Mutual Fund Distribution:</strong> {COMPANY.mfEntity.name} | {REGULATORY.AMFI_ARN}</p>
            <p><strong>Insurance Broking:</strong> {COMPANY.insuranceEntity.name} | {REGULATORY.IRDAI_LICENSE}</p>
            <p><strong>Compliance Officer:</strong> {REGULATORY.COMPLIANCE_OFFICER.name} | {REGULATORY.COMPLIANCE_OFFICER.email}</p>
            <p>{REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}</p>
            <p>{REGULATORY.INSURANCE_DISCLAIMER}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
