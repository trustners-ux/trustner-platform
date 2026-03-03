import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Upload, Calendar } from "lucide-react";
import { hasPermission } from "@/lib/constants/roles";
import type { Employee, Document } from "@/types/employee";

export default async function DocumentsListPage() {
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

  const { data: documents } = await supabase
    .from("documents")
    .select(
      "*, uploader:employees!documents_uploaded_by_fkey(full_name)"
    )
    .order("created_at", { ascending: false });

  // Get assignment counts for each document
  const allDocs = (documents ?? []) as (Document & {
    uploader: { full_name: string } | null;
  })[];

  // Fetch assignment counts
  const docIds = allDocs.map((d) => d.id);
  let assignmentCounts: Record<string, number> = {};

  if (docIds.length > 0) {
    const { data: assignments } = await supabase
      .from("document_assignments")
      .select("document_id");

    if (assignments) {
      for (const a of assignments) {
        assignmentCounts[a.document_id] =
          (assignmentCounts[a.document_id] || 0) + 1;
      }
    }
  }

  const categoryLabels: Record<string, string> = {
    salary_slip: "Salary Slip",
    hr_policy: "HR Policy",
    leave_encashment: "Leave Encashment",
    appointment_letter: "Appointment Letter",
    increment_letter: "Increment Letter",
    fnf_settlement: "F&F Settlement",
    other: "Other",
  };

  const categoryColors: Record<string, string> = {
    salary_slip: "bg-blue-100 text-blue-700",
    hr_policy: "bg-purple-100 text-purple-700",
    leave_encashment: "bg-amber-100 text-amber-700",
    appointment_letter: "bg-green-100 text-green-700",
    increment_letter: "bg-cyan-100 text-cyan-700",
    fnf_settlement: "bg-red-100 text-red-700",
    other: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <FileText size={20} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-500">
              {allDocs.length} document(s) uploaded
            </p>
          </div>
        </div>
        <Link
          href="/employee/admin/documents/upload"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          <Upload size={16} />
          Upload Document
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Assigned To
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Uploaded By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Upload Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="transition hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <FileText size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {doc.title}
                        </p>
                        {doc.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        categoryColors[doc.category] || categoryColors.other
                      }`}
                    >
                      {categoryLabels[doc.category] || doc.category}
                    </span>
                    {doc.month_year && (
                      <span className="ml-2 text-xs text-gray-400">
                        {doc.month_year}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {doc.is_company_wide ? (
                      <span className="text-sm text-gray-600">All Employees</span>
                    ) : (
                      <span className="text-sm text-gray-600">
                        {assignmentCounts[doc.id] || 0} employee(s)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {doc.uploader?.full_name || "Unknown"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar size={14} />
                      {new Date(doc.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {allDocs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No documents uploaded yet.
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
