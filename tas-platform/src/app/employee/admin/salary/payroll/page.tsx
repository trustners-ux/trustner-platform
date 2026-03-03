"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle2,
  Lock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  generatePayroll,
  finalizePayroll,
  generateAllSlipPdfs,
} from "@/lib/auth/salary-actions";
import type { PayrollRun } from "@/types/employee";

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  processing: {
    label: "Processing",
    color: "bg-amber-100 text-amber-700",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
  },
  finalized: {
    label: "Finalized",
    color: "bg-blue-100 text-blue-700",
  },
};

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthYear, setMonthYear] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    processed: number;
    skipped?: string[];
  } | null>(null);

  async function fetchRuns() {
    const supabase = createClient();
    const { data } = await supabase
      .from("payroll_runs")
      .select("*")
      .order("month_year", { ascending: false });
    setRuns((data || []) as PayrollRun[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchRuns();
  }, []);

  async function handleGenerate() {
    if (!monthYear) return;
    setGenerating(true);
    setError(null);
    setResult(null);

    const res = await generatePayroll(monthYear);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setResult({
        processed: res.processed || 0,
        skipped: res.skipped,
      });
      fetchRuns();
    }
    setGenerating(false);
  }

  async function handleFinalize(id: string) {
    const res = await finalizePayroll(id);
    if (res?.error) {
      setError(res.error);
    } else {
      fetchRuns();
    }
  }

  async function handleGeneratePdfs(id: string) {
    setError(null);
    const res = await generateAllSlipPdfs(id);
    if (res?.error) {
      setError(res.error);
    } else {
      setResult({
        processed: res.generated || 0,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/employee/admin/salary"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payroll Runs</h1>
          <p className="text-sm text-gray-500">
            Generate and manage monthly payroll
          </p>
        </div>
      </div>

      {/* Generate Payroll */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-gray-900">
          Generate Payroll
        </h2>
        <div className="flex items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700">
              Month / Year
            </label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !monthYear}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play size={16} />
                Generate Payroll
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-lg bg-green-50 p-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">
                Processed {result.processed} salary slip(s)
              </span>
            </div>
            {result.skipped && result.skipped.length > 0 && (
              <div className="mt-2 flex items-start gap-2 text-amber-700">
                <AlertTriangle size={14} className="mt-0.5" />
                <p className="text-xs">
                  Skipped: {result.skipped.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payroll Runs List */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Month
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Employees
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Total Net
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No payroll runs yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => {
                  const badge =
                    STATUS_BADGES[run.status] || STATUS_BADGES.draft;
                  return (
                    <tr
                      key={run.id}
                      className="transition hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(
                            run.month_year + "-01"
                          ).toLocaleDateString("en-IN", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {run.total_employees}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        INR{" "}
                        {Number(run.total_net).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/employee/admin/salary/payroll/${run.id}`}
                            className="text-sm font-semibold text-primary-500 hover:underline"
                          >
                            View
                          </Link>
                          {run.status === "completed" && (
                            <>
                              <button
                                onClick={() => handleGeneratePdfs(run.id)}
                                className="text-sm font-semibold text-emerald-600 hover:underline"
                              >
                                Generate PDFs
                              </button>
                              <button
                                onClick={() => handleFinalize(run.id)}
                                className="text-sm font-semibold text-amber-600 hover:underline"
                              >
                                Finalize
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
