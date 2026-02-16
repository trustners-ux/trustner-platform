'use client';

import Link from 'next/link';
import {
  Plane, Shield, ChevronRight, Check, Globe, MapPin,
  ArrowRight, Phone, Briefcase, Heart
} from 'lucide-react';
import { INSURANCE_ENTITY, IRDAI_LICENSE, INSURANCE_DISCLAIMER } from '@/lib/constants/regulatory';

const TRAVEL_PLANS = [
  {
    name: 'International Travel Insurance',
    icon: Globe,
    description: 'Comprehensive coverage for international trips including medical emergencies, trip cancellation, and baggage loss.',
    coverage: 'Up to $500,000',
    premium: 'From ₹500/day',
    features: [
      'Emergency medical treatment abroad',
      'Medical evacuation & repatriation',
      'Trip cancellation/curtailment',
      'Loss of passport & travel documents',
      'Baggage loss/delay compensation',
      'Personal liability coverage',
      'Flight delay compensation',
      'Adventure sports cover (optional)',
    ],
  },
  {
    name: 'Domestic Travel Insurance',
    icon: MapPin,
    description: 'Protection for domestic travel within India covering medical emergencies, trip delays, and personal accidents.',
    coverage: 'Up to ₹10 Lakh',
    premium: 'From ₹99/day',
    features: [
      'Medical emergency during travel',
      'Personal accident cover',
      'Trip delay compensation',
      'Checked-in baggage loss',
      'Hotel booking cancellation',
      'Personal liability',
    ],
  },
  {
    name: 'Student Travel Insurance',
    icon: Briefcase,
    description: 'Specialized coverage for students studying abroad with extended stay benefits and university-compliant coverage.',
    coverage: 'Up to $300,000',
    premium: 'From ₹8,000/year',
    features: [
      'University/visa compliant coverage',
      'Extended stay coverage (1-2 years)',
      'Mental health support',
      'Sponsor protection',
      'Study interruption cover',
      'Emergency dental treatment',
      'Compassionate visit coverage',
      'Part-time work cover',
    ],
  },
  {
    name: 'Senior Citizen Travel',
    icon: Heart,
    description: 'Travel insurance designed for travelers aged 60+ with enhanced medical coverage and pre-existing condition benefits.',
    coverage: 'Up to $200,000',
    premium: 'From ₹1,500/day',
    features: [
      'Covers ages 60-85 years',
      'Pre-existing condition coverage',
      'Higher medical limits',
      'Medication refill coverage',
      'Medical evacuation',
      'Hospital cash benefit',
    ],
  },
];

const POPULAR_DESTINATIONS = [
  { name: 'USA & Canada', regions: 'Americas' },
  { name: 'UK & Europe', regions: 'Schengen + UK' },
  { name: 'Australia & NZ', regions: 'Oceania' },
  { name: 'UAE & Middle East', regions: 'Gulf Countries' },
  { name: 'Singapore & SE Asia', regions: 'ASEAN' },
  { name: 'Worldwide', regions: 'All Countries' },
];

export default function TravelInsurancePage() {
  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-cyan-900 via-teal-800 to-blue-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-teal-300 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10">
          <div className="flex items-center gap-2 text-teal-200 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/insurance" className="hover:text-white">Insurance</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Travel Insurance</span>
          </div>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
              <Plane className="w-4 h-4" />
              IRDAI Licensed Insurance Broker
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Travel with <br />
              <span className="text-teal-300">Complete Peace of Mind</span>
            </h1>
            <p className="text-lg text-teal-100 mb-8">
              Don&apos;t let unexpected events ruin your trip. Get comprehensive travel insurance for international
              and domestic travel from India&apos;s top insurers.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="bg-white text-teal-900 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors flex items-center gap-2">
                Get Travel Quote <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:+919876543210" className="border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> Talk to Expert
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-12 bg-white border-b">
        <div className="container-custom">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Destinations</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {POPULAR_DESTINATIONS.map((dest, idx) => (
              <div key={idx} className="text-center bg-surface-100 rounded-lg p-3 hover:bg-teal-50 transition-colors cursor-pointer">
                <p className="font-medium text-gray-900 text-sm">{dest.name}</p>
                <p className="text-xs text-gray-500">{dest.regions}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Travel Insurance Plans</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the right plan for your journey. Whether it&apos;s business, leisure, or study — we&apos;ve got you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {TRAVEL_PLANS.map((plan, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-teal-100">
                      <plan.icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 mb-4 py-3 border-y border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Coverage</p>
                      <p className="text-lg font-semibold text-gray-900">{plan.coverage}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Premium</p>
                      <p className="text-lg font-semibold text-teal-600">{plan.premium}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {plan.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/contact"
                    className="block bg-teal-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                  >
                    Get Quote
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Claim Process */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How to File a Travel Claim</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Notify Insurer', desc: 'Call the 24/7 helpline number on your policy within 48 hours of the incident' },
              { step: '02', title: 'Collect Documents', desc: 'Gather medical reports, bills, FIR (if applicable), boarding passes, receipts' },
              { step: '03', title: 'Submit Claim', desc: 'Fill the claim form and submit all documents online or via email to the insurer' },
              { step: '04', title: 'Get Settlement', desc: 'Claim processed within 7-15 days. Amount transferred to your bank account' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                  {item.step}
                </div>
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
            {IRDAI_LICENSE}. Coverage, premiums, and terms vary by insurer and plan selected. Premiums shown are indicative.
            Pre-existing conditions may have waiting periods. Please read the policy document carefully for full terms and conditions.
          </p>
        </div>
      </section>
    </div>
  );
}
