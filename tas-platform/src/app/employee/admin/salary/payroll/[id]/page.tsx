import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, IndianRupee, FileText } from "lucide-react";
import { hasPermission } from "@/lib/constants/roles";
import type { Employee, SalarySlip } from "@/types/employee";

export default async function PayrollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentEmployee } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (
    !currentEmployee ||
    !hasPermission((currentEmployee as Employee).role, "admin:access")
  ) {
    redirect("/employee");
  }

  // Fetch payroll run
  const { data: run } = await supabase
    .from("payroll_runs")
    .select("*")
    .eq("id", id)
    .single();

  if (!run) redirect("/employee/admin/salary/payroll");

  // Fetch salary slips with employee details
  const { data: slips } = await supabase
    .from("salary_slips")
    .select(
      "*, employee:employees(full_name, designation, department)"
    )
    .eq("payroll_run_id", id)
    .order("employee_id");

  const allSlips = (slips || []) as (SalarySlip & {
    employee: {
      full_name: string;
      designation: string | null;
      department: string | null;
    };
  })[];

  const monthLabel = new Date(run.month_year + "-01").toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/employee/admin/salary/payroll"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Payroll — {monthLabel}
          </h1>
          <p className="text-sm text-gray-500">
            {run.total_employees} employees | Status: {run.status}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Total Gross</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            INR {Number(run.total_gross).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Total Deductions</p>
          <p className="mt-1 text-xl font-bold text-red-600">
            INR {Number(run.total_deductions).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500">Total Net Pay</p>
          <p className="mt-1 text-xl font-bold text-green-700">
            INR {Number(run.total_net).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Salary Slips Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Working Days
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  LOP
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Gross
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Deductions
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Net Pay
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allSlips.map((slip) => (
                <tr
                  key={slip.id}
                  className="transition hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {slip.employee.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {slip.employee.department || ""}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {slip.days_present}/{slip.total_working_days}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${Number(slip.lop_days) > 0 ? "text-red-600" : "text-gray-600"}`}
                    >
                      {slip.lop_days}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {Number(slip.gross_earnings).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {Number(slip.total_deductions).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-700">
                    {Number(slip.net_pay).toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    {slip.document_id ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <FileText size={14} />
                        Generated
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
