import { redirect } from "next/navigation";
import { getEmployee } from "@/lib/auth/actions";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/formatters";
import {
  UserCircle,
  Mail,
  Phone,
  Briefcase,
  Building2,
  CalendarDays,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { Employee } from "@/types/employee";

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const employee = (await getEmployee()) as Employee | null;
  if (!employee) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your personal and employment details.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* Avatar & Name Header */}
        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200">
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={employee.full_name}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <UserCircle className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {employee.full_name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              {employee.designation && (
                <span className="text-sm text-gray-500">
                  {employee.designation}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[employee.role]}`}
              >
                <ShieldCheck className="h-3 w-3" />
                {ROLE_LABELS[employee.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Fields Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ProfileField
            icon={Mail}
            label="Email Address"
            value={employee.email}
          />
          <ProfileField
            icon={Phone}
            label="Phone Number"
            value={employee.phone}
          />
          <ProfileField
            icon={Briefcase}
            label="Designation"
            value={employee.designation}
          />
          <ProfileField
            icon={Building2}
            label="Department"
            value={employee.department}
          />
          <ProfileField
            icon={CalendarDays}
            label="Date of Joining"
            value={
              employee.date_of_joining
                ? formatDate(employee.date_of_joining)
                : null
            }
          />
          <ProfileField
            icon={ShieldCheck}
            label="Role"
            value={ROLE_LABELS[employee.role]}
          />
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          Profile details are managed by HR. If you need to update any
          information, please contact the HR department.
        </p>
      </div>
    </div>
  );
}
