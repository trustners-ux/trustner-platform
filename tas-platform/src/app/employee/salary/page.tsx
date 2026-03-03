"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SalarySlip } from "@/types/employee";
import {
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
} from "lucide-react";

type SlipWithDoc = SalarySlip & {
  document: { file_path: string; file_name: string } | null;
};

export default function SalaryPage() {
  const [slips, setSlips] = useState<SlipWithDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlip, setExpandedSlip] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlips() {
      const supabase = createClient();
      const { data } = await supabase
        .from("salary_slips")
        .select("*, document:documents(file_path, file_name)")
        .order("month_year", { ascending: false });

      setSlips((data || []) as SlipWithDoc[]);
      setLoading(false);
    }
    fetchSlips();
  }, []);

  async function downloadPdf(filePath: string, fileName: string) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60);

    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = fileName;
      a.target = "_blank";
      a.click();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Salary Slips</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and download your monthly salary slips.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-gray-400">Loading salary slips...</p>
        </div>
      ) : slips.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <IndianRupee className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">
            No salary slips available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {slips.map((slip) => {
            const isExpanded = expandedSlip === slip.id;
            const monthLabel = new Date(
              slip.month_year + "-01"
            ).toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            });

            const doc = slip.document;

            return (
              <div
                key={slip.id}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header Row */}
                <button
                  onClick={() =>
                    setExpandedSlip(isExpanded ? null : slip.id)
                  }
                  className="flex w-full items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                      <IndianRupee size={18} className="text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {monthLabel}
                      </p>
                      <p className="text-xs text-gray-500">
                        {slip.days_present}/{slip.total_working_days} days
                        worked
                        {slip.lop_days > 0 && (
                          <span className="ml-2 text-red-500">
                            ({slip.lop_days} LOP)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-700">
                        INR{" "}
                        {Number(slip.net_pay).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-gray-400">Net Pay</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-5">
                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Earnings */}
                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Earnings
                        </h3>
                        <div className="space-y-2">
                          {[
                            { label: "Basic", value: slip.basic },
                            { label: "HRA", value: slip.hra },
                            {
                              label: "Dearness Allowance",
                              value: slip.dearness_allowance,
                            },
                            {
                              label: "Conveyance",
                              value: slip.conveyance,
                            },
                            {
                              label: "Medical Allowance",
                              value: slip.medical_allowance,
                            },
                            {
                              label: "Special Allowance",
                              value: slip.special_allowance,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {item.label}
                              </span>
                              <span className="font-medium text-gray-900">
                                {Number(item.value).toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold">
                            <span className="text-gray-900">
                              Gross Earnings
                            </span>
                            <span className="text-gray-900">
                              {Number(slip.gross_earnings).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Deductions
                        </h3>
                        <div className="space-y-2">
                          {[
                            {
                              label: "PF (Employee)",
                              value: slip.pf_employee,
                            },
                            {
                              label: "ESI (Employee)",
                              value: slip.esi_employee,
                            },
                            {
                              label: "Professional Tax",
                              value: slip.professional_tax,
                            },
                            { label: "TDS", value: slip.tds },
                            { label: "LWF", value: slip.lwf_employee },
                            {
                              label: "Other Deductions",
                              value: slip.other_deductions,
                            },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {item.label}
                              </span>
                              <span className="font-medium text-red-600">
                                {Number(item.value).toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold">
                            <span className="text-gray-900">
                              Total Deductions
                            </span>
                            <span className="text-red-600">
                              {Number(
                                slip.total_deductions
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="mt-5 grid grid-cols-4 gap-4 rounded-xl bg-gray-50 p-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {slip.total_working_days}
                        </p>
                        <p className="text-xs text-gray-500">
                          Working Days
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {slip.days_present}
                        </p>
                        <p className="text-xs text-gray-500">Present</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600">
                          {slip.days_absent}
                        </p>
                        <p className="text-xs text-gray-500">Absent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600">
                          {slip.lop_days}
                        </p>
                        <p className="text-xs text-gray-500">LOP Days</p>
                      </div>
                    </div>

                    {/* Net Pay & Download */}
                    <div className="mt-5 flex items-center justify-between rounded-xl bg-green-50 p-4">
                      <div>
                        <p className="text-xs text-green-600">Net Pay</p>
                        <p className="text-xl font-bold text-green-700">
                          INR{" "}
                          {Number(slip.net_pay).toLocaleString("en-IN")}
                        </p>
                      </div>
                      {doc ? (
                        <button
                          onClick={() =>
                            downloadPdf(doc.file_path, doc.file_name)
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          <Download size={16} />
                          Download PDF
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <FileText size={14} />
                          PDF not yet generated
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
