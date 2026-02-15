'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Heart, ChevronRight, Check, Umbrella,
  TrendingUp, ArrowRight, Phone, Clock, BadgeCheck
} from 'lucide-react';
import { INSURANCE_ENTITY, IRDAI_LICENSE, INSURANCE_DISCLAIMER } from '@/lib/constants/regulatory';

const LIFE_PLANS = [
  {
    name: 'Term Life Insurance',
    icon: Shield,
    tag: 'Most Popular',
    description: 'Pure protection plan offering high cover at lowest premiums. Pays sum assured to nominee in case of death during policy term.',
    coverRange: '₹50 Lakh - ₹5 Crore',
    startingPremium: '₹490/month',
    features: [
      'Highest coverage at lowest premium',
      'Cover up to age 85',
      'Critical illness rider available',
      'Accidental death benefit rider',
      'Premium waiver on disability',
      'Tax benefit under Section 80C & 10(10D)',
    ],
  },
  {
    name: 'Endowment Plan',
    icon: TrendingUp,
    tag: 'Savings',
    description: 'Combines life insurance protection with guaranteed savings. Get maturity benefit if you survive the policy term.',
    coverRange: '₹5 Lakh - ₹1 Crore',
    startingPremium: '₹3,000/month',
    features: [
      'Guaranteed maturity benefit',
      'Life cover throughout policy term',
      'Bonus additions each year',
      'Loan facility against policy',
      'Ideal for long-term savings goals',
      'Tax benefits under Section 80C',
    ],
  },
  {
    name: 'ULIP (Unit Linked Insurance Plan)',
    icon: TrendingUp,
    tag: 'Market-Linked',
    description: 'Life insurance with market-linked investment. Choose from equity, debt, or balanced funds based on your risk appetite.',
    coverRange: '₹10 Lakh - ₹2 Crore',
    startingPremium: '₹5,000/month',
    features: [
      'Market-linked returns potential',
      'Switch between equity & debt funds',
      'Life insurance protection',
      '5-year lock-in period',
      'Partial withdrawal after lock-in',
      'Tax-free maturity under 10(10D)',
    ],
  },
  {
    name: 'Whole Life Insurance',
    icon: Umbrella,
    tag: 'Lifetime Cover',
    description: 'Coverage that lasts your entire lifetime (up to 99/100 years). Provides lifelong protection and legacy planning.',
    coverRange: '₹25 Lakh - ₹5 Crore',
    startingPremium: '₹2,000/month',
    features: [
      'Lifetime coverage up to 99 years',
      'Guaranteed death benefit',
      'Cash value accumulation',
      'Estate planning & wealth transfer',
      'Premium payment for limited years',
      'Tax benefits under Section 80C',
    ],
  },
];

const PARTNER_INSURERS = [
  'LIC', 'HDFC Life', 'ICICI Prudential', 'SBI Life',
  'Max Life', 'Tata AIA', 'Bajaj Allianz Life', 'Kotak Life',
  'PNB MetLife', 'Aditya Birla Sun Life', 'Canara HSBC Life', 'Edelweiss Tokio',
];

export default function LifeInsurancePage() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10">
          <div className="flex items-center gap-2 text-purple-200 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/insurance" className="hover:text-white">Insurance</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Life Insurance</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
                <Shield className="w-4 h-4" />
                IRDAI Licensed Insurance Broker
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Secure Your Family&apos;s <br />
                <span className="text-purple-300">Financial Future</span>
              </h1>
              <p className="text-lg text-purple-100 mb-8 max-w-lg">
                Compare term plans, endowment policies, ULIPs and whole life plans from India&apos;s top insurers.
                Get the right coverage at the best price.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="bg-white text-indigo-900 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2">
                  Get Free Quote <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="tel:+919876543210" className="border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Talk to Advisor
                </a>
              </div>
            </div>
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: Shield, label: 'Term Plans', desc: 'From ₹490/month' },
                { icon: TrendingUp, label: 'ULIPs', desc: 'Market-linked' },
                { icon: Clock, label: 'Endowment', desc: 'Guaranteed returns' },
                { icon: BadgeCheck, label: 'Whole Life', desc: 'Lifetime cover' },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <item.icon className="w-6 h-6 text-purple-300 mb-2" />
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-sm text-purple-200">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Life Insurance Plans</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether you need pure protection or savings with insurance, find the right life cover for your family.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {LIFE_PLANS.map((plan, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  selectedPlan === idx
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedPlan(selectedPlan === idx ? null : idx)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${selectedPlan === idx ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                      <plan.icon className={`w-6 h-6 ${selectedPlan === idx ? 'text-indigo-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{plan.tag}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{plan.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Coverage</p>
                      <p className="text-lg font-semibold text-gray-900">{plan.coverRange}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Starting From</p>
                      <p className="text-lg font-semibold text-indigo-600">{plan.startingPremium}</p>
                    </div>
                  </div>
                  <div className={`grid grid-cols-1 gap-2 transition-all duration-300 ${selectedPlan === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    {plan.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                    <Link
                      href="/contact"
                      className="mt-4 bg-indigo-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Get Quote for {plan.name}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Life Insurance Partners</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {PARTNER_INSURERS.map((insurer, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 text-center text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                {insurer}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Life Insurance */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why You Need Life Insurance</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Income Replacement', desc: 'Ensures your family maintains their lifestyle if something happens to you. Covers daily expenses, EMIs, and bills.' },
              { title: 'Debt Protection', desc: 'Prevents your family from inheriting your financial liabilities — home loans, car loans, and other debts.' },
              { title: 'Child\'s Education', desc: 'Secures funds for your children\'s higher education and future milestones even in your absence.' },
              { title: 'Retirement Planning', desc: 'Certain life policies build a corpus over time, providing a pension-like income after retirement.' },
              { title: 'Tax Benefits', desc: 'Premiums qualify for deduction under Section 80C (up to ₹1.5 Lakh). Maturity proceeds tax-free under 10(10D).' },
              { title: 'Peace of Mind', desc: 'Knowing your loved ones are financially secure lets you focus on living and achieving your goals.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gray-100 border-t">
        <div className="container-custom">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Disclaimer:</strong> {INSURANCE_DISCLAIMER} Insurance products are offered through {INSURANCE_ENTITY}.
            {IRDAI_LICENSE}. Insurance is the subject matter of solicitation. For more details on risk factors, terms and conditions,
            please read the sales brochure carefully before concluding a sale. Tax benefits are subject to changes in tax laws.
            ULIP products are different from traditional insurance products and are subject to market risks. The premium paid in ULIP policies
            are subject to investment risks associated with capital markets.
          </p>
        </div>
      </section>
    </div>
  );
}
