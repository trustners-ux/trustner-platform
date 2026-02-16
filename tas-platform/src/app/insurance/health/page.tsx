'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Heart, ChevronRight, Check, Star, AlertCircle,
  Users, Baby, UserCircle, ArrowRight, Phone
} from 'lucide-react';
import { INSURANCE_ENTITY, IRDAI_LICENSE, INSURANCE_DISCLAIMER } from '@/lib/constants/regulatory';

const HEALTH_PLANS = [
  {
    name: 'Individual Health Plan',
    icon: UserCircle,
    description: 'Comprehensive health coverage for individuals with cashless hospitalization across 10,000+ network hospitals.',
    sumInsured: '₹3 Lakh - ₹1 Crore',
    startingPremium: '₹5,000/year',
    features: [
      'Cashless hospitalization at 10,000+ hospitals',
      'Pre & post hospitalization coverage (60/90 days)',
      'Day care procedures covered',
      'No room rent capping (select plans)',
      'Annual health check-up',
      'Ambulance charges covered',
    ],
  },
  {
    name: 'Family Floater Plan',
    icon: Users,
    description: 'Single policy covering the entire family with shared sum insured. Economical way to cover spouse and children.',
    sumInsured: '₹5 Lakh - ₹2 Crore',
    startingPremium: '₹8,000/year',
    features: [
      'Coverage for self, spouse & up to 4 children',
      'Shared sum insured across family',
      'Maternity & newborn coverage (select plans)',
      'Restoration benefit — sum insured refilled',
      'AYUSH treatment covered',
      'Domiciliary hospitalization',
    ],
  },
  {
    name: 'Senior Citizen Plan',
    icon: Heart,
    description: 'Specialized health insurance for parents and senior citizens aged 60+ with tailored coverage and benefits.',
    sumInsured: '₹2 Lakh - ₹50 Lakh',
    startingPremium: '₹12,000/year',
    features: [
      'Entry age up to 80 years',
      'Pre-existing disease cover (after waiting period)',
      'Cataract & joint replacement coverage',
      'Domiciliary hospitalization',
      'Daily hospital cash benefit',
      'Dedicated senior citizen helpline',
    ],
  },
  {
    name: 'Critical Illness Plan',
    icon: Shield,
    description: 'Lump-sum payout on diagnosis of major illnesses like cancer, heart attack, stroke, and more.',
    sumInsured: '₹5 Lakh - ₹1 Crore',
    startingPremium: '₹3,000/year',
    features: [
      'Covers 30+ critical illnesses',
      'Lump sum payout on diagnosis',
      'Cancer, heart attack, stroke covered',
      'Organ transplant coverage',
      'No hospitalization required for claim',
      'Tax benefit under Section 80D',
    ],
  },
];

const PARTNER_INSURERS = [
  'Star Health', 'HDFC ERGO', 'ICICI Lombard', 'Bajaj Allianz',
  'Niva Bupa', 'Care Health', 'Aditya Birla Health', 'Tata AIG',
  'Manipal Cigna', 'New India Assurance', 'National Insurance', 'Digit Insurance',
];

export default function HealthInsurancePage() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10">
          <div className="flex items-center gap-2 text-gray-400 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/insurance" className="hover:text-white">Insurance</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Health Insurance</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
                <Shield className="w-4 h-4" />
                IRDAI Licensed Insurance Broker
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Health Insurance for <br />
                <span className="text-teal-300">Complete Protection</span>
              </h1>
              <p className="text-lg text-blue-100 mb-8 max-w-lg">
                Compare and buy the best health insurance plans from 15+ top insurers.
                Get cashless treatment at 10,000+ network hospitals across India.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact" className="bg-white text-blue-900 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
                  Get Free Quote <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="tel:+919876543210" className="border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Talk to Expert
                </a>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
                <h3 className="text-xl font-semibold mb-6">Why Health Insurance?</h3>
                <div className="space-y-4">
                  {[
                    'Medical inflation at 14% per year in India',
                    'Average hospital bill: ₹2-5 Lakh for major treatment',
                    'Tax savings up to ₹1 Lakh under Section 80D',
                    '62% of healthcare expenses are out-of-pocket in India',
                  ].map((stat, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-teal-300 mt-0.5 flex-shrink-0" />
                      <p className="text-blue-100">{stat}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Health Plan</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We help you compare plans from all major insurers and find the perfect coverage for your needs and budget.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {HEALTH_PLANS.map((plan, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl border-2 shadow-card hover:shadow-card-hover transition-shadow duration-300 cursor-pointer ${
                  selectedPlan === idx
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedPlan(selectedPlan === idx ? null : idx)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-2xl ${selectedPlan === idx ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <plan.icon className={`w-6 h-6 ${selectedPlan === idx ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Sum Insured</p>
                      <p className="text-lg font-semibold text-gray-900">{plan.sumInsured}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Starting From</p>
                      <p className="text-lg font-semibold text-blue-600">{plan.startingPremium}</p>
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
                      className="mt-4 bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
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

      {/* Partner Insurers */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Our Insurance Partners</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {PARTNER_INSURERS.map((insurer, idx) => (
              <div key={idx} className="bg-surface-100 rounded-2xl p-4 text-center text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                {insurer}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-surface-100">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How to Buy Health Insurance</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Share Details', desc: 'Tell us about your family members, age, and health conditions' },
              { step: '02', title: 'Compare Plans', desc: 'Get quotes from 15+ insurers and compare benefits side-by-side' },
              { step: '03', title: 'Expert Advice', desc: 'Our licensed advisors help you choose the right plan for your needs' },
              { step: '04', title: 'Buy & Relax', desc: 'Complete purchase online. Get policy documents instantly via email' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'What is the ideal health insurance cover amount?', a: 'We recommend a minimum cover of ₹10 Lakh for individuals and ₹15-25 Lakh for families. Consider your city (metro vs non-metro), family medical history, and current medical costs in your area.' },
              { q: 'Is there a waiting period for pre-existing diseases?', a: 'Yes, most health insurance plans have a 2-4 year waiting period for pre-existing conditions. Some plans offer reduced waiting periods at higher premiums.' },
              { q: 'Can I get health insurance for my parents above 60?', a: 'Yes, we offer senior citizen health plans with entry age up to 80 years. These plans are specially designed with relevant coverage for senior citizens.' },
              { q: 'What is cashless hospitalization?', a: 'Cashless hospitalization means you don\'t pay the hospital directly. The insurer settles the bill directly with the network hospital. We have 10,000+ cashless hospitals in our network.' },
              { q: 'Can I claim tax benefits on health insurance?', a: 'Yes, premiums paid for health insurance are eligible for tax deduction under Section 80D of the Income Tax Act — up to ₹25,000 for self/family and additional ₹50,000 for senior citizen parents.' },
            ].map((faq, idx) => (
              <details key={idx} className="group bg-surface-100 rounded-2xl">
                <summary className="p-4 cursor-pointer font-semibold text-gray-900 flex items-center justify-between">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="px-4 pb-4 text-gray-600 text-sm">{faq.a}</p>
              </details>
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
          </p>
        </div>
      </section>
    </div>
  );
}
