import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee } from "@/lib/auth/actions";
import { formatDate } from "@/lib/utils/formatters";
import type { Document, DocumentCategory } from "@/types/employee";
import { FileText, Download, FolderOpen, Shield, Receipt, Gift, File, BookOpen } from "lucide-react";
import DocumentDownloadButton from "./download-button";

const CATEGORY_CONFIG: Record<
  DocumentCategory,
  { label: string; color: string; icon: typeof FileText }
> = {
  salary_slip: {
    label: "Salary Slip",
    color: "bg-green-100 text-green-700",
    icon: Receipt,
  },
  hr_policy: {
    label: "HR Policy",
    color: "bg-purple-100 text-purple-700",
    icon: Shield,
  },
  leave_encashment: {
    label: "Leave Encashment",
    color: "bg-blue-100 text-blue-700",
    icon: Gift,
  },
  appointment_letter: {
    label: "Appointment Letter",
    color: "bg-amber-100 text-amber-700",
    icon: FileText,
  },
  increment_letter: {
    label: "Increment Letter",
    color: "bg-teal-100 text-teal-700",
    icon: FileText,
  },
  fnf_settlement: {
    label: "F&F Settlement",
    color: "bg-red-100 text-red-700",
    icon: FileText,
  },
  handbook: {
    label: "Employee Handbook",
    color: "bg-indigo-100 text-indigo-700",
    icon: BookOpen,
  },
  other: {
    label: "Other",
    color: "bg-gray-100 text-gray-700",
    icon: File,
  },
};

type FilterTab = "all" | "salary_slip" | "hr_policy" | "leave_encashment" | "other";

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "salary_slip", label: "Salary Slips" },
  { id: "hr_policy", label: "HR Policies" },
  { id: "leave_encashment", label: "Leave Encashment" },
  { id: "other", label: "Others" },
];

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const employee = await getEmployee();
  if (!employee) redirect("/login");

  const params = await searchParams;
  const activeFilter = (params.filter || "all") as FilterTab;

  const supabase = await createClient();

  // Fetch documents assigned to this employee
  const { data: assignments } = await supabase
    .from("document_assignments")
    .select("*, document:documents(*)")
    .eq("employee_id", employee.id);

  // Fetch company-wide documents
  const { data: companyDocs } = await supabase
    .from("documents")
    .select("*")
    .eq("is_company_wide", true)
    .order("created_at", { ascending: false });

  // Merge assigned documents and company-wide documents, removing duplicates
  const assignedDocs: Document[] = (assignments || [])
    .map((a: { document: Document }) => a.document)
    .filter(Boolean);
  const allCompanyDocs: Document[] = companyDocs || [];

  const assignedIds = new Set(assignedDocs.map((d) => d.id));
  const mergedDocs = [
    ...assignedDocs,
    ...allCompanyDocs.filter((d) => !assignedIds.has(d.id)),
  ];

  // Apply category filter
  let filteredDocs = mergedDocs;
  if (activeFilter !== "all") {
    if (activeFilter === "other") {
      // "Others" includes everything not in the main three categories
      filteredDocs = mergedDocs.filter(
        (d) =>
          d.category !== "salary_slip" &&
          d.category !== "hr_policy" &&
          d.category !== "leave_encashment"
      );
    } else {
      filteredDocs = mergedDocs.filter((d) => d.category === activeFilter);
    }
  }

  // Sort by date descending
  filteredDocs.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and download your documents, salary slips, and HR policies.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <a
              key={tab.id}
              href={`/employee/documents${tab.id === "all" ? "" : `?filter=${tab.id}`}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      {/* Document Cards */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="py-8 text-center text-sm text-gray-400">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            No documents found in this category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => {
            const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other;
            const DocIcon = config.icon;

            return (
              <div
                key={doc.id}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                    <DocIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}
                  >
                    {config.label}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{doc.file_name}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Uploaded {formatDate(doc.created_at)}
                  </p>
                </div>

                <div className="mt-4">
                  <DocumentDownloadButton
                    filePath={doc.file_path}
                    fileName={doc.file_name}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
