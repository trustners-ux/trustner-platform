'use client';

import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react';
import { COMPANY } from '@/lib/constants/company';

export default function ContactPage() {
  return (
    <>
      <section className="bg-hero-pattern text-white py-16">
        <div className="container-custom">
          <h1 className="text-4xl font-extrabold mb-3">Contact Us</h1>
          <p className="text-slate-300 max-w-2xl">Have questions about SIP investing or need guidance? We are here to help.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            <a href={`tel:${COMPANY.contact.phone}`} className="card-interactive p-8">
              <Phone className="w-8 h-8 text-brand mb-4" />
              <h2 className="text-lg font-bold text-primary-700 mb-1">Call Us</h2>
              <p className="text-2xl font-bold text-brand mb-2">{COMPANY.contact.phoneDisplay}</p>
              <p className="text-sm text-slate-500">{COMPANY.contact.workingHours}</p>
            </a>
            <a href={`mailto:${COMPANY.contact.email}`} className="card-interactive p-8">
              <Mail className="w-8 h-8 text-brand mb-4" />
              <h2 className="text-lg font-bold text-primary-700 mb-1">Email Us</h2>
              <p className="text-xl font-bold text-brand mb-2">{COMPANY.contact.email}</p>
              <p className="text-sm text-slate-500">We respond within 24 hours</p>
            </a>
          </div>

          <div className="card-base p-8 mb-8">
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-brand shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-primary-700 mb-2">Office Address</h2>
                <p className="text-slate-600 leading-relaxed">{COMPANY.address.full}</p>
                <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  {COMPANY.contact.workingHours}
                </div>
              </div>
            </div>
          </div>

          <div className="card-base p-8">
            <h2 className="text-lg font-bold text-primary-700 mb-4">WhatsApp Us</h2>
            <a
              href={`https://wa.me/${COMPANY.contact.whatsapp.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Phone className="w-4 h-4 mr-2" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
