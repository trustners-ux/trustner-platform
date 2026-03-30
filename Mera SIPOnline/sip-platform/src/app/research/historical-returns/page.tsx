'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, Info, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const historicalData = [
  { period: '5 Years', nifty: 12.5, largeCap: 13.2, midCap: 15.8, smallCap: 18.1 },
  { period: '10 Years', nifty: 13.8, largeCap: 14.5, midCap: 17.2, smallCap: 19.5 },
  { period: '15 Years', nifty: 14.2, largeCap: 15.1, midCap: 16.8, smallCap: 18.9 },
  { period: '20 Years', nifty: 14.8, largeCap: 15.6, midCap: 17.5, smallCap: 19.2 },
];

const sipStartScenarios = [
  { started: 'Jan 2005', invested: '₹24L', currentValue: '₹1.42 Cr', cagr: '15.2%', status: 'excellent' },
  { started: 'Jan 2008 (Pre-crash)', invested: '₹24L', currentValue: '₹1.18 Cr', cagr: '13.1%', status: 'great' },
  { started: 'Oct 2008 (During crash)', invested: '₹24L', currentValue: '₹1.58 Cr', cagr: '16.4%', status: 'best' },
  { started: 'Jan 2010 (Post-recovery)', invested: '₹24L', currentValue: '₹98L', cagr: '12.8%', status: 'good' },
  { started: 'Jan 2015', invested: '₹12L', currentValue: '₹23.5L', cagr: '14.5%', status: 'great' },
  { started: 'Jan 2020 (Pre-COVID)', invested: '₹6L', currentValue: '₹8.9L', cagr: '15.8%', status: 'excellent' },
];

export default function HistoricalReturnsPage() {
  return (
    <>
      <section className="bg-hero-pattern text-white py-12">
        <div className="container-custom">
          <Link href="/research" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3">Historical SIP Returns</h1>
          <p className="text-slate-300 max-w-2xl">Data-backed analysis of SIP performance across 10, 15, and 20-year periods in Indian equity markets.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-5xl">
          {/* Key Finding */}
          <div className="bg-positive-50 border border-positive-100 rounded-xl p-6 mb-10 flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-positive shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-primary-700 mb-1">Zero Negative Returns in 10-Year SIPs</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Historical data shows that no 10-year SIP in the Nifty 50 has ever delivered negative returns, regardless of when it was started.
                The minimum 10-year SIP CAGR has been approximately 7-8%, and the average has been 12-15%.
              </p>
            </div>
          </div>

          {/* Historical Returns Chart */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-1">Average SIP CAGR by Category & Period</h2>
            <p className="text-sm text-slate-500 mb-6">Based on historical data of Indian equity mutual funds</p>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip formatter={(value: number) => [`${value}%`, '']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="nifty" name="Nifty 50" fill="#0F766E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="largeCap" name="Large Cap" fill="#E8553A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="midCap" name="Mid Cap" fill="#D4A017" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="smallCap" name="Small Cap" fill="#D4A017" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SIP Entry Point Analysis */}
          <div className="card-base overflow-hidden mb-8">
            <div className="p-5 border-b border-surface-200">
              <h2 className="font-bold text-primary-700">₹10,000/Month SIP — Entry Point Analysis</h2>
              <p className="text-xs text-slate-500 mt-1">How SIPs started at different market phases performed (in a Nifty 50 index fund, 20-year horizon where applicable)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">SIP Started</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Total Invested</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Current Value</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">XIRR/CAGR</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {sipStartScenarios.map((s, i) => (
                    <tr key={s.started} className={i % 2 === 0 ? 'bg-white' : 'bg-surface-50'}>
                      <td className="px-5 py-3 font-medium text-primary-700">{s.started}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{s.invested}</td>
                      <td className="px-5 py-3 text-right font-semibold text-positive">{s.currentValue}</td>
                      <td className="px-5 py-3 text-right font-semibold text-brand">{s.cagr}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          s.status === 'best' ? 'bg-positive-50 text-positive' :
                          s.status === 'excellent' ? 'bg-brand-50 text-brand' :
                          s.status === 'great' ? 'bg-brand-50 text-brand' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Takeaways */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-positive" />
              Key Takeaways
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'SIPs started during or just before market crashes delivered the BEST long-term returns',
                'No 10-year SIP in Nifty 50 has ever delivered negative returns',
                'Mid-cap and small-cap SIPs outperform over longer periods but with higher volatility',
                'The difference between best and worst SIP entry points narrows significantly after 15+ years',
                'Consistency matters more than timing — all SIPs eventually delivered positive returns',
                'Step-up SIPs would have generated even higher returns in all scenarios',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface-100 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-positive shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-brand-50 rounded-lg p-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              <strong className="text-primary-700">Note:</strong> These figures are illustrative and based on approximate historical data of Indian equity markets.
              Actual returns vary by specific fund, market conditions, and investment period. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
