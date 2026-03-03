"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployee } from "@/lib/auth/actions";
import { hasPermission } from "@/lib/constants/roles";
import { getAttendanceSummary } from "./attendance-actions";
import {
  calculateLOP,
  calculateGrossEarnings,
  calculateDeductions,
} from "@/lib/utils/salary-calculator";
import type { UserRole, SalaryStructure } from "@/types/employee";

async function requireAdmin() {
  const employee = await getEmployee();
  if (!employee) throw new Error("Not authenticated");
  if (!hasPermission(employee.role as UserRole, "admin:access")) {
    throw new Error("Insufficient permissions");
  }
  return employee;
}

// ─── Salary Structure Actions ──────────────────────────

export async function createSalaryStructure(data: {
  employee_id: string;
  effective_from: string;
  ctc_annual: number;
  basic: number;
  hra: number;
  dearness_allowance: number;
  conveyance: number;
  medical_allowance: number;
  special_allowance: number;
  pf_employee: number;
  pf_employer: number;
  esi_employee: number;
  esi_employer: number;
  professional_tax: number;
  tds_monthly: number;
  lwf_employee: number;
  lwf_employer: number;
}) {
  const currentUser = await requireAdmin();
  const admin = createAdminClient();

  // Deactivate previous active structure for this employee
  await admin
    .from("salary_structures")
    .update({ is_active: false })
    .eq("employee_id", data.employee_id)
    .eq("is_active", true);

  // Insert new structure
  const { error } = await admin.from("salary_structures").insert({
    ...data,
    is_active: true,
    created_by: currentUser.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employee/admin/salary");
  return { success: true };
}

export async function updateSalaryStructure(
  id: string,
  data: Partial<{
    effective_from: string;
    ctc_annual: number;
    basic: number;
    hra: number;
    dearness_allowance: number;
    conveyance: number;
    medical_allowance: number;
    special_allowance: number;
    pf_employee: number;
    pf_employer: number;
    esi_employee: number;
    esi_employer: number;
    professional_tax: number;
    tds_monthly: number;
    lwf_employee: number;
    lwf_employer: number;
  }>
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("salary_structures")
    .update(data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employee/admin/salary");
  return { success: true };
}

// ─── Payroll Actions ───────────────────────────────────

export async function generatePayroll(monthYear: string) {
  const currentUser = await requireAdmin();
  const admin = createAdminClient();

  // Check if attendance exists for this month
  const { data: uploads } = await admin
    .from("attendance_uploads")
    .select("id")
    .eq("month_year", monthYear);

  if (!uploads || uploads.length === 0) {
    return {
      error: `No attendance data found for ${monthYear}. Please upload attendance first.`,
    };
  }

  // Check existing payroll run
  const { data: existingRun } = await admin
    .from("payroll_runs")
    .select("*")
    .eq("month_year", monthYear)
    .single();

  if (existingRun?.status === "finalized") {
    return {
      error: `Payroll for ${monthYear} is already finalized and cannot be regenerated.`,
    };
  }

  // If a run exists, delete old salary slips to regenerate
  if (existingRun) {
    await admin
      .from("salary_slips")
      .delete()
      .eq("payroll_run_id", existingRun.id);
  }

  // Create or update payroll run
  let payrollRunId: string;
  if (existingRun) {
    await admin
      .from("payroll_runs")
      .update({ status: "processing", generated_by: currentUser.id })
      .eq("id", existingRun.id);
    payrollRunId = existingRun.id;
  } else {
    const { data: newRun, error: runErr } = await admin
      .from("payroll_runs")
      .insert({
        month_year: monthYear,
        status: "processing",
        generated_by: currentUser.id,
      })
      .select("id")
      .single();

    if (runErr) {
      return { error: `Failed to create payroll run: ${runErr.message}` };
    }
    payrollRunId = newRun.id;
  }

  // Fetch all active employees with active salary structures
  const { data: employees } = await admin
    .from("employees")
    .select("id, full_name")
    .eq("is_active", true);

  if (!employees || employees.length === 0) {
    return { error: "No active employees found" };
  }

  const { data: structures } = await admin
    .from("salary_structures")
    .select("*")
    .eq("is_active", true);

  const structureMap = new Map<string, SalaryStructure>();
  for (const s of (structures || []) as SalaryStructure[]) {
    structureMap.set(s.employee_id, s);
  }

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;
  let processedCount = 0;
  const skipped: string[] = [];

  for (const emp of employees) {
    const structure = structureMap.get(emp.id);
    if (!structure) {
      skipped.push(emp.full_name);
      continue;
    }

    // Get attendance summary
    const attendance = await getAttendanceSummary(emp.id, monthYear);

    if (attendance.total_working_days === 0) {
      skipped.push(`${emp.full_name} (no attendance data)`);
      continue;
    }

    // Calculate LOP
    const lopDays = calculateLOP(
      attendance.days_absent,
      attendance.days_half_day
    );

    // Calculate earnings
    const earnings = calculateGrossEarnings(
      structure,
      attendance.total_working_days,
      lopDays
    );

    // Calculate deductions
    const deductions = calculateDeductions(
      structure,
      earnings.basic,
      earnings.gross
    );

    const netPay = earnings.gross - deductions.total;

    // Insert salary slip
    const { error: slipErr } = await admin.from("salary_slips").insert({
      payroll_run_id: payrollRunId,
      employee_id: emp.id,
      month_year: monthYear,
      total_working_days: attendance.total_working_days,
      days_present: attendance.days_present,
      days_absent: attendance.days_absent,
      days_half_day: attendance.days_half_day,
      lop_days: lopDays,
      basic: earnings.basic,
      hra: earnings.hra,
      dearness_allowance: earnings.dearness_allowance,
      conveyance: earnings.conveyance,
      medical_allowance: earnings.medical_allowance,
      special_allowance: earnings.special_allowance,
      gross_earnings: earnings.gross,
      pf_employee: deductions.pf_employee,
      pf_employer: deductions.pf_employer,
      esi_employee: deductions.esi_employee,
      esi_employer: deductions.esi_employer,
      professional_tax: deductions.professional_tax,
      tds: deductions.tds,
      lwf_employee: deductions.lwf_employee,
      other_deductions: 0,
      total_deductions: deductions.total,
      net_pay: netPay,
    });

    if (!slipErr) {
      totalGross += earnings.gross;
      totalDeductions += deductions.total;
      totalNet += netPay;
      processedCount++;
    }
  }

  // Update payroll run totals
  await admin
    .from("payroll_runs")
    .update({
      status: "completed",
      total_employees: processedCount,
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet,
    })
    .eq("id", payrollRunId);

  revalidatePath("/employee/admin/salary/payroll");
  return {
    success: true,
    payroll_run_id: payrollRunId,
    processed: processedCount,
    skipped: skipped.length > 0 ? skipped : undefined,
  };
}

export async function finalizePayroll(payrollRunId: string) {
  const currentUser = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("payroll_runs")
    .update({
      status: "finalized",
      finalized_by: currentUser.id,
    })
    .eq("id", payrollRunId)
    .eq("status", "completed");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employee/admin/salary/payroll");
  return { success: true };
}

export async function generateSalarySlipPdf(salarySlipId: string) {
  const currentUser = await requireAdmin();
  const admin = createAdminClient();

  // Fetch the salary slip with employee details
  const { data: slip, error: slipErr } = await admin
    .from("salary_slips")
    .select("*, employee:employees(full_name, email, designation, department, date_of_joining)")
    .eq("id", salarySlipId)
    .single();

  if (slipErr || !slip) {
    return { error: "Salary slip not found" };
  }

  // Dynamic import of jspdf to avoid SSR issues
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  const emp = slip.employee as {
    full_name: string;
    email: string;
    designation: string | null;
    department: string | null;
    date_of_joining: string | null;
  };

  const monthLabel = new Date(slip.month_year + "-01").toLocaleDateString(
    "en-IN",
    { month: "long", year: "numeric" }
  );

  // Company header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Trustner Asset Services Pvt. Ltd.", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Guwahati, Assam, India", 105, 27, { align: "center" });

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Pay Slip for ${monthLabel}`, 105, 40, { align: "center" });

  // Separator
  doc.setLineWidth(0.5);
  doc.line(15, 45, 195, 45);

  // Employee details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let y = 55;
  const left = 15;
  const right = 110;

  doc.text(`Employee Name: ${emp.full_name}`, left, y);
  doc.text(`Department: ${emp.department || "-"}`, right, y);
  y += 7;
  doc.text(`Designation: ${emp.designation || "-"}`, left, y);
  doc.text(`Email: ${emp.email}`, right, y);
  y += 7;
  doc.text(`Date of Joining: ${emp.date_of_joining || "-"}`, left, y);

  // Attendance summary
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Attendance Summary", left, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.text(`Working Days: ${slip.total_working_days}`, left, y);
  doc.text(`Present: ${slip.days_present}`, right, y);
  y += 6;
  doc.text(`Absent: ${slip.days_absent}`, left, y);
  doc.text(`LOP Days: ${slip.lop_days}`, right, y);

  // Earnings & Deductions table
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Earnings", left, y);
  doc.text("Deductions", right, y);
  y += 2;
  doc.line(left, y, 100, y);
  doc.line(right, y, 195, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const earnings = [
    ["Basic", slip.basic],
    ["HRA", slip.hra],
    ["Dearness Allowance", slip.dearness_allowance],
    ["Conveyance", slip.conveyance],
    ["Medical Allowance", slip.medical_allowance],
    ["Special Allowance", slip.special_allowance],
  ];

  const deductions = [
    ["PF (Employee)", slip.pf_employee],
    ["ESI (Employee)", slip.esi_employee],
    ["Professional Tax", slip.professional_tax],
    ["TDS / Income Tax", slip.tds],
    ["LWF", slip.lwf_employee],
    ["Other Deductions", slip.other_deductions],
  ];

  const maxRows = Math.max(earnings.length, deductions.length);
  for (let i = 0; i < maxRows; i++) {
    if (i < earnings.length) {
      doc.text(earnings[i][0] as string, left, y);
      doc.text(
        `INR ${Number(earnings[i][1]).toLocaleString("en-IN")}`,
        95,
        y,
        { align: "right" }
      );
    }
    if (i < deductions.length) {
      doc.text(deductions[i][0] as string, right, y);
      doc.text(
        `INR ${Number(deductions[i][1]).toLocaleString("en-IN")}`,
        190,
        y,
        { align: "right" }
      );
    }
    y += 7;
  }

  // Totals
  y += 3;
  doc.line(left, y, 100, y);
  doc.line(right, y, 195, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Gross Earnings", left, y);
  doc.text(
    `INR ${Number(slip.gross_earnings).toLocaleString("en-IN")}`,
    95,
    y,
    { align: "right" }
  );
  doc.text("Total Deductions", right, y);
  doc.text(
    `INR ${Number(slip.total_deductions).toLocaleString("en-IN")}`,
    190,
    y,
    { align: "right" }
  );

  // Net Pay
  y += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Net Pay: INR ${Number(slip.net_pay).toLocaleString("en-IN")}`,
    105,
    y,
    { align: "center" }
  );

  // Footer
  y += 20;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is a computer-generated document and does not require a signature.",
    105,
    y,
    { align: "center" }
  );

  // Convert to buffer
  const pdfBuffer = doc.output("arraybuffer");
  const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });

  // Upload to Supabase Storage
  const fileName = `${emp.full_name.replace(/\s+/g, "_")}_${slip.month_year}.pdf`;
  const filePath = `salary_slip/${slip.month_year}/${fileName}`;

  const { error: storageErr } = await admin.storage
    .from("documents")
    .upload(filePath, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (storageErr) {
    return { error: `Failed to upload PDF: ${storageErr.message}` };
  }

  // Create document record
  const { data: docRecord, error: docErr } = await admin
    .from("documents")
    .insert({
      title: `Salary Slip - ${monthLabel}`,
      description: `Salary slip for ${emp.full_name} - ${monthLabel}`,
      category: "salary_slip",
      file_path: filePath,
      file_name: fileName,
      file_size: pdfBuffer.byteLength,
      mime_type: "application/pdf",
      uploaded_by: currentUser.id,
      is_company_wide: false,
      month_year: slip.month_year,
    })
    .select("id")
    .single();

  if (docErr) {
    return { error: `Failed to create document record: ${docErr.message}` };
  }

  // Assign document to employee
  await admin.from("document_assignments").insert({
    document_id: docRecord.id,
    employee_id: slip.employee_id,
  });

  // Link document to salary slip
  await admin
    .from("salary_slips")
    .update({ document_id: docRecord.id })
    .eq("id", salarySlipId);

  revalidatePath("/employee/admin/salary/payroll");
  return { success: true, document_id: docRecord.id };
}

export async function generateAllSlipPdfs(payrollRunId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: slips } = await admin
    .from("salary_slips")
    .select("id")
    .eq("payroll_run_id", payrollRunId)
    .is("document_id", null);

  if (!slips || slips.length === 0) {
    return { error: "No salary slips without PDFs found" };
  }

  let generated = 0;
  const errors: string[] = [];

  for (const slip of slips) {
    const result = await generateSalarySlipPdf(slip.id);
    if (result.success) {
      generated++;
    } else {
      errors.push(result.error || "Unknown error");
    }
  }

  revalidatePath("/employee/admin/salary/payroll");
  return {
    success: true,
    generated,
    errors: errors.length > 0 ? errors : undefined,
  };
}
