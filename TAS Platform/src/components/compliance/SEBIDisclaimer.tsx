import { AlertTriangle } from "lucide-react";
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
      <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
        <p>{REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}</p>
      </div>
    );
  }

  return (
    <div className="border-y border-yellow-100 bg-yellow-50/50 py-4">
      <div className="container-custom flex items-center justify-center gap-2 text-center text-xs text-yellow-800">
        <AlertTriangle size={14} className="flex-shrink-0" />
        <p>
          {REGULATORY.SEBI_MUTUAL_FUND_DISCLAIMER}{" "}
          <span className="text-yellow-600">
            {REGULATORY.PAST_PERFORMANCE.split(".")[0]}.
          </span>
        </p>
      </div>
    </div>
  );
}
