import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { IndianRupee, Users, Settings, AlertTriangle } from "lucide-react";
import { hasPermission } from "@/lib/constants/roles";
import type { Employee, SalaryStructure } from "@/types/employee";

export default async function AdminSalaryPage() {
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

  // Fetch all active employees
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("is_active", true)
    .order("full_name");

  // Fetch active salary structures
  const { data: structures } = await supabase
    .from("salary_structures")
    .select("*")
    .eq("is_active", true);

  const structureMap = new Map<string, SalaryStructure>();
  for (const s of (structures || []) as SalaryStructure[]) {
    structureMap.set(s.employee_id, s);
  }

  const allEmployees = (employees || []) as Employee[];
  const withStructure = allEmployees.filter((e) => structureMap.has(e.id));
  const withoutStructure = allEmployees.filter((e) => !structureMap.has(e.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <IndianRupee size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Salary & Payroll
            </h1>
            <p className="text-sm text-gray-500">
              {withStructure.length} of {allEmployees.length} employees have
              salary structures
            </p>
          </div>
        </div>
        <Link
          href="/employee/admin/salary/payroll"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          <Settings size={16} />
          Payroll Runs
        </Link>
      </div>

      {/* Missing structures warning */}
      {withoutStructure.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={18} />
            <span className="text-sm font-semibold">
              {withoutStructure.length} employee(s) missing salary structure
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-600">
            {withoutStructure.map((e) => e.full_name).join(", ")}
          </p>
        </div>
      )}

      {/* Employee salary structures table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  CTC (Annual)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Basic (Monthly)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allEmployees.map((emp) => {
                const structure = structureMap.get(emp.id);
                return (
                  <tr
                    key={emp.id}
                    className="transition hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                          {emp.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {emp.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {emp.designation || emp.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {emp.department || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {structure
                        ? `INR ${Number(structure.ctc_annual).toLocaleString("en-IN")}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {structure
                        ? `INR ${Number(structure.basic).toLocaleString("en-IN")}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {structure ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          Not Set
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/employee/admin/salary/structure/${emp.id}`}
                        className="text-sm font-semibold text-primary-500 hover:underline"
                      >
                        {structure ? "Edit" : "Set Up"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
