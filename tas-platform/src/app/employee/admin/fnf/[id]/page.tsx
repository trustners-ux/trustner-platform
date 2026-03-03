import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { updateFnFStatus } from "@/lib/auth/admin-actions";
import type { FnFSettlement, Employee } from "@/types/employee";

export default async function FnFDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: settlement } = await supabase
    .from("fnf_settlements")
    .select("*, employee:employees!fnf_settlements_employee_id_fkey(full_name, email, designation, department, date_of_joining)")
    .eq("id", id)
    .single();

  if (!settlement) notFound();

  const s = settlement as FnFSettlement & { employee: Employee };

  const statusFlow: Record<string, { next: string; label: string; color: string }> = {
    draft: { next: "pending_approval", label: "Submit for Approval", color: "bg-amber-500 hover:bg-amber-600" },
    pending_approval: { next: "approved", label: "Approve", color: "bg-blue-500 hover:bg-blue-600" },
    approved: { next: "paid", label: "Mark as Paid", color: "bg-green-500 hover:bg-green-600" },
  };

  const nextStep = statusFlow[s.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employee/admin/fnf" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">F&F Settlement Details</h1>
      </div>

      {/* Employee Info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Employee Details</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <InfoRow label="Name" value={s.employee.full_name} />
          <InfoRow label="Email" value={s.employee.email} />
          <InfoRow label="Designation" value={s.employee.designation || "—"} />
          <InfoRow label="Department" value={s.employee.department || "—"} />
          <InfoRow label="Last Working Date" value={new Date(s.last_working_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
          <InfoRow label="Resignation Date" value={s.resignation_date ? new Date(s.resignation_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
        </div>
      </div>

      {/* Settlement Breakdown */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Settlement Breakdown</h2>
        <div className="space-y-3">
          <SettlementRow label="Basic Salary" amount={s.basic_salary} />
          <SettlementRow label="Leave Encashment" amount={s.leave_encashment} />
          <SettlementRow label="Gratuity" amount={s.gratuity} />
          <SettlementRow label="Bonus" amount={s.bonus} />
          <div className="border-t border-gray-200 pt-3">
            <SettlementRow label="Deductions" amount={s.deductions} isDeduction />
            {s.deduction_notes && <p className="ml-4 text-xs text-gray-400">{s.deduction_notes}</p>}
          </div>
          <div className="border-t-2 border-gray-900 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">Net Payable</p>
              <p className="text-xl font-bold text-green-600">
                ₹{s.net_payable ? Number(s.net_payable).toLocaleString("en-IN") : "0"}
              </p>
            </div>
          </div>
        </div>
        {s.earned_leave_balance && (
          <p className="mt-4 text-xs text-gray-500">Earned Leave Balance: {s.earned_leave_balance} days</p>
        )}
        {s.notes && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-semibold text-gray-600">Notes</p>
            <p className="mt-1 text-sm text-gray-700">{s.notes}</p>
          </div>
        )}
      </div>

      {/* Status & Actions */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Status</h2>
            <FnFStatusBadge status={s.status} />
          </div>
          {nextStep && (
            <form action={async () => { "use server"; await updateFnFStatus(s.id, nextStep.next); }}>
              <button type="submit" className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${nextStep.color}`}>
                {nextStep.label}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function SettlementRow({ label, amount, isDeduction }: { label: string; amount: number | null; isDeduction?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-sm font-semibold ${isDeduction ? "text-red-600" : "text-gray-900"}`}>
        {isDeduction ? "- " : ""}₹{amount ? Number(amount).toLocaleString("en-IN") : "0"}
      </p>
    </div>
  );
}

function FnFStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    pending_approval: "bg-amber-50 text-amber-700",
    approved: "bg-blue-50 text-blue-700",
    paid: "bg-green-50 text-green-700",
    disputed: "bg-red-50 text-red-700",
  };
  return (
    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.draft}`}>
      {status.replace("_", " ")}
    </span>
  );
}
