import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus, Calculator } from "lucide-react";
import type { FnFSettlement, Employee } from "@/types/employee";

export default async function AdminFnFPage() {
  const supabase = await createClient();

  const { data: settlements } = await supabase
    .from("fnf_settlements")
    .select("*, employee:employees!fnf_settlements_employee_id_fkey(full_name, email, designation)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">F&F Settlements</h1>
          <p className="text-sm text-gray-500">Full and Final settlement management</p>
        </div>
        <Link
          href="/employee/admin/fnf/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          <Plus size={16} />
          New F&F Settlement
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {settlements && settlements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="p-5 pb-3">Employee</th>
                  <th className="p-5 pb-3">Last Working Date</th>
                  <th className="p-5 pb-3">Net Payable</th>
                  <th className="p-5 pb-3">Status</th>
                  <th className="p-5 pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {settlements.map((s: FnFSettlement & { employee?: { full_name: string; email: string; designation: string } }) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="p-5">
                      <p className="font-medium text-gray-900">{s.employee?.full_name}</p>
                      <p className="text-xs text-gray-400">{s.employee?.designation}</p>
                    </td>
                    <td className="p-5 text-gray-600">
                      {new Date(s.last_working_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-5 font-semibold text-gray-900">
                      {s.net_payable ? `₹${Number(s.net_payable).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="p-5">
                      <FnFStatusBadge status={s.status} />
                    </td>
                    <td className="p-5">
                      <Link href={`/employee/admin/fnf/${s.id}`} className="text-sm font-medium text-primary-500 hover:underline">
                        View / Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12">
            <Calculator size={32} className="mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No F&F settlements yet</p>
          </div>
        )}
      </div>
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
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.draft}`}>
      {status.replace("_", " ")}
    </span>
  );
}
