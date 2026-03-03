"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Loader2,
  FileUp,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { uploadAttendanceCsv } from "@/lib/auth/attendance-actions";

export default function UploadAttendancePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [monthYear, setMonthYear] = useState("");
  const [result, setResult] = useState<{
    records_processed: number;
    unmatched?: string[];
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    if (!selectedFile) {
      setError("Please select a CSV file");
      setIsSubmitting(false);
      return;
    }
    if (!monthYear) {
      setError("Please select the month/year");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.set("file", selectedFile);
    formData.set("month_year", monthYear);

    const res = await uploadAttendanceCsv(formData);

    if (res?.error) {
      setError(res.error);
      setIsSubmitting(false);
    } else if (res?.success) {
      setResult({
        records_processed: res.records_processed || 0,
        unmatched: res.unmatched,
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/employee/admin/attendance"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Upload Attendance
          </h1>
          <p className="text-sm text-gray-500">
            Upload monthly attendance CSV from your biometric/HRMS system
          </p>
        </div>
      </div>

      {result && (
        <div className="rounded-xl bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 size={18} />
            <span className="text-sm font-semibold">
              Successfully processed {result.records_processed} attendance
              records
            </span>
          </div>
          {result.unmatched && result.unmatched.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-amber-700">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold">
                  Unmatched employees ({result.unmatched.length}):
                </p>
                <p className="text-xs">{result.unmatched.join(", ")}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => router.push("/employee/admin/attendance")}
            className="mt-3 text-sm font-semibold text-green-700 underline"
          >
            Back to Attendance
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Month / Year *
            </label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              required
              className="w-full max-w-xs rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Attendance CSV File *
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
                  <Upload
                    size={24}
                    className="mx-auto mb-2 text-gray-400"
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Click to select a CSV file
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    CSV or Excel file with attendance data
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setSelectedFile(f);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700">
              Expected CSV Format:
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Columns: Employee Name, Date, In Time, Out Time, Status
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Status values: Present, Absent, Half Day, Weekend, Holiday,
              Leave
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Time format: HH:MM (24-hour)
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/employee/admin/attendance"
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
                  Processing...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload & Process
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
