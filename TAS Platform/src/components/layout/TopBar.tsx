"use client";

import { Phone, Mail } from "lucide-react";
import { REGULATORY } from "@/lib/constants/regulatory";
import { COMPANY } from "@/lib/constants/company";

export default function TopBar() {
  return (
    <div className="bg-primary text-white text-xs">
      <div className="container-custom flex items-center justify-between py-1.5">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-primary-200">
            AMFI Registered Mutual Fund Distributor |{" "}
            <span className="text-white">{REGULATORY.AMFI_ARN}</span>
          </span>
          <span className="hidden text-primary-400 sm:inline">•</span>
          <span className="hidden text-primary-200 sm:inline">
            {COMPANY.insuranceEntity.type}
          </span>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <a
            href={`tel:${COMPANY.contact.phone}`}
            className="flex items-center gap-1.5 text-primary-200 transition hover:text-white"
          >
            <Phone size={12} />
            {COMPANY.contact.phone}
          </a>
          <a
            href={`mailto:${COMPANY.contact.email}`}
            className="flex items-center gap-1.5 text-primary-200 transition hover:text-white"
          >
            <Mail size={12} />
            {COMPANY.contact.email}
          </a>
        </div>
      </div>
    </div>
  );
}
