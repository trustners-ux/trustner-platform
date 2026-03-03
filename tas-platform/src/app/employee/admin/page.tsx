import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  FileText,
  CalendarDays,
  Megaphone,
  Calculator,
  Upload,
  UserPlus,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { hasPermission } from "@/lib/constants/roles";
import type { Employee, UserRole } from "@/types/employee";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!employee || !hasPermission((employee as Employee).role, "admin:access")) {
    redirect("/employee");
  }

  // Fetch summary stats
  const [
    { count: totalEmployees },
    { count: activeDocuments },
    { count: pendingLeaves },
    { count: announcementsCount },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("leave_records")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .not("published_at", "is", null),
  ]);

  // Recent document uploads
  const { data: recentDocs } = await supabase
    .from("documents")
    .select("*, uploader:employees!documents_uploaded_by_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Recent leave requests
  const { data: recentLeaves } = await supabase
    .from("leave_records")
    .select("*, employee:employees!leave_records_employee_id_fkey(full_name)")
    .eq("status", "pending")
    .order("applied_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary p-6 text-white">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} />
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-white/70">
              Manage employees, documents, announcements, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Active Employees"
          value={totalEmployees ?? 0}
          href="/employee/admin/employees"
          color="blue"
        />
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={activeDocuments ?? 0}
          href="/employee/admin/documents"
          color="green"
        />
        <StatCard
          icon={CalendarDays}
          label="Pending Leaves"
          value={pendingLeaves ?? 0}
          href="/employee/admin/leave"
          color="amber"
        />
        <StatCard
          icon={Megaphone}
          label="Announcements"
          value={announcementsCount ?? 0}
          href="/employee/admin/announcements"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={UserPlus}
            label="Add Employee"
            href="/employee/admin/employees/new"
          />
          <QuickAction
            icon={Upload}
            label="Upload Document"
            href="/employee/admin/documents/upload"
          />
          <QuickAction
            icon={Megaphone}
            label="New Announcement"
            href="/employee/admin/announcements/new"
          />
          <QuickAction
            icon={Calculator}
            label="New F&F Settlement"
            href="/employee/admin/fnf/new"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Document Uploads */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Recent Uploads
            </h2>
            <Link
              href="/employee/admin/documents"
              className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:underline"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {recentDocs && recentDocs.length > 0 ? (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-50 bg-gray-50/50 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {(doc.uploader as { full_name: string })?.full_name || "Unknown"} &middot;{" "}
                      {new Date(doc.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    {doc.category.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              No documents uploaded yet.
            </p>
          )}
        </div>

        {/* Pending Leave Requests */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Pending Leave Requests
            </h2>
            <Link
              href="/employee/admin/leave"
              className="flex items-center gap-1 text-sm font-medium text-primary-500 hover:underline"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {recentLeaves && recentLeaves.length > 0 ? (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-50 bg-gray-50/50 p-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                    <Clock size={16} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {(leave.employee as { full_name: string })?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {leave.leave_type.replace("_", " ")} &middot; {leave.days} day(s) &middot;{" "}
                      {new Date(leave.start_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              No pending leave requests.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  href: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className={`mb-3 inline-flex rounded-lg p-2.5 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </Link>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-primary-200 hover:bg-primary-50/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
        <Icon size={18} className="text-primary-500" />
      </div>
      <span className="text-sm font-semibold text-gray-900">{label}</span>
    </Link>
  );
}
