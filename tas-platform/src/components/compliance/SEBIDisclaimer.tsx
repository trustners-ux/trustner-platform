import { AlertTriangle, Info } from "lucide-react";
import { REGULATORY } from "@/lib/constants/regulatory";

interface SEBIDisclaimerProps {
  variant?: "banner" | "inline" | "compact";
}

export default function SEBIDisclaimer({
  variant = "banner",
}: SEBIDisclaimerProps) {
  if (variant === "compact") {
    return (
      <p className="text-[11px] leading-relaxed text-gray-400">
        {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}
      </p>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 text-xs text-amber-800">
        <Info size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
        <p className="leading-relaxed">{REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}</p>
      </div>
    );
  }

  // Banner variant - used above footer
  return (
    <div className="border-y border-amber-100/50 bg-gradient-to-r from-amber-50/60 via-amber-50/40 to-amber-50/60 py-4">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-2.5 text-center">
          <AlertTriangle size={14} className="flex-shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-gray-600">
            <span className="font-semibold text-gray-700">
              {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}
            </span>{" "}
            <span className="text-gray-500">
              {REGULATORY.PAST_PERFORMANCE.split(".")[0]}.
            </span>
          </p>
        </div>
        <p className="mt-2 text-center text-[11px] text-gray-400">
          {REGULATORY.MF_ENTITY} | {REGULATORY.AMFI_ARN} | Mutual Fund Distributor (Not a SEBI Registered Investment Adviser)
        </p>
      </div>
    </div>
  );
}
