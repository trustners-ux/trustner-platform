"use server";

import { createClient } from "@/lib/supabase/server";
import { getEmployee } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { differenceInCalendarDays } from "date-fns";

const leaveSchema = z
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
    reason: z.string().min(3, "Please provide a reason (at least 3 characters)"),
  })
  .refine(
    (data) => new Date(data.end_date) >= new Date(data.start_date),
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  );

export type LeaveFormData = z.infer<typeof leaveSchema>;

export type LeaveActionResult = {
  success: boolean;
  error?: string;
};

export async function applyForLeave(data: LeaveFormData): Promise<LeaveActionResult> {
  const employee = await getEmployee();
  if (!employee) {
    return { success: false, error: "You must be logged in to apply for leave." };
  }

  const parsed = leaveSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { success: false, error: firstError?.message || "Invalid form data." };
  }

  const { leave_type, start_date, end_date, reason } = parsed.data;

  // Calculate number of days (inclusive of both start and end)
  const days = differenceInCalendarDays(new Date(end_date), new Date(start_date)) + 1;

  if (days < 1) {
    return { success: false, error: "Invalid date range." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("leave_records").insert({
    employee_id: employee.id,
    leave_type,
    start_date,
    end_date,
    days,
    reason,
    status: "pending",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/employee/leave");
  return { success: true };
}

export async function cancelLeave(leaveId: string): Promise<LeaveActionResult> {
  const employee = await getEmployee();
  if (!employee) {
    return { success: false, error: "You must be logged in." };
  }

  const supabase = await createClient();

  // Verify the leave record belongs to this employee and is still pending
  const { data: leaveRecord, error: fetchError } = await supabase
    .from("leave_records")
    .select("id, employee_id, status")
    .eq("id", leaveId)
    .single();

  if (fetchError || !leaveRecord) {
    return { success: false, error: "Leave record not found." };
  }

  if (leaveRecord.employee_id !== employee.id) {
    return { success: false, error: "You can only cancel your own leave requests." };
  }

  if (leaveRecord.status !== "pending") {
    return {
      success: false,
      error: `Cannot cancel a leave request that is already ${leaveRecord.status}.`,
    };
  }

  const { error: updateError } = await supabase
    .from("leave_records")
    .update({ status: "cancelled" })
    .eq("id", leaveId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/employee/leave");
  return { success: true };
}
