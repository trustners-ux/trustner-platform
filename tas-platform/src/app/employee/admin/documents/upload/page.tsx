"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2, FileUp, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadDocument } from "@/lib/auth/admin-actions";
import type { Employee, DocumentCategory } from "@/types/employee";

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "salary_slip", label: "Salary Slip" },
  { value: "hr_policy", label: "HR Policy" },
  { value: "leave_encashment", label: "Leave Encashment" },
  { value: "appointment_letter", label: "Appointment Letter" },
  { value: "increment_letter", label: "Increment Letter" },
  { value: "fnf_settlement", label: "F&F Settlement" },
  { value: "handbook", label: "Employee Handbook" },
  { value: "other", label: "Other" },
];

export default function UploadDocumentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCompanyWide, setIsCompanyWide] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [category, setCategory] = useState<DocumentCategory>("other");

  useEffect(() => {
    async function fetchEmployees() {
      const supabase = createClient();
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("is_active", true)
        .order("full_name");
      if (data) setEmployees(data as Employee[]);
    }
    fetchEmployees();
  }, []);

  function toggleEmployee(id: string) {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!selectedFile) {
      setError("Please select a file to upload");
      setIsSubmitting(false);
      return;
    }

    formData.set("file", selectedFile);
    formData.set("is_company_wide", isCompanyWide.toString());
    formData.set("category", category);

    if (!isCompanyWide) {
      // Clear any existing employee_ids
      formData.delete("employee_ids");
      selectedEmployees.forEach((id) => {
        formData.append("employee_ids", id);
      });
    }

    const result = await uploadDocument(formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push("/employee/admin/documents");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/employee/admin/documents"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Upload Document</h1>
          <p className="text-sm text-gray-500">
            Upload and assign documents to employees
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Document Title *
              </label>
              <input
                name="title"
                type="text"
                required
                placeholder="e.g. Salary Slip - March 2025"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Optional description..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Year */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Month/Year (for salary slips)
              </label>
              <input
                name="month_year"
                type="month"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              File *
            </label>
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition hover:border-primary-300">
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileUp size={20} className="text-primary-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="ml-2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">
                    Click to select a file
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    PDF, DOC, XLSX, or images up to 10MB
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Assignment */}
          <div>
            <label className="mb-3 block text-xs font-semibold text-gray-700">
              Assign To
            </label>
            <div className="mb-4 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignment_type"
                  checked={isCompanyWide}
                  onChange={() => setIsCompanyWide(true)}
                  className="h-4 w-4 text-primary-500 focus:ring-primary-50"
                />
                <span className="text-sm font-medium text-gray-700">
                  All Employees
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="assignment_type"
                  checked={!isCompanyWide}
                  onChange={() => setIsCompanyWide(false)}
                  className="h-4 w-4 text-primary-500 focus:ring-primary-50"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select Employees
                </span>
              </label>
            </div>

            {!isCompanyWide && (
              <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 p-3">
                {employees.length > 0 ? (
                  <div className="space-y-1">
                    {employees.map((emp) => (
                      <label
                        key={emp.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50"
                      >
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                            selectedEmployees.includes(emp.id)
                              ? "border-primary-500 bg-primary-500"
                              : "border-gray-300"
                          }`}
                          onClick={() => toggleEmployee(emp.id)}
                        >
                          {selectedEmployees.includes(emp.id) && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {emp.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {emp.department || emp.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-gray-400">
                    Loading employees...
                  </p>
                )}
                {selectedEmployees.length > 0 && (
                  <p className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-500">
                    {selectedEmployees.length} employee(s) selected
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/employee/admin/documents"
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
