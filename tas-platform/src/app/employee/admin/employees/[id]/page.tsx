import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { hasPermission, ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import type { Employee } from "@/types/employee";
import EmployeeEditForm from "./EmployeeEditForm";

export default async function EmployeeDetailPage({
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

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (!employee) {
    notFound();
  }

  const emp = employee as Employee;
  const isAdmin = (currentEmployee as Employee).role === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/employee/admin/employees"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{emp.full_name}</h1>
          <p className="text-sm text-gray-500">{emp.email}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLORS[emp.role]}`}
        >
          {ROLE_LABELS[emp.role]}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            emp.is_active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {emp.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Employee Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
            Employee Info
          </h2>
          <div className="space-y-4">
            <InfoRow label="Full Name" value={emp.full_name} />
            <InfoRow label="Email" value={emp.email} />
            <InfoRow label="Phone" value={emp.phone || "—"} />
            <InfoRow label="Designation" value={emp.designation || "—"} />
            <InfoRow label="Department" value={emp.department || "—"} />
            <InfoRow
              label="Date of Joining"
              value={
                emp.date_of_joining
                  ? new Date(emp.date_of_joining).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <InfoRow
              label="Joined Portal"
              value={new Date(emp.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <EmployeeEditForm employee={emp} isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}
