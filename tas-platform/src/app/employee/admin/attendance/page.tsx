import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Upload, Calendar } from "lucide-react";
import { hasPermission } from "@/lib/constants/roles";
import type { Employee, AttendanceUpload } from "@/types/employee";

export default async function AdminAttendancePage() {
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

  const { data: uploads } = await supabase
    .from("attendance_uploads")
    .select(
      "*, uploader:employees!attendance_uploads_uploaded_by_fkey(full_name)"
    )
    .order("created_at", { ascending: false });

  const allUploads = (uploads ?? []) as (AttendanceUpload & {
    uploader: { full_name: string } | null;
  })[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
            <Clock size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-500">
              {allUploads.length} upload(s)
            </p>
          </div>
        </div>
        <Link
          href="/employee/admin/attendance/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          <Upload size={16} />
          Upload Attendance
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Month
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  File
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Records
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Uploaded By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allUploads.map((upload) => (
                <tr
                  key={upload.id}
                  className="transition hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {new Date(
                        upload.month_year + "-01"
                      ).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {upload.file_name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {upload.records_count} records
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {upload.uploader?.full_name || "Unknown"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar size={14} />
                      {new Date(upload.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {allUploads.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No attendance uploads yet. Upload a CSV to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
