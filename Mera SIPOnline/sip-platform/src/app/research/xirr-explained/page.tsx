'use client';

import Link from 'next/link';
import { ArrowLeft, PieChart, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function XIRRPage() {
  return (
    <>
      <section className="bg-hero-pattern text-white py-12">
        <div className="container-custom">
          <Link href="/research" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Research
          </Link>
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-3">XIRR Explained: The Correct Way to Calculate SIP Returns</h1>
          <p className="text-slate-300 max-w-2xl">Why CAGR is misleading for SIP and how XIRR gives the true picture of your investment performance.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          {/* Why CAGR fails */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-primary-700 mb-1">Why CAGR Does NOT Work for SIP</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                CAGR assumes a single lump sum investment at the beginning. But SIP has multiple investments on different dates.
                Using CAGR for SIP drastically underestimates your actual returns because it ignores that later installments have been
                invested for a shorter duration.
              </p>
            </div>
          </div>

          {/* What is XIRR */}
          <div className="card-base p-6 mb-8">
            <h2 className="text-xl font-bold text-primary-700 mb-3">What is XIRR?</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              XIRR (Extended Internal Rate of Return) is the correct method to calculate returns on SIP investments.
              It accounts for the exact date and amount of each cash flow (SIP installment and redemption), giving you the
              true annualized return on your investment.
            </p>
            <div className="bg-primary-700 text-white rounded-lg p-5 font-mono text-sm">
              <p className="text-slate-300 text-xs mb-2">XIRR finds the rate (r) that satisfies:</p>
              <p>0 = Sum of [ Cash Flow(i) / (1 + r)^((Date(i) - Date(0)) / 365) ]</p>
              <p className="text-slate-400 text-xs mt-2">Where each SIP installment is a negative cash flow and redemption is positive</p>
            </div>
          </div>

          {/* Example */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-4">CAGR vs XIRR — A Practical Example</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-red-50 rounded-lg p-5">
                <h3 className="font-semibold text-red-600 mb-3">Using CAGR (Incorrect)</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>Total invested: ₹12,00,000 (₹10,000/month × 10 years)</p>
                  <p>Current value: ₹23,23,391</p>
                  <p>CAGR = (23,23,391 / 12,00,000)^(1/10) - 1</p>
                  <p className="font-bold text-red-600 text-lg mt-2">CAGR = 6.83%</p>
                  <p className="text-xs text-red-500 mt-1">This is WRONG — makes SIP look like FD returns!</p>
                </div>
              </div>
              <div className="bg-positive-50 rounded-lg p-5">
                <h3 className="font-semibold text-positive mb-3">Using XIRR (Correct)</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>Same investment: ₹10,000/month × 10 years</p>
                  <p>Same current value: ₹23,23,391</p>
                  <p>XIRR accounts for each monthly installment date</p>
                  <p className="font-bold text-positive text-lg mt-2">XIRR = 12.00%</p>
                  <p className="text-xs text-positive mt-1">This is the TRUE return on your SIP!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Why the difference */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-4">Why Such a Big Difference?</h2>
            <div className="space-y-3">
              {[
                'CAGR treats ₹12L as if it was all invested on Day 1. But only ₹10,000 was invested on Day 1.',
                'Your last SIP installment was invested for just 1 month, not 10 years. CAGR ignores this.',
                'XIRR weights each installment by its actual investment duration, giving the true picture.',
                'The average holding period of SIP installments is about half the total period, not the full period.',
                'XIRR is the industry standard for SIP return calculation used by all mutual fund platforms.',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          {/* How to calculate */}
          <div className="card-base p-6 mb-8">
            <h2 className="font-bold text-primary-700 mb-4">How to Calculate XIRR for Your SIP</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-primary-700 text-sm">List all cash flows</h4>
                  <p className="text-sm text-slate-500">Each SIP installment as negative (outflow) and current value as positive (inflow)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-primary-700 text-sm">Note exact dates</h4>
                  <p className="text-sm text-slate-500">The date of each SIP installment and today&apos;s date for current value</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-primary-700 text-sm">Use Excel/Google Sheets</h4>
                  <p className="text-sm text-slate-500">=XIRR(cash_flows, dates) function gives you the annualized return directly</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-primary-700 text-sm">Or check your fund statement</h4>
                  <p className="text-sm text-slate-500">Most mutual fund platforms now show XIRR directly in your portfolio dashboard</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 rounded-lg p-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              <strong className="text-primary-700">Key Takeaway:</strong> Always use XIRR to evaluate your SIP returns.
              CAGR significantly underestimates SIP performance and can lead to wrong conclusions about your investment.
              All professional financial platforms use XIRR as the standard metric.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
