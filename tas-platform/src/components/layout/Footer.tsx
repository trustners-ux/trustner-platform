"use client";

import Link from "next/link";
import {
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";
import { REGULATORY } from "@/lib/constants/regulatory";
import { COMPANY } from "@/lib/constants/company";
import { FOOTER_LINKS } from "@/lib/constants/nav-links";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* SEBI Disclaimer Banner */}
      <div className="border-b border-gray-800 bg-gray-950 px-4 py-3">
        <div className="container-custom text-center text-xs leading-relaxed text-gray-400">
          <p className="font-semibold text-yellow-500/80">
            {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}
          </p>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500">
                <TrendingUp size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Trustner</span>
            </Link>
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              {COMPANY.description}
            </p>
            <div className="space-y-2 text-sm">
              <a
                href={`tel:${COMPANY.contact.phone}`}
                className="flex items-center gap-2 transition hover:text-white"
              >
                <Phone size={14} />
                {COMPANY.contact.phone}
              </a>
              <a
                href={`mailto:${COMPANY.contact.email}`}
                className="flex items-center gap-2 transition hover:text-white"
              >
                <Mail size={14} />
                {COMPANY.contact.email}
              </a>
              <p className="flex items-center gap-2">
                <Clock size={14} />
                {COMPANY.contact.workingHours}
              </p>
            </div>
          </div>

          {/* Mutual Funds Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Mutual Funds
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.mutualFunds.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Insurance Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Insurance
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.insurance.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Company
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition hover:text-white"
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      link.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {link.label}
                    {link.href.startsWith("http") && (
                      <ExternalLink size={10} className="ml-1 inline" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Regulatory Compliance Section */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="space-y-4 text-[11px] leading-relaxed text-gray-500">
            {/* Entity Information */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <span>
                <strong className="text-gray-400">Mutual Fund Distribution:</strong>{" "}
                {COMPANY.mfEntity.name} | {REGULATORY.AMFI_ARN}
              </span>
              <span>
                <strong className="text-gray-400">Insurance Broking:</strong>{" "}
                {COMPANY.insuranceEntity.name} | {REGULATORY.IRDAI_LICENSE}
              </span>
            </div>

            {/* Disclaimers */}
            <p>{REGULATORY.DISTRIBUTOR_DISCLAIMER}</p>
            <p>{REGULATORY.PAST_PERFORMANCE}</p>
            <p>{REGULATORY.KYC_NOTICE}</p>
            <p>{REGULATORY.INSURANCE_DISCLAIMER}</p>
            <p>{REGULATORY.TAX_DISCLAIMER}</p>
            <p>{REGULATORY.FATCA_CRS}</p>

            {/* Grievance Redressal */}
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <a
                href={REGULATORY.SEBI_SCORES.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-gray-300"
              >
                SEBI SCORES Portal{" "}
                <ExternalLink size={10} className="ml-0.5 inline" />
              </a>
              <a
                href={REGULATORY.AMFI_INVESTOR_CHARTER.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-gray-300"
              >
                AMFI Investor Charter{" "}
                <ExternalLink size={10} className="ml-0.5 inline" />
              </a>
              <a
                href={REGULATORY.AMFI_WEBSITE.url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-gray-300"
              >
                AMFI India{" "}
                <ExternalLink size={10} className="ml-0.5 inline" />
              </a>
            </div>

            {/* Compliance Officer */}
            <p>
              <strong className="text-gray-400">Compliance Officer:</strong>{" "}
              {REGULATORY.COMPLIANCE_OFFICER.name} |{" "}
              {REGULATORY.COMPLIANCE_OFFICER.email} |{" "}
              {REGULATORY.COMPLIANCE_OFFICER.phone}
            </p>

            {/* Data Attribution */}
            <p>{REGULATORY.DATA_DISCLAIMER}</p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="container-custom flex flex-wrap items-center justify-between gap-4 py-4 text-xs text-gray-500">
          <p>
            &copy; {currentYear} {COMPANY.brand}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {Object.entries(COMPANY.social).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="capitalize transition hover:text-white"
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
