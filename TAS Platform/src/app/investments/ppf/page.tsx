'use client';

import Link from 'next/link';
import { ChevronRight, Check, ArrowRight, Phone, Shield, Landmark } from 'lucide-react';

export default function PPFPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-green-900 via-emerald-800 to-green-800 text-white py-20">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-green-200 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/investments" className="hover:text-white">Investments</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">PPF</span>
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
              <Shield className="w-4 h-4" />
              Government Guaranteed
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Public Provident Fund <span className="text-green-300">(PPF)</span>
            </h1>
            <p className="text-lg text-green-100 mb-8">
              India&apos;s safest long-term savings instrument with guaranteed returns, sovereign guarantee,
              and complete tax exemption under EEE (Exempt-Exempt-Exempt) category.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="bg-white text-green-900 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-2">
                Open PPF Account <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:+919876543210" className="border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> Speak to Advisor
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">PPF Key Features</h2>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="space-y-3">
                  {[
                    { label: 'Current Interest Rate', value: '7.1% p.a. (Q1 FY25)', highlight: true },
                    { label: 'Lock-in Period', value: '15 years' },
                    { label: 'Extension', value: 'In blocks of 5 years after maturity' },
                    { label: 'Minimum Investment', value: '₹500 per year' },
                    { label: 'Maximum Investment', value: '₹1.5 Lakh per year' },
                    { label: 'Tax Benefit', value: 'Section 80C (up to ₹1.5 Lakh)' },
                    { label: 'Interest Earned', value: 'Tax-free' },
                    { label: 'Maturity Amount', value: 'Tax-free' },
                    { label: 'Loan Facility', value: 'From 3rd to 6th year' },
                    { label: 'Partial Withdrawal', value: 'From 7th year onwards' },
                    { label: 'Who Can Open', value: 'Indian residents (1 per person)' },
                    { label: 'Risk Level', value: 'Zero (Government Guaranteed)' },
                  ].map((item, idx) => (
                    <div key={idx} className={`flex justify-between py-2 border-b border-gray-100 last:border-0 ${item.highlight ? 'bg-green-50 -mx-2 px-2 rounded' : ''}`}>
                      <span className="text-gray-600 text-sm">{item.label}</span>
                      <span className={`font-semibold text-sm ${item.highlight ? 'text-green-700' : 'text-gray-900'}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                <h3 className="font-semibold text-green-900 mb-3">EEE Tax Benefit (Triple Exempt)</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-200 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">E1</div>
                    <div>
                      <p className="font-semibold text-green-900">Investment is Tax-Deductible</p>
                      <p className="text-sm text-green-700">Up to ₹1.5 Lakh deduction under Section 80C</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-200 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">E2</div>
                    <div>
                      <p className="font-semibold text-green-900">Interest is Tax-Free</p>
                      <p className="text-sm text-green-700">Annual interest earned is completely exempt from tax</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-200 text-green-800 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">E3</div>
                    <div>
                      <p className="font-semibold text-green-900">Maturity is Tax-Free</p>
                      <p className="text-sm text-green-700">Entire maturity amount is exempt from income tax</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">₹1.5 Lakh/year for 15 years at 7.1%</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Total Investment</span>
                    <span className="font-bold text-gray-900">₹22,50,000</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Interest Earned</span>
                    <span className="font-bold text-green-600">₹18,18,209</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200 pt-3">
                    <span className="text-gray-900 font-semibold">Maturity Value</span>
                    <span className="font-bold text-gray-900 text-lg">₹40,68,209</span>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    *Based on current rate of 7.1%. Rates are revised quarterly by the Government.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Pro Tip:</strong> Invest your PPF amount before the 5th of every month to earn interest
                  for that entire month. PPF interest is calculated on the minimum balance between the 5th and
                  the last day of each month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
