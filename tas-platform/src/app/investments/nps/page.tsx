'use client';

import Link from 'next/link';
import { ChevronRight, Shield, Check, TrendingUp, Landmark, ArrowRight, Phone } from 'lucide-react';
import { SEBI_MUTUAL_FUND_DISCLAIMER } from '@/lib/constants/regulatory';

export default function NPSPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      <section className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white py-20">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/investments" className="hover:text-white transition-colors">Investments</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">NPS</span>
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
              <Landmark className="w-4 h-4" />
              Government of India Initiative
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              National Pension System <span className="text-blue-300">(NPS)</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              Build a retirement corpus with market-linked returns and additional tax savings of up to ₹50,000
              under Section 80CCD(1B) — over and above the ₹1.5 lakh limit under Section 80C.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="bg-white text-blue-900 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
                Open NPS Account <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:+916003903737" className="border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> Talk to Advisor
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What is NPS?</h2>
              <p className="text-gray-600 mb-4">
                The National Pension System is a voluntary, long-term retirement savings scheme regulated by PFRDA
                (Pension Fund Regulatory and Development Authority). It allows subscribers to contribute regularly
                during their working years to build a retirement corpus.
              </p>
              <p className="text-gray-600 mb-6">
                At retirement (age 60), you can withdraw up to 60% of the corpus as a lump sum (tax-free) and
                the remaining 40% must be used to purchase an annuity that provides regular pension income.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">NPS Account Types</h3>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-card hover:shadow-card-hover transition-shadow">
                  <h4 className="font-semibold text-gray-900">Tier I (Mandatory)</h4>
                  <p className="text-sm text-gray-600 mt-1">Primary retirement account with tax benefits. Withdrawal restrictions until age 60. Min ₹500/month.</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-card hover:shadow-card-hover transition-shadow">
                  <h4 className="font-semibold text-gray-900">Tier II (Voluntary)</h4>
                  <p className="text-sm text-gray-600 mt-1">Flexible savings account with no lock-in. No tax benefits (except for govt employees). Min ₹250/month.</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tax Benefits</h2>
              <div className="space-y-4">
                {[
                  { section: 'Sec 80CCD(1)', amount: '₹1.5 Lakh', desc: 'Employer contribution or self contribution up to 10% of salary (included in 80C limit)' },
                  { section: 'Sec 80CCD(1B)', amount: '₹50,000', desc: 'Additional deduction exclusively for NPS — over and above 80C limit' },
                  { section: 'Sec 80CCD(2)', amount: '14% of Salary', desc: 'Employer\'s contribution (no limit cap for tax benefit)' },
                  { section: 'On Maturity', amount: '60% Tax-Free', desc: 'Lump sum withdrawal of up to 60% is completely tax-free' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-card hover:shadow-card-hover transition-shadow flex items-start gap-4">
                    <div className="bg-blue-100 rounded-xl p-2 text-center min-w-[80px]">
                      <p className="text-xs text-blue-600 font-medium">{item.section}</p>
                      <p className="text-sm font-bold text-blue-800">{item.amount}</p>
                    </div>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Maximum tax saving:</strong> Up to ₹2 Lakh per year (₹1.5L under 80C + ₹50K under 80CCD(1B)).
                  This translates to tax savings of up to ₹62,400 in the 30% bracket.
                </p>
              </div>
            </div>
          </div>

          {/* Asset Classes */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">NPS Asset Classes</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { class: 'Class E', name: 'Equity', desc: 'Invests in equity markets. Higher risk, higher return potential.', risk: 'High', color: 'blue' },
                { class: 'Class C', name: 'Corporate Bonds', desc: 'Invests in corporate debt securities. Moderate risk.', risk: 'Moderate', color: 'green' },
                { class: 'Class G', name: 'Government Bonds', desc: 'Invests in government securities. Low risk.', risk: 'Low', color: 'yellow' },
                { class: 'Class A', name: 'Alternative Assets', desc: 'Invests in REITs, InvITs, etc. Moderate risk.', risk: 'Moderate', color: 'purple' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-card hover:shadow-card-hover transition-shadow">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-${item.color}-100 text-${item.color}-700`}>
                    {item.class}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.desc}</p>
                  <p className="text-xs text-gray-500">Risk: {item.risk}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Your NPS Journey?</h2>
            <p className="text-blue-200 mb-6 max-w-2xl mx-auto">
              Our experts will help you choose the right fund manager, asset allocation, and guide you through the
              entire NPS account opening process.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-blue-900 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
