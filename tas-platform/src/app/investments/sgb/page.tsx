'use client';

import Link from 'next/link';
import { ChevronRight, Check, ArrowRight, Phone, Shield, TrendingUp } from 'lucide-react';

export default function SGBPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      <section className="bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white py-20">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-gray-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/investments" className="hover:text-white transition-colors">Investments</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Sovereign Gold Bonds</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Sovereign Gold Bonds <span className="text-yellow-300">(SGB)</span>
            </h1>
            <p className="text-lg text-yellow-100 mb-8">
              Invest in gold the smart way. SGBs issued by the Reserve Bank of India offer gold price appreciation
              plus 2.5% annual interest — and zero capital gains tax if held till maturity.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="bg-white text-yellow-900 px-8 py-3 rounded-xl font-semibold hover:bg-yellow-50 transition-colors flex items-center gap-2">
                Invest in SGB <ArrowRight className="w-4 h-4" />
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Sovereign Gold Bonds?</h2>
              <div className="space-y-3">
                {[
                  'Issued by RBI on behalf of Government of India — zero default risk',
                  '2.5% annual interest (paid semi-annually) on top of gold price appreciation',
                  'No capital gains tax if held till maturity (8 years)',
                  'No storage cost, no making charges, no purity concerns',
                  'Can be traded on stock exchanges for liquidity',
                  'Available in demat or certificate form',
                  'Minimum investment: 1 gram of gold',
                  'Maximum investment: 4 kg per individual per financial year',
                  'Can be used as collateral for loans',
                  'Early exit allowed after 5 years on interest payment dates',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card hover:shadow-card-hover transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-4">SGB Key Details</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Issuer', value: 'Reserve Bank of India' },
                    { label: 'Tenor', value: '8 years (exit after 5th year)' },
                    { label: 'Interest Rate', value: '2.50% per annum (fixed)' },
                    { label: 'Interest Payment', value: 'Semi-annual' },
                    { label: 'Minimum Investment', value: '1 gram' },
                    { label: 'Maximum per FY', value: '4 kg (individuals), 20 kg (trusts)' },
                    { label: 'Tax on Interest', value: 'Taxable as per income slab' },
                    { label: 'Capital Gains', value: 'Exempt if held till maturity' },
                    { label: 'Tradeable', value: 'Yes, on stock exchanges' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-600 text-sm">{item.label}</span>
                      <span className="text-gray-900 font-semibold text-sm">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-6 shadow-card hover:shadow-card-hover transition-shadow">
                <h3 className="font-semibold text-yellow-900 mb-3">SGB vs Physical Gold vs Gold ETF</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-yellow-200">
                        <th className="text-left py-2 text-yellow-800">Feature</th>
                        <th className="text-center py-2 text-yellow-800">SGB</th>
                        <th className="text-center py-2 text-yellow-800">Physical</th>
                        <th className="text-center py-2 text-yellow-800">ETF</th>
                      </tr>
                    </thead>
                    <tbody className="text-yellow-900">
                      <tr className="border-b border-yellow-100">
                        <td className="py-2">Interest</td>
                        <td className="text-center">2.5%</td>
                        <td className="text-center">None</td>
                        <td className="text-center">None</td>
                      </tr>
                      <tr className="border-b border-yellow-100">
                        <td className="py-2">Storage</td>
                        <td className="text-center">Free</td>
                        <td className="text-center">Locker cost</td>
                        <td className="text-center">Free</td>
                      </tr>
                      <tr className="border-b border-yellow-100">
                        <td className="py-2">Making charges</td>
                        <td className="text-center">None</td>
                        <td className="text-center">5-15%</td>
                        <td className="text-center">None</td>
                      </tr>
                      <tr>
                        <td className="py-2">LTCG Tax</td>
                        <td className="text-center font-semibold">Exempt*</td>
                        <td className="text-center">20% + indexation</td>
                        <td className="text-center">20% + indexation</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-yellow-600 mt-2">*If held till maturity (8 years)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Interested in Sovereign Gold Bonds?</h2>
            <p className="text-yellow-200 mb-6 max-w-2xl mx-auto">
              SGBs are issued in tranches by RBI. We&apos;ll notify you when the next tranche opens and help you
              invest seamlessly. You can also buy existing SGBs on the stock exchange.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-yellow-900 px-8 py-3 rounded-xl font-semibold hover:bg-yellow-50 transition-colors">
              Register Interest <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
