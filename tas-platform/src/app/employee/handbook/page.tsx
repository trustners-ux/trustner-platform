import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee } from "@/lib/auth/actions";
import { formatDate } from "@/lib/utils/formatters";
import type { Document } from "@/types/employee";
import { BookOpen, FolderOpen } from "lucide-react";
import DocumentDownloadButton from "../documents/download-button";

export default async function HandbookPage() {
  const employee = await getEmployee();
  if (!employee) redirect("/login");

  const supabase = await createClient();

  // Fetch handbook documents (company-wide or assigned to this employee)
  const { data: companyDocs } = await supabase
    .from("documents")
    .select("*")
    .eq("category", "handbook")
    .eq("is_company_wide", true)
    .order("created_at", { ascending: false });

  const { data: assignments } = await supabase
    .from("document_assignments")
    .select("*, document:documents(*)")
    .eq("employee_id", employee.id);

  const assignedHandbooks: Document[] = (assignments || [])
    .map((a: { document: Document }) => a.document)
    .filter((d: Document | null) => d && d.category === "handbook");

  const allCompanyHandbooks: Document[] = companyDocs || [];

  // Merge and deduplicate
  const assignedIds = new Set(assignedHandbooks.map((d) => d.id));
  const handbookDocs = [
    ...assignedHandbooks,
    ...allCompanyHandbooks.filter((d) => !assignedIds.has(d.id)),
  ];

  // Sort by date descending
  handbookDocs.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Handbook</h1>
        <p className="mt-1 text-sm text-gray-500">
          Company policies, guidelines, and important documents for all
          employees.
        </p>
      </div>

      {handbookDocs.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="py-8 text-center text-sm text-gray-400">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            No handbook documents available yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {handbookDocs.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                  Handbook
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {doc.title}
                </h3>
                {doc.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {doc.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {doc.file_name}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Updated {formatDate(doc.created_at)}
                </p>
              </div>

              <div className="mt-4">
                <DocumentDownloadButton
                  filePath={doc.file_path}
                  fileName={doc.file_name}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
