import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee } from "@/lib/auth/actions";
import { formatDate, formatINR } from "@/lib/utils/formatters";
import type { FnFSettlement, FnFStatus } from "@/types/employee";
import {
  Calculator,
  IndianRupee,
  CalendarDays,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Ban,
  Banknote,
} from "lucide-react";

const FNF_STATUS_CONFIG: Record<
  FnFStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-600",
    icon: FileText,
  },
  pending_approval: {
    label: "Pending Approval",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-blue-100 text-blue-700",
    icon: CheckCircle,
  },
  paid: {
    label: "Paid",
    color: "bg-green-100 text-green-700",
    icon: Banknote,
  },
  disputed: {
    label: "Disputed",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
};

function SettlementRow({
  label,
  value,
  isHighlight = false,
  isDeduction = false,
}: {
  label: string;
  value: number | null;
  isHighlight?: boolean;
  isDeduction?: boolean;
}) {
  if (value === null || value === undefined) return null;

  return (
    <div
      className={`flex items-center justify-between py-3 ${
        isHighlight
          ? "border-t-2 border-gray-900 pt-4"
          : "border-b border-gray-50"
      }`}
    >
      <span
        className={`text-sm ${
          isHighlight ? "font-bold text-gray-900" : "text-gray-600"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${
          isHighlight
            ? "text-lg text-gray-900"
            : isDeduction
              ? "text-red-600"
              : "text-gray-900"
        }`}
      >
        {isDeduction && value > 0 ? `- ${formatINR(value)}` : formatINR(value)}
      </span>
    </div>
  );
}

export default async function FnFPage() {
  const employee = await getEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();

  const { data: settlement } = await supabase
    .from("fnf_settlements")
    .select(
      "*, processor:employees!fnf_settlements_processed_by_fkey(*), approver:employees!fnf_settlements_approved_by_fkey(*)"
    )
    .eq("employee_id", employee.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fnf = settlement as FnFSettlement | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Full & Final Settlement
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View your F&F settlement details and status.
        </p>
      </div>

      {!fnf ? (
        /* No F&F Settlement Found */
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="py-12 text-center">
            <Calculator className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h2 className="text-lg font-bold text-gray-900">
              No F&F Settlement Found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
              There is no Full & Final settlement record for your account. This
              section will be updated if and when an F&F process is initiated by
              the HR department.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Status Banner */}
          {(() => {
            const statusConfig = FNF_STATUS_CONFIG[fnf.status];
            const StatusIcon = statusConfig.icon;
            return (
              <div
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                  fnf.status === "paid"
                    ? "border-green-200 bg-green-50"
                    : fnf.status === "disputed"
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50"
                }`}
              >
                <StatusIcon
                  className={`h-5 w-5 ${
                    fnf.status === "paid"
                      ? "text-green-600"
                      : fnf.status === "disputed"
                        ? "text-red-600"
                        : "text-amber-600"
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Settlement Status:{" "}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </p>
                  {fnf.notes && (
                    <p className="mt-1 text-xs text-gray-600">{fnf.notes}</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Key Dates */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Key Dates</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fnf.resignation_date && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Resignation Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDate(fnf.resignation_date)}
                  </p>
                </div>
              )}
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Last Working Date
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(fnf.last_working_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Settlement Breakdown */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">
                Settlement Breakdown
              </h2>
            </div>

            <div className="space-y-1">
              <SettlementRow label="Basic Salary" value={fnf.basic_salary} />
              <SettlementRow
                label="Leave Encashment"
                value={fnf.leave_encashment}
              />
              {fnf.earned_leave_balance !== null && (
                <div className="flex items-center justify-between border-b border-gray-50 py-3">
                  <span className="text-xs text-gray-400">
                    ({fnf.earned_leave_balance} earned leave days)
                  </span>
                  <span />
                </div>
              )}
              <SettlementRow label="Gratuity" value={fnf.gratuity} />
              <SettlementRow label="Bonus" value={fnf.bonus} />
              <SettlementRow
                label="Deductions"
                value={fnf.deductions}
                isDeduction
              />
              {fnf.deduction_notes && (
                <div className="border-b border-gray-50 pb-3">
                  <p className="text-xs text-gray-400">
                    Deduction notes: {fnf.deduction_notes}
                  </p>
                </div>
              )}
              <SettlementRow
                label="Net Payable"
                value={fnf.net_payable}
                isHighlight
              />
            </div>
          </div>

          {/* Processed By Info */}
          {(fnf.processor || fnf.approver) && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                Processing Details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {fnf.processor && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Processed By
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {fnf.processor.full_name}
                    </p>
                  </div>
                )}
                {fnf.approver && (
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Approved By
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {fnf.approver.full_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
