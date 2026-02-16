import { Phone, Mail, BadgeCheck } from "lucide-react";
import { REGULATORY } from "@/lib/constants/regulatory";
import { COMPANY } from "@/lib/constants/company";

export default function TopBar() {
  return (
    <div className="bg-[#0A1628] text-white text-xs">
      <div className="container-custom flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BadgeCheck size={13} className="text-emerald-400" />
            <span className="font-semibold text-gray-300">
              AMFI Registered Mutual Fund Distributor
            </span>
            <span className="font-bold text-white">
              {REGULATORY.AMFI_ARN}
            </span>
          </div>
          <span className="hidden text-gray-600 sm:inline">|</span>
          <span className="hidden text-gray-300 sm:inline">
            {COMPANY.insuranceEntity.type}
          </span>
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <a
            href={`tel:${COMPANY.contact.phone}`}
            className="flex items-center gap-1.5 text-gray-400 transition hover:text-white"
          >
            <Phone size={11} />
            <span>{COMPANY.contact.phone}</span>
          </a>
          <a
            href={`mailto:${COMPANY.contact.email}`}
            className="flex items-center gap-1.5 text-gray-400 transition hover:text-white"
          >
            <Mail size={11} />
            <span>{COMPANY.contact.email}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
