"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  applyForLeave,
  cancelLeave,
  type LeaveFormData,
} from "@/lib/auth/leave-actions";
import type { LeaveRecord, LeaveStatus, LeaveType } from "@/types/employee";
import { formatDate } from "@/lib/utils/formatters";
import {
  CalendarDays,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  AlertCircle,
  History,
} from "lucide-react";

const leaveFormSchema = z
  .object({
    leave_type: z.enum([
      "casual",
      "sick",
      "earned",
      "compensatory",
      "maternity",
      "paternity",
      "unpaid",
    ]),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    reason: z.string().min(3, "Reason must be at least 3 characters"),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: "End date must be on or after start date",
    path: ["end_date"],
  });

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: "Casual Leave",
  sick: "Sick Leave",
  earned: "Earned Leave",
  compensatory: "Compensatory Off",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  unpaid: "Unpaid Leave",
};

const STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-500",
    icon: Ban,
  },
};

export default function LeavePage() {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leave_type: "casual",
      start_date: "",
      end_date: "",
      reason: "",
    },
  });

  // Fetch leave records
  async function fetchLeaveRecords() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Get employee record first
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!employee) return;

    const { data } = await supabase
      .from("leave_records")
      .select("*")
      .eq("employee_id", employee.id)
      .order("applied_at", { ascending: false });

    setLeaveRecords((data as LeaveRecord[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchLeaveRecords();
  }, []);

  // Handle form submission
  function onSubmit(data: LeaveFormData) {
    setSubmitMessage(null);
    startTransition(async () => {
      const result = await applyForLeave(data);
      if (result.success) {
        setSubmitMessage({ type: "success", text: "Leave application submitted successfully!" });
        reset();
        // Refresh leave records
        await fetchLeaveRecords();
      } else {
        setSubmitMessage({
          type: "error",
          text: result.error || "Failed to submit leave application.",
        });
      }
    });
  }

  // Handle leave cancellation
  async function handleCancel(leaveId: string) {
    setCancellingId(leaveId);
    const result = await cancelLeave(leaveId);
    if (result.success) {
      setSubmitMessage({ type: "success", text: "Leave request cancelled." });
      await fetchLeaveRecords();
    } else {
      setSubmitMessage({
        type: "error",
        text: result.error || "Failed to cancel leave request.",
      });
    }
    setCancellingId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Apply for leave and track your leave history.
        </p>
      </div>

      {/* Status Message */}
      {submitMessage && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${
            submitMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {submitMessage.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {submitMessage.text}
        </div>
      )}

      {/* Apply for Leave Form */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Apply for Leave</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Leave Type */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Leave Type
              </label>
              <select
                {...register("leave_type")}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((type) => (
                  <option key={type} value={type}>
                    {LEAVE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              {errors.leave_type && (
                <p className="mt-1 text-xs text-red-500">{errors.leave_type.message}</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                {...register("start_date")}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                {...register("end_date")}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              {errors.end_date && (
                <p className="mt-1 text-xs text-red-500">{errors.end_date.message}</p>
              )}
            </div>

            {/* Reason */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason
              </label>
              <textarea
                {...register("reason")}
                rows={3}
                placeholder="Please describe the reason for your leave..."
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              {errors.reason && (
                <p className="mt-1 text-xs text-red-500">{errors.reason.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Leave History */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <History className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-bold text-gray-900">Leave History</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : leaveRecords.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No leave records found. Apply for your first leave above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-3 pr-4 text-left text-xs font-bold uppercase text-gray-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-400">
                    From
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-400">
                    To
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-400">
                    Days
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-400">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-400">
                    Status
                  </th>
                  <th className="py-3 pl-4 text-right text-xs font-bold uppercase text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaveRecords.map((record) => {
                  const statusConfig = STATUS_CONFIG[record.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={record.id}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-3 pr-4 text-sm font-medium text-gray-900">
                        {LEAVE_TYPE_LABELS[record.leave_type]}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(record.start_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(record.end_date)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                        {record.days}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-600">
                        {record.reason || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-right">
                        {record.status === "pending" && (
                          <button
                            onClick={() => handleCancel(record.id)}
                            disabled={cancellingId === record.id}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                          >
                            {cancellingId === record.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
