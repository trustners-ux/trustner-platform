'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Car, Shield, ChevronRight, Check, Bike, Truck,
  ArrowRight, Phone, Wrench, AlertTriangle
} from 'lucide-react';
import { INSURANCE_ENTITY, IRDAI_LICENSE, INSURANCE_DISCLAIMER } from '@/lib/constants/regulatory';

const VEHICLE_TYPES = [
  {
    name: 'Car Insurance',
    icon: Car,
    description: 'Comprehensive and third-party car insurance from top insurers. Instant policy issuance.',
    plans: [
      {
        type: 'Comprehensive',
        desc: 'Covers own damage + third-party liability. Maximum protection for your vehicle.',
        premium: 'From ₹2,500/year',
        benefits: ['Own damage protection', 'Third-party liability', 'Natural calamity cover', 'Theft & fire cover', 'Personal accident cover', 'Cashless repairs at 5,000+ garages'],
      },
      {
        type: 'Third-Party Only',
        desc: 'Mandatory by law. Covers damage caused to third-party person or property.',
        premium: 'From ₹2,094/year',
        benefits: ['Legal compliance (mandatory)', 'Third-party injury cover', 'Third-party property damage', 'Court award coverage', 'Affordable premiums', 'Instant policy issuance'],
      },
    ],
  },
  {
    name: 'Two-Wheeler Insurance',
    icon: Bike,
    description: 'Protect your bike or scooter with comprehensive or third-party insurance at the best rates.',
    plans: [
      {
        type: 'Comprehensive',
        desc: 'Complete protection for your two-wheeler against accidents, theft, and natural calamities.',
        premium: 'From ₹750/year',
        benefits: ['Own damage cover', 'Third-party liability', 'Theft protection', 'Natural calamity cover', 'Personal accident cover', 'Accessories coverage'],
      },
      {
        type: 'Third-Party Only',
        desc: 'Legally mandatory coverage for third-party damages caused by your two-wheeler.',
        premium: 'From ₹482/year',
        benefits: ['Legal compliance', 'Third-party injury cover', 'Third-party property damage', 'Very affordable', 'Instant policy', 'No inspection needed'],
      },
    ],
  },
  {
    name: 'Commercial Vehicle Insurance',
    icon: Truck,
    description: 'Insurance for trucks, buses, taxis, and other commercial vehicles with goods-in-transit options.',
    plans: [
      {
        type: 'Comprehensive Package',
        desc: 'Full protection for your commercial fleet including own damage and third-party.',
        premium: 'From ₹5,000/year',
        benefits: ['Own damage coverage', 'Third-party liability', 'Goods in transit cover', 'Driver cover', 'Breakdown assistance', 'Pan-India network'],
      },
    ],
  },
];

const ADD_ONS = [
  { name: 'Zero Depreciation', desc: 'Get full claim amount without depreciation deduction' },
  { name: 'Engine Protection', desc: 'Covers engine damage due to water ingression or oil leakage' },
  { name: 'Roadside Assistance', desc: '24/7 breakdown support including towing & minor repairs' },
  { name: 'Return to Invoice', desc: 'Get invoice value of car in case of total loss or theft' },
  { name: 'NCB Protection', desc: 'Retain your No Claim Bonus even after making a claim' },
  { name: 'Key Replacement', desc: 'Covers cost of key/lock replacement if lost or stolen' },
];

export default function MotorInsurancePage() {
  const [activeVehicle, setActiveVehicle] = useState(0);

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10">
          <div className="flex items-center gap-2 text-gray-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/insurance" className="hover:text-white">Insurance</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Motor Insurance</span>
          </div>
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm mb-6">
              <Shield className="w-4 h-4" />
              IRDAI Licensed Insurance Broker
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Motor Insurance for <br />
              <span className="text-blue-300">Cars, Bikes & Commercial</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Compare motor insurance from 15+ insurers. Get instant quotes, cashless repairs at 5,000+ garages,
              and hassle-free claim settlement.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/contact" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                Get Instant Quote <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:+916003903737" className="border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> Claims Helpline
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Type Tabs */}
      <section className="py-16">
        <div className="container-custom">
          <div className="flex gap-4 mb-8 overflow-x-auto">
            {VEHICLE_TYPES.map((vt, idx) => (
              <button
                key={idx}
                onClick={() => setActiveVehicle(idx)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  activeVehicle === idx
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                }`}
              >
                <vt.icon className="w-5 h-5" />
                {vt.name}
              </button>
            ))}
          </div>

          <div>
            <p className="text-gray-600 mb-8">{VEHICLE_TYPES[activeVehicle].description}</p>
            <div className="grid md:grid-cols-2 gap-6">
              {VEHICLE_TYPES[activeVehicle].plans.map((plan, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.type}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.desc}</p>
                  <p className="text-2xl font-bold text-blue-600 mb-4">{plan.premium}</p>
                  <div className="space-y-2 mb-6">
                    {plan.benefits.map((b, bi) => (
                      <div key={bi} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>
                  <Link href="/contact" className="block bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    Get Quote
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Popular Add-On Covers</h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            Enhance your motor insurance with these add-on covers for comprehensive protection.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {ADD_ONS.map((addon, idx) => (
              <div key={idx} className="bg-surface-100 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-3">
                  <Wrench className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{addon.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{addon.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="container-custom">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">Important: Third-Party Insurance is Mandatory</p>
              <p className="text-sm text-amber-700 mt-1">
                As per the Motor Vehicles Act, 1988, it is mandatory to have at least third-party motor insurance to drive any vehicle
                on Indian roads. Driving without valid insurance can attract penalties including fine and imprisonment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gray-100 border-t">
        <div className="container-custom">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Disclaimer:</strong> {INSURANCE_DISCLAIMER} Insurance products are offered through {INSURANCE_ENTITY}.
            {IRDAI_LICENSE}. Premiums shown are indicative and may vary based on vehicle type, age, location, and claims history.
            Insurance is the subject matter of solicitation. For more details on risk factors, terms and conditions,
            please read the sales brochure carefully before concluding a sale.
          </p>
        </div>
      </section>
    </div>
  );
}
