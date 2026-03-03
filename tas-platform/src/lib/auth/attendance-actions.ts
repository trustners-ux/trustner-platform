"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployee } from "@/lib/auth/actions";
import { hasPermission } from "@/lib/constants/roles";
import type { UserRole, AttendanceMonthlySummary } from "@/types/employee";
import Papa from "papaparse";

async function requireAdmin() {
  const employee = await getEmployee();
  if (!employee) throw new Error("Not authenticated");
  if (!hasPermission(employee.role as UserRole, "admin:access")) {
    throw new Error("Insufficient permissions");
  }
  return employee;
}

function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr || timeStr.trim() === "" || timeStr === "-") return null;
  const cleaned = timeStr.trim();
  // Handle HH:MM or HH:MM:SS format
  const parts = cleaned.split(":");
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export async function uploadAttendanceCsv(formData: FormData) {
  const currentUser = await requireAdmin();
  const admin = createAdminClient();

  const monthYear = formData.get("month_year") as string;
  const file = formData.get("file") as File;

  if (!monthYear || !file) {
    return { error: "Month/year and CSV file are required" };
  }

  // Read file content
  const text = await file.text();

  // Parse CSV
  const { data: rows, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  if (errors.length > 0) {
    return { error: `CSV parsing error: ${errors[0].message}` };
  }

  if (!rows || rows.length === 0) {
    return { error: "CSV file is empty" };
  }

  // Fetch all active employees for matching
  const { data: employees } = await admin
    .from("employees")
    .select("id, full_name, email")
    .eq("is_active", true);

  if (!employees || employees.length === 0) {
    return { error: "No active employees found" };
  }

  // Build lookup maps
  const nameMap = new Map<string, string>();
  const emailMap = new Map<string, string>();
  for (const emp of employees) {
    nameMap.set(emp.full_name.toLowerCase(), emp.id);
    emailMap.set(emp.email.toLowerCase(), emp.id);
  }

  // Create upload record
  const { data: upload, error: uploadErr } = await admin
    .from("attendance_uploads")
    .insert({
      month_year: monthYear,
      file_name: file.name,
      records_count: 0,
      uploaded_by: currentUser.id,
    })
    .select("id")
    .single();

  if (uploadErr) {
    return { error: `Failed to create upload record: ${uploadErr.message}` };
  }

  const records: {
    employee_id: string;
    upload_id: string;
    date: string;
    in_time: string | null;
    out_time: string | null;
    status: string;
    hours_worked: number | null;
    is_late: boolean;
    overtime_hours: number;
    remarks: string | null;
  }[] = [];

  const unmatched: string[] = [];

  for (const row of rows as Record<string, string>[]) {
    // Try to find employee — check various column names
    const empName =
      row.employee_name || row.employee || row.name || row.emp_name || "";
    const empEmail = row.email || row.employee_email || "";
    const empId = row.employee_id || row.emp_id || "";

    let matchedEmployeeId: string | undefined;

    // Try email first, then name
    if (empEmail) {
      matchedEmployeeId = emailMap.get(empEmail.toLowerCase());
    }
    if (!matchedEmployeeId && empName) {
      matchedEmployeeId = nameMap.get(empName.toLowerCase());
    }

    if (!matchedEmployeeId) {
      const identifier = empName || empEmail || empId || "Unknown";
      if (!unmatched.includes(identifier)) {
        unmatched.push(identifier);
      }
      continue;
    }

    // Parse date
    const dateStr = row.date || row.attendance_date || "";
    if (!dateStr) continue;

    // Parse times
    const inTimeStr = row.in_time || row.check_in || row.in || "";
    const outTimeStr = row.out_time || row.check_out || row.out || "";
    const inMinutes = parseTimeToMinutes(inTimeStr);
    const outMinutes = parseTimeToMinutes(outTimeStr);

    // Calculate hours worked
    let hoursWorked: number | null = null;
    if (inMinutes !== null && outMinutes !== null && outMinutes > inMinutes) {
      hoursWorked = Math.round(((outMinutes - inMinutes) / 60) * 100) / 100;
    }

    // Determine status
    const rawStatus = (row.status || "present").toLowerCase().trim();
    let status = "present";
    if (
      rawStatus.includes("absent") ||
      rawStatus === "a" ||
      rawStatus === "ab"
    ) {
      status = "absent";
    } else if (
      rawStatus.includes("half") ||
      rawStatus === "hd" ||
      rawStatus === "h"
    ) {
      status = "half_day";
    } else if (rawStatus.includes("weekend") || rawStatus === "wo") {
      status = "weekend";
    } else if (rawStatus.includes("holiday") || rawStatus === "ho") {
      status = "holiday";
    } else if (
      rawStatus.includes("leave") ||
      rawStatus === "l" ||
      rawStatus === "cl" ||
      rawStatus === "sl" ||
      rawStatus === "el"
    ) {
      status = "leave";
    }

    // Check if late (after 10:00 AM = 600 minutes)
    const isLate = inMinutes !== null && inMinutes > 600 && status === "present";

    // Calculate overtime (more than 8 hours)
    const overtimeHours =
      hoursWorked !== null && hoursWorked > 8
        ? Math.round((hoursWorked - 8) * 100) / 100
        : 0;

    records.push({
      employee_id: matchedEmployeeId,
      upload_id: upload.id,
      date: dateStr,
      in_time: inMinutes !== null ? formatMinutesToTime(inMinutes) : null,
      out_time: outMinutes !== null ? formatMinutesToTime(outMinutes) : null,
      status,
      hours_worked: hoursWorked,
      is_late: isLate,
      overtime_hours: overtimeHours,
      remarks: row.remarks || row.notes || null,
    });
  }

  if (records.length === 0) {
    // Delete the upload record since no records were processed
    await admin.from("attendance_uploads").delete().eq("id", upload.id);
    return {
      error: "No valid attendance records found in the CSV",
      unmatched,
    };
  }

  // Bulk upsert records
  const { error: insertErr } = await admin
    .from("attendance_records")
    .upsert(records, {
      onConflict: "employee_id,date",
      ignoreDuplicates: false,
    });

  if (insertErr) {
    return { error: `Failed to insert records: ${insertErr.message}` };
  }

  // Update upload record count
  await admin
    .from("attendance_uploads")
    .update({ records_count: records.length })
    .eq("id", upload.id);

  revalidatePath("/employee/admin/attendance");
  return {
    success: true,
    records_processed: records.length,
    unmatched: unmatched.length > 0 ? unmatched : undefined,
  };
}

export async function getAttendanceSummary(
  employeeId: string,
  monthYear: string
): Promise<AttendanceMonthlySummary> {
  const supabase = await createClient();

  // Get all records for this employee in this month
  const startDate = `${monthYear}-01`;
  const endDate = `${monthYear}-31`; // PostgreSQL handles month overflow

  const { data: records } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId)
    .gte("date", startDate)
    .lte("date", endDate);

  const allRecords = records || [];

  // Count working days (exclude weekends and holidays)
  const workingRecords = allRecords.filter(
    (r) => r.status !== "weekend" && r.status !== "holiday"
  );

  const daysPresent = allRecords.filter(
    (r) => r.status === "present"
  ).length;
  const daysAbsent = allRecords.filter((r) => r.status === "absent").length;
  const daysHalfDay = allRecords.filter(
    (r) => r.status === "half_day"
  ).length;
  const daysLate = allRecords.filter((r) => r.is_late).length;
  const totalOvertimeHours = allRecords.reduce(
    (sum, r) => sum + (r.overtime_hours || 0),
    0
  );

  return {
    employee_id: employeeId,
    month_year: monthYear,
    total_working_days: workingRecords.length,
    days_present: daysPresent,
    days_absent: daysAbsent,
    days_half_day: daysHalfDay,
    days_late: daysLate,
    total_overtime_hours: totalOvertimeHours,
    lop_days: daysAbsent + daysHalfDay * 0.5,
  };
}

export async function deleteAttendanceUpload(uploadId: string) {
  const currentUser = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("attendance_uploads")
    .delete()
    .eq("id", uploadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employee/admin/attendance");
  return { success: true };
}
