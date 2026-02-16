'use client';

import Link from 'next/link';
import { ChevronRight, ArrowRight, Phone, Shield, Check, AlertCircle } from 'lucide-react';

const FD_RATES = [
  { bank: 'SBI', general: '7.10%', senior: '7.60%', tenure: '1-2 years' },
  { bank: 'HDFC Bank', general: '7.15%', senior: '7.65%', tenure: '1-2 years' },
  { bank: 'ICICI Bank', general: '7.10%', senior: '7.60%', tenure: '1-2 years' },
  { bank: 'Axis Bank', general: '7.10%', senior: '7.60%', tenure: '1-2 years' },
  { bank: 'Bajaj Finance', general: '8.25%', senior: '8.50%', tenure: '2-3 years' },
  { bank: 'Mahindra Finance', general: '8.00%', senior: '8.35%', tenure: '2-3 years' },
  { bank: 'Shriram Finance', general: '8.46%', senior: '8.96%', tenure: '2-3 years' },
  { bank: 'PNB Housing', general: '7.75%', senior: '8.00%', tenure: '1-2 years' },
];

export default function FixedDepositsPage() {
  return (
    <div className="min-h-screen bg-surface-100">
      <section className="bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 text-white py-20">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/investments" className="hover:text-white">Investments</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Fixed Deposits</span>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Fixed Deposits <span className="text-blue-300">& Corporate FDs</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Compare fixed deposit rates from top banks and NBFCs. Get up to 8.96% interest rate with
              corporate FDs from AAA-rated companies. Senior citizens get additional 0.25-0.50% premium.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="bg-white text-gray-900 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2">
                Compare FD Rates <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:+919876543210" className="border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> Speak to Advisor
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Current FD Interest Rates</h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700">Bank / NBFC</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">General Rate</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Senior Citizen</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-700">Best Tenure</th>
                  </tr>
                </thead>
                <tbody>
                  {FD_RATES.map((fd, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-gray-900">{fd.bank}</td>
                      <td className="py-4 px-6 text-center font-semibold text-blue-600">{fd.general}</td>
                      <td className="py-4 px-6 text-center font-semibold text-green-600">{fd.senior}</td>
                      <td className="py-4 px-6 text-center text-gray-600">{fd.tenure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 p-4 border-t border-gray-100">
              *Rates are indicative and subject to change. Last updated: February 2025. Please verify current rates before investing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Types of Fixed Deposits</h3>
              <div className="space-y-4">
                {[
                  { name: 'Bank FD', desc: 'Traditional FDs from banks. Covered under DICGC insurance up to ₹5 Lakh per depositor.', color: 'blue' },
                  { name: 'Corporate FD', desc: 'Higher rates from NBFCs (Bajaj, Shriram). Check credit rating before investing.', color: 'green' },
                  { name: 'Tax-Saver FD', desc: '5-year lock-in FD with tax benefit under Section 80C. Available at all banks.', color: 'purple' },
                  { name: 'Flexi FD', desc: 'FD linked to savings account. Auto-sweep excess balance for higher returns.', color: 'orange' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-card hover:shadow-card-hover transition-shadow">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">FD vs Debt Mutual Funds</h3>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-gray-500">Feature</th>
                        <th className="text-center py-2 text-gray-500">FD</th>
                        <th className="text-center py-2 text-gray-500">Debt MF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feat: 'Returns', fd: 'Fixed (7-8.5%)', mf: 'Variable (7-10%)' },
                        { feat: 'Liquidity', fd: 'Penalty on early exit', mf: 'No penalty (open-ended)' },
                        { feat: 'Taxation', fd: 'As per income slab', mf: 'As per income slab' },
                        { feat: 'Capital Safety', fd: 'Very High', mf: 'High (some risk)' },
                        { feat: 'Inflation Beating', fd: 'Marginal', mf: 'Better potential' },
                      ].map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700 font-medium">{row.feat}</td>
                          <td className="py-2 text-center text-gray-600">{row.fd}</td>
                          <td className="py-2 text-center text-gray-600">{row.mf}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 rounded-2xl border border-amber-200 p-4 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800">
                      <strong>Important:</strong> Corporate FDs are not covered under DICGC insurance.
                      Always check the credit rating (AAA/AA+) and the financial health of the NBFC before investing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
