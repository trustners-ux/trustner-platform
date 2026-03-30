'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, ExternalLink, ArrowUpRight, Shield, Lock, ShieldCheck } from 'lucide-react';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';
import { FOOTER_LINKS } from '@/lib/constants/navigation';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <>
    <div className="h-[2px] bg-gradient-to-r from-brand via-brand-500 to-secondary" />
    <footer className="bg-primary-700 text-white">
      {/* Main Footer */}
      <div className="container-custom section-padding-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="block mb-4">
              <Image
                src="/Trustner Logo-blue.png"
                alt="Trustner"
                width={140}
                height={80}
                className="h-12 w-auto object-contain brightness-0 invert mb-2"
              />
              <div>
                <div className="text-lg font-bold leading-tight">Mera SIP</div>
                <div className="text-[10px] text-blue-300 font-medium tracking-wide">by Trustner Asset Services</div>
              </div>
            </Link>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              India&apos;s most intelligent SIP learning and research hub. Education-first, data-driven.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <a href={`tel:${COMPANY.contact.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5" />
                {COMPANY.contact.phoneDisplay}
              </a>
              <a href={`mailto:${COMPANY.contact.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5" />
                {COMPANY.contact.email}
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{COMPANY.address.city}, {COMPANY.address.state}</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group text-sm text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer hover:translate-x-0.5"
                    >
                      <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-brand-300 transition-colors shrink-0" />
                      <span className="group-hover:underline underline-offset-2">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory Section */}
      <div className="border-t border-white/10 bg-white/[0.03]">
        <div className="container-custom py-8">
          {/* AMFI / SEBI Registration Banner */}
          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Regulatory Information</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">{COMPANY.mfEntity.name}</strong><br />
                {COMPANY.mfEntity.type}<br />
                {COMPANY.mfEntity.amfiArn} | EUIN: {COMPANY.mfEntity.euin} | CIN: {COMPANY.mfEntity.cin}<br />
                Registered Office: {COMPANY.address.full}<br />
                Grievance Redressal: <a href={`mailto:${COMPANY.contact.grievanceEmail}`} className="text-brand-300 hover:text-white transition-colors">{COMPANY.contact.grievanceEmail}</a>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Important Links:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-300 hover:text-white transition-colors">
                    AMFI <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <span className="text-slate-600">|</span>
                  <a href="https://www.sebi.gov.in" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-300 hover:text-white transition-colors">
                    SEBI <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <span className="text-slate-600">|</span>
                  <a href="https://scores.gov.in" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-300 hover:text-white transition-colors">
                    SCORES <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <span className="text-slate-600">|</span>
                  <a href="https://www.amfiindia.com/investor-corner/knowledge-center/investor-charter.html" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-300 hover:text-white transition-colors">
                    Investor Charter <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Disclaimer Banner */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-4 text-center">
            <p className="text-sm font-semibold text-accent">
              Mutual Fund investments are subject to market risks. Read all scheme related documents carefully before investing.
            </p>
          </div>

          {/* Compliance Disclaimers */}
          <div className="space-y-2 mb-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Disclaimer:</strong> {DISCLAIMER.general}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Mutual Funds:</strong> {DISCLAIMER.mutual_fund}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300">KYC:</strong> {DISCLAIMER.kyc}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Grievance:</strong> {DISCLAIMER.grievance}
              </p>
            </div>
          </div>

          {/* Copyright & Bottom Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div className="text-xs text-slate-500">
              <p>{DISCLAIMER.amfi}</p>
              <p className="mt-1">&copy; {currentYear} {COMPANY.mfEntity.name}. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={COMPANY.urls.mainSite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                Visit MeraSIP.com <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 mt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-positive" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-brand-300" />
              <span>AMFI Registered</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>SEBI Regulated</span>
            </div>
          </div>
        </div>
      </div>
    </footer>

    {/* Sticky Regulatory Footer Bar */}
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-primary-700/95 backdrop-blur-sm border-t border-white/10 py-2 hidden sm:block">
      <div className="container-custom">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-accent" />
              <span className="font-semibold text-white">AMFI Registered</span>
              <span>ARN-286886</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-positive" />
              <span className="font-semibold text-white">SEBI Regulated</span>
            </div>
            <span className="text-slate-600">|</span>
            <span>Mutual Fund investments are subject to market risks</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://www.amfiindia.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">AMFI India</a>
            <a href="https://www.sebi.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SEBI</a>
            <a href="https://scores.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">SCORES</a>
          </div>
        </div>
      </div>
    </div>

    <div className="hidden sm:block h-8" />
    </>
  );
}
