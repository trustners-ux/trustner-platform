"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Phone,
  Mail,
  Clock,
  MapPin,
  ExternalLink,
  Send,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
} from "lucide-react";
import { REGULATORY } from "@/lib/constants/regulatory";
import { COMPANY } from "@/lib/constants/company";
import { FOOTER_LINKS } from "@/lib/constants/nav-links";

const socialIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  facebook: Facebook,
};

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter subscription logic
    setEmail("");
  };

  return (
    <footer>
      {/* ===== NEWSLETTER SECTION ===== */}
      <div className="bg-[#0A1628]">
        <div className="container-custom py-10">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold text-white">
                Stay updated with market insights
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Get weekly investment tips, market analysis, and product updates
                delivered to your inbox.
              </p>
            </div>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex w-full max-w-md gap-3"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 rounded-lg border border-gray-700 bg-[#111D33] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
              >
                <Send size={16} />
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ===== MAIN FOOTER GRID ===== */}
      <div className="bg-[#0B1120]">
        <div className="container-custom py-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
            {/* Brand & Contact Column */}
            <div className="lg:col-span-4">
              <Link href="/" className="mb-5 flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500">
                  <TrendingUp size={22} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  {COMPANY.brand}
                </span>
              </Link>
              <p className="mb-6 max-w-xs text-sm leading-relaxed text-gray-400">
                {COMPANY.description}
              </p>

              {/* Contact Info */}
              <div className="mb-6 space-y-3 text-sm">
                <a
                  href={`tel:${COMPANY.contact.phone}`}
                  className="flex items-center gap-2.5 text-gray-400 transition hover:text-white"
                >
                  <Phone size={15} className="text-primary-400" />
                  {COMPANY.contact.phone}
                </a>
                <a
                  href={`mailto:${COMPANY.contact.email}`}
                  className="flex items-center gap-2.5 text-gray-400 transition hover:text-white"
                >
                  <Mail size={15} className="text-primary-400" />
                  {COMPANY.contact.email}
                </a>
                <p className="flex items-center gap-2.5 text-gray-400">
                  <Clock size={15} className="text-primary-400" />
                  {COMPANY.contact.workingHours}
                </p>
                <p className="flex items-start gap-2.5 text-gray-400">
                  <MapPin size={15} className="mt-0.5 flex-shrink-0 text-primary-400" />
                  {COMPANY.address.full}
                </p>
              </div>

              {/* Social Media Icons */}
              <div className="flex items-center gap-3">
                {Object.entries(COMPANY.social).map(([platform, url]) => {
                  const Icon = socialIcons[platform];
                  if (!Icon) return null;
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={platform}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition hover:border-primary-500 hover:bg-primary-500/10 hover:text-white"
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Products - Mutual Funds */}
            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Products
              </h3>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.mutualFunds.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Insurance */}
            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Insurance
              </h3>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.insurance.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Company
              </h3>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                Legal
              </h3>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
                      target={
                        link.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        link.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      {link.label}
                      {link.href.startsWith("http") && (
                        <ExternalLink size={11} className="opacity-60" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ===== REGULATORY COMPLIANCE SECTION ===== */}
      <div className="bg-[#070F1C]">
        <div className="container-custom py-10">
          {/* Section Heading */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-800" />
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Regulatory Disclosures
            </h4>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          {/* Entity Information Box */}
          <div className="mb-8 rounded-lg border border-gray-800 bg-[#0B1528]/60 p-5">
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-300">
                  Mutual Fund Distribution:
                </span>
                <span className="text-gray-400">
                  {COMPANY.mfEntity.name} | {REGULATORY.AMFI_ARN}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-300">
                  Insurance Broking:
                </span>
                <span className="text-gray-400">
                  {COMPANY.insuranceEntity.name} | {REGULATORY.IRDAI_LICENSE}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-300">
                  CIN:
                </span>
                <span className="text-gray-400">
                  {REGULATORY.CIN_MF} (MF) | {REGULATORY.CIN_INSURANCE} (Insurance)
                </span>
              </div>
            </div>
          </div>

          {/* Key Disclaimers */}
          <div className="mb-8 space-y-4">
            {/* SEBI Mutual Fund Disclaimer - Prominent */}
            <div className="rounded-md border-l-4 border-amber-500/80 bg-amber-500/5 py-3 pl-4 pr-4">
              <p className="text-sm font-semibold leading-relaxed text-amber-400/90">
                {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}
              </p>
            </div>

            {/* Distributor Disclaimer */}
            <div className="rounded-md border-l-4 border-amber-600/50 bg-[#0D1729]/60 py-3 pl-4 pr-4">
              <p className="text-[13px] leading-relaxed text-gray-400">
                We are an AMFI registered Mutual Fund Distributor and NOT a SEBI
                Registered Investment Adviser (RIA). The information provided
                herein is for general informational purposes only and should not
                be construed as investment advice.
              </p>
            </div>

            {/* Past Performance */}
            <div className="rounded-md border-l-4 border-amber-700/40 bg-[#0D1729]/40 py-3 pl-4 pr-4">
              <p className="text-[13px] leading-relaxed text-gray-400">
                {REGULATORY.PAST_PERFORMANCE}
              </p>
            </div>

            {/* KYC Notice */}
            <div className="rounded-md border-l-4 border-amber-700/40 bg-[#0D1729]/40 py-3 pl-4 pr-4">
              <p className="text-[13px] leading-relaxed text-gray-400">
                {REGULATORY.KYC_NOTICE}
              </p>
            </div>

            {/* Insurance Disclaimer */}
            <div className="rounded-md border-l-4 border-amber-700/40 bg-[#0D1729]/40 py-3 pl-4 pr-4">
              <p className="text-[13px] leading-relaxed text-gray-400">
                {REGULATORY.INSURANCE_DISCLAIMER}
              </p>
            </div>

            {/* Tax Disclaimer */}
            <div className="rounded-md border-l-4 border-amber-700/40 bg-[#0D1729]/40 py-3 pl-4 pr-4">
              <p className="text-[13px] leading-relaxed text-gray-400">
                {REGULATORY.TAX_DISCLAIMER}
              </p>
            </div>

            {/* FATCA/CRS */}
            <div className="rounded-md border-l-4 border-amber-700/40 bg-[#0D1729]/40 py-3 pl-4 pr-4">
              <p className="text-[13px] leading-relaxed text-gray-400">
                {REGULATORY.FATCA_CRS}
              </p>
            </div>
          </div>

          {/* Grievance Redressal Links */}
          <div className="mb-8 rounded-lg border border-gray-800 bg-[#0B1528]/40 p-5">
            <h5 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Grievance Redressal
            </h5>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
              <a
                href={REGULATORY.SEBI_SCORES.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-400 transition hover:text-primary-300"
              >
                SEBI SCORES Portal
                <ExternalLink size={13} />
              </a>
              <a
                href={REGULATORY.AMFI_INVESTOR_CHARTER.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-400 transition hover:text-primary-300"
              >
                AMFI Investor Charter
                <ExternalLink size={13} />
              </a>
              <a
                href={REGULATORY.AMFI_WEBSITE.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-400 transition hover:text-primary-300"
              >
                AMFI India
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Compliance Officer */}
          <div className="rounded-lg border border-gray-800 bg-[#0B1528]/40 p-5">
            <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Compliance Officer
            </h5>
            <p className="text-sm text-gray-400">
              <span className="font-medium text-gray-300">
                {REGULATORY.COMPLIANCE_OFFICER.name}
              </span>{" "}
              &nbsp;|&nbsp;{" "}
              <a
                href={`mailto:${REGULATORY.COMPLIANCE_OFFICER.email}`}
                className="text-primary-400 transition hover:text-primary-300"
              >
                {REGULATORY.COMPLIANCE_OFFICER.email}
              </a>{" "}
              &nbsp;|&nbsp; {REGULATORY.COMPLIANCE_OFFICER.phone}
            </p>
          </div>

          {/* Data Attribution */}
          <p className="mt-6 text-xs leading-relaxed text-gray-500">
            {REGULATORY.DATA_DISCLAIMER}
          </p>
        </div>
      </div>

      {/* ===== COPYRIGHT BAR ===== */}
      <div className="bg-[#040A12]">
        <div className="container-custom flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
          <p className="text-xs text-gray-500">
            &copy; {currentYear} {COMPANY.brand}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {Object.entries(COMPANY.social).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs capitalize text-gray-500 transition hover:text-white"
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
