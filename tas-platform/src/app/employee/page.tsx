import { createClient } from "@/lib/supabase/server";
import {
  FileText,
  Megaphone,
  CalendarDays,
  Users,
  Pin,
  Clock,
} from "lucide-react";
import Link from "next/link";
import type { Employee, Announcement } from "@/types/employee";

export default async function EmployeeDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("auth_user_id", user!.id)
    .single();

  // Fetch recent announcements
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*, author:employees!announcements_created_by_fkey(full_name)")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(5);

  // Fetch document count for this employee
  const { count: docCount } = await supabase
    .from("document_assignments")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", (employee as Employee).id);

  // Fetch pending leave count
  const { count: pendingLeaves } = await supabase
    .from("leave_records")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", (employee as Employee).id)
    .eq("status", "pending");

  const emp = employee as Employee;

  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary p-6 text-white">
        <h1 className="text-2xl font-bold">
          {greeting}, {emp.full_name.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Welcome to your employee portal. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="My Documents"
          value={docCount ?? 0}
          href="/employee/documents"
          color="blue"
        />
        <StatCard
          icon={CalendarDays}
          label="Pending Leaves"
          value={pendingLeaves ?? 0}
          href="/employee/leave"
          color="amber"
        />
        <StatCard
          icon={Megaphone}
          label="Announcements"
          value={announcements?.length ?? 0}
          href="/employee/announcements"
          color="purple"
        />
        <StatCard
          icon={Users}
          label="Department"
          value={emp.department || "—"}
          href="/employee/profile"
          color="green"
        />
      </div>

      {/* Recent Announcements */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Recent Announcements
          </h2>
          <Link
            href="/employee/announcements"
            className="text-sm font-medium text-primary-500 hover:underline"
          >
            View All
          </Link>
        </div>

        {announcements && announcements.length > 0 ? (
          <div className="space-y-3">
            {announcements.map((a: Announcement & { author?: { full_name: string } }) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-gray-50 bg-gray-50/50 p-4"
              >
                {a.is_pinned && (
                  <Pin size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getCategoryColor(a.category)}`}
                    >
                      {a.category.replace("_", " ")}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={10} />
                      {new Date(a.published_at!).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-sm font-semibold text-gray-900">
                    {a.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {a.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">
            No announcements yet.
          </p>
        )}
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
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getCategoryColor(category: string) {
  const map: Record<string, string> = {
    general: "bg-gray-100 text-gray-600",
    newsletter: "bg-blue-100 text-blue-700",
    policy_update: "bg-purple-100 text-purple-700",
    event: "bg-green-100 text-green-700",
    urgent: "bg-red-100 text-red-700",
  };
  return map[category] || map.general;
}
