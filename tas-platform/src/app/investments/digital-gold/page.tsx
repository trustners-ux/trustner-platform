'use client';

import Link from 'next/link';
import { ChevronRight, Check, ArrowRight, Phone, Shield, Gem } from 'lucide-react';

export default function DigitalGoldPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-amber-700 via-yellow-700 to-orange-700 text-white py-20">
        <div className="container-custom">
          <div className="flex items-center gap-2 text-amber-200 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/investments" className="hover:text-white">Investments</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Digital Gold</span>
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
              <Gem className="w-4 h-4" />
              24K 99.9% Pure Gold
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Buy <span className="text-yellow-300">Digital Gold</span> Online
            </h1>
            <p className="text-lg text-amber-100 mb-8">
              Start investing in 24K pure gold from as little as ₹1. Buy, sell, or convert to physical gold —
              anytime, anywhere. Your gold is stored in secure, insured vaults.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="bg-white text-amber-900 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors flex items-center gap-2">
                Start Buying Gold <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:+919876543210" className="border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Digital Gold?</h2>
              <div className="space-y-3">
                {[
                  'Buy 24K, 99.9% pure gold — certified and hallmarked',
                  'Start from just ₹1 — no minimum investment',
                  'Buy by amount (₹) or weight (grams)',
                  'Gold stored in secure, insured vaults by MMTC-PAMP or Augmont',
                  'Convert to physical gold (coins/bars) anytime',
                  'Sell anytime at live market prices — instant payment',
                  'No making charges, no storage charges',
                  'Use as collateral for gold loans',
                  'Track real-time gold prices',
                  'Set price alerts and auto-invest via Gold SIP',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">How It Works</h3>
                <div className="space-y-6">
                  {[
                    { step: '01', title: 'Buy Gold', desc: 'Enter amount or grams you want to buy. Pay securely via UPI, net banking, or card.' },
                    { step: '02', title: 'Gold is Stored', desc: 'Physical gold is purchased and stored in insured MMTC-PAMP/Augmont vaults.' },
                    { step: '03', title: 'Track & Grow', desc: 'View your gold holdings anytime. Set up Gold SIP for regular accumulation.' },
                    { step: '04', title: 'Sell or Convert', desc: 'Sell at live prices for instant credit, or get physical gold delivered.' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-800 text-sm flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <h3 className="font-semibold text-amber-900 mb-3">Gold SIP</h3>
                <p className="text-sm text-amber-800 mb-3">
                  Set up a monthly Gold SIP to accumulate gold gradually. This helps you average out the purchase
                  price over time, similar to how SIP works for mutual funds.
                </p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Start from ₹100/month</li>
                  <li>• Automatic monthly purchase</li>
                  <li>• Benefit from rupee cost averaging</li>
                  <li>• Pause or stop anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gray-100 border-t">
        <div className="container-custom">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Disclaimer:</strong> Gold prices are subject to market fluctuations. Past returns do not
            guarantee future performance. Digital gold is not regulated by SEBI or RBI. The gold is stored
            by third-party vault operators (MMTC-PAMP/Augmont). Please read all terms and conditions
            before investing.
          </p>
        </div>
      </section>
    </div>
  );
}
