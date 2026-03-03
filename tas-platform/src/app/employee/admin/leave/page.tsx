import { createClient } from "@/lib/supabase/server";
import { approveLeave, rejectLeave } from "@/lib/auth/admin-actions";
import { CalendarDays, Check, X } from "lucide-react";
import type { LeaveRecord, Employee } from "@/types/employee";

export default async function AdminLeavePage() {
  const supabase = await createClient();

  const { data: pendingLeaves } = await supabase
    .from("leave_records")
    .select("*, employee:employees!leave_records_employee_id_fkey(full_name, email, department)")
    .eq("status", "pending")
    .order("applied_at", { ascending: false });

  const { data: recentLeaves } = await supabase
    .from("leave_records")
    .select("*, employee:employees!leave_records_employee_id_fkey(full_name, email)")
    .neq("status", "pending")
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="text-sm text-gray-500">Review and manage employee leave requests</p>
      </div>

      {/* Pending Requests */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Pending Requests ({pendingLeaves?.length || 0})
        </h2>

        {pendingLeaves && pendingLeaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Dates</th>
                  <th className="pb-3 pr-4">Days</th>
                  <th className="pb-3 pr-4">Reason</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingLeaves.map((leave: LeaveRecord & { employee?: { full_name: string; email: string; department: string } }) => (
                  <tr key={leave.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 pr-4">
                      <p className="font-medium text-gray-900">{leave.employee?.full_name}</p>
                      <p className="text-xs text-gray-400">{leave.employee?.department}</p>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {leave.leave_type}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-gray-600">
                      {new Date(leave.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {" - "}
                      {new Date(leave.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3.5 pr-4 font-medium text-gray-900">{leave.days}</td>
                    <td className="max-w-[200px] truncate py-3.5 pr-4 text-gray-500">{leave.reason || "—"}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <form action={async () => { "use server"; await approveLeave(leave.id); }}>
                          <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100">
                            <Check size={12} /> Approve
                          </button>
                        </form>
                        <form action={async () => { "use server"; await rejectLeave(leave.id); }}>
                          <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100">
                            <X size={12} /> Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8">
            <CalendarDays size={32} className="mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No pending leave requests</p>
          </div>
        )}
      </div>

      {/* Recent Decisions */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Recent Decisions</h2>
        {recentLeaves && recentLeaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Dates</th>
                  <th className="pb-3 pr-4">Days</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLeaves.map((leave: LeaveRecord & { employee?: { full_name: string } }) => (
                  <tr key={leave.id}>
                    <td className="py-3 pr-4 font-medium text-gray-900">{leave.employee?.full_name}</td>
                    <td className="py-3 pr-4 text-gray-600">{leave.leave_type}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      {new Date(leave.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - {new Date(leave.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-3 pr-4 text-gray-900">{leave.days}</td>
                    <td className="py-3">
                      <LeaveStatusBadge status={leave.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">No recent leave decisions</p>
        )}
      </div>
    </div>
  );
}

function LeaveStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    pending: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
