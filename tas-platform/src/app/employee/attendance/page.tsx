"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AttendanceRecord } from "@/types/employee";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Timer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  present: { label: "Present", color: "text-green-700", bg: "bg-green-100" },
  absent: { label: "Absent", color: "text-red-700", bg: "bg-red-100" },
  half_day: {
    label: "Half Day",
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  weekend: { label: "Weekend", color: "text-gray-500", bg: "bg-gray-100" },
  holiday: { label: "Holiday", color: "text-blue-700", bg: "bg-blue-100" },
  leave: { label: "Leave", color: "text-purple-700", bg: "bg-purple-100" },
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    async function fetchAttendance() {
      setLoading(true);
      const supabase = createClient();
      const startDate = `${currentMonth}-01`;
      const endDate = `${currentMonth}-31`;

      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

      setRecords((data || []) as AttendanceRecord[]);
      setLoading(false);
    }
    fetchAttendance();
  }, [currentMonth]);

  const changeMonth = (delta: number) => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const monthLabel = new Date(currentMonth + "-01").toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );

  // Calculate summary
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const halfDay = records.filter((r) => r.status === "half_day").length;
  const late = records.filter((r) => r.is_late).length;
  const lopDays = absent + halfDay * 0.5;

  const stats = [
    {
      label: "Present",
      value: present,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Absent",
      value: absent,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Half Day",
      value: halfDay,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Late",
      value: late,
      icon: Timer,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "LOP Days",
      value: lopDays,
      icon: Clock,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your daily attendance records and monthly summary.
        </p>
      </div>

      {/* Month Picker */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => changeMonth(-1)}
          className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-50"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{monthLabel}</h2>
        <button
          onClick={() => changeMonth(1)}
          className="rounded-lg border border-gray-200 p-2 transition hover:bg-gray-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div
                className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <Icon size={18} className={stat.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Records Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Day
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  In Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Out Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-gray-400"
                  >
                    No attendance records found for this month.
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const config =
                    STATUS_CONFIG[record.status] || STATUS_CONFIG.present;
                  const dateObj = new Date(record.date + "T00:00:00");
                  const dayName = dateObj.toLocaleDateString("en-IN", {
                    weekday: "short",
                  });
                  const dateStr = dateObj.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <tr
                      key={record.id}
                      className="transition hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {dateStr}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {dayName}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {record.in_time || "-"}
                        {record.is_late && (
                          <span className="ml-1 text-xs text-orange-500">
                            (Late)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {record.out_time || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {record.hours_worked
                          ? `${record.hours_worked}h`
                          : "-"}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
