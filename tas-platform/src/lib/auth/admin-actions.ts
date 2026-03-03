"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmployee } from "@/lib/auth/actions";
import { hasPermission } from "@/lib/constants/roles";
import type {
  UserRole,
  DocumentCategory,
  AnnouncementCategory,
  LeaveStatus,
  FnFStatus,
} from "@/types/employee";

// ─── Helpers ──────────────────────────────────────────

async function requireAdmin() {
  const employee = await getEmployee();
  if (!employee) throw new Error("Not authenticated");
  if (!hasPermission(employee.role as UserRole, "admin:access")) {
    throw new Error("Insufficient permissions");
  }
  return employee;
}

// ─── Employee Actions ──────────────────────────────────

export async function createEmployee(data: {
  email: string;
  full_name: string;
  phone?: string;
  designation?: string;
  department?: string;
  date_of_joining?: string;
  role: UserRole;
}) {
  const currentUser = await requireAdmin();
  const admin = createAdminClient();

  // Create auth user with default password
  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email: data.email,
      password: "Trustner@2025",
      email_confirm: true,
    });

  if (authError) {
    return { error: authError.message };
  }

  // Create employee record
  const { error: empError } = await admin.from("employees").insert({
    auth_user_id: authUser.user.id,
    email: data.email,
    full_name: data.full_name,
    phone: data.phone || null,
    designation: data.designation || null,
    department: data.department || null,
    date_of_joining: data.date_of_joining || null,
    role: data.role,
  });

  if (empError) {
    // Clean up the auth user if employee insert fails
    await admin.auth.admin.deleteUser(authUser.user.id);
    return { error: empError.message };
  }

  revalidatePath("/employee/admin/employees");
  return { success: true };
}

export async function updateEmployee(
  id: string,
  data: {
    full_name?: string;
    phone?: string;
    designation?: string;
    department?: string;
    date_of_joining?: string;
    role?: UserRole;
    is_active?: boolean;
  }
) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update(data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/employee/admin/employees/${id}`);
  revalidatePath("/employee/admin/employees");
  return { success: true };
}

// ─── Document Actions ──────────────────────────────────

export async function uploadDocument(formData: FormData) {
  const currentUser = await requireAdmin();
  const supabase = await createClient();

  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as DocumentCategory;
  const monthYear = formData.get("month_year") as string;
  const isCompanyWide = formData.get("is_company_wide") === "true";
  const employeeIds = formData.getAll("employee_ids") as string[];

  if (!file || !title || !category) {
    return { error: "Missing required fields" };
  }

  // Upload file to Supabase Storage
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${category}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Create document record
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      title,
      description: description || null,
      category,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: currentUser.id,
      is_company_wide: isCompanyWide,
      month_year: monthYear || null,
    })
    .select("id")
    .single();

  if (docError) {
    return { error: docError.message };
  }

  // Create assignments
  if (isCompanyWide) {
    // Assign to all active employees
    const { data: allEmployees } = await supabase
      .from("employees")
      .select("id")
      .eq("is_active", true);

    if (allEmployees && allEmployees.length > 0) {
      const assignments = allEmployees.map((emp) => ({
        document_id: doc.id,
        employee_id: emp.id,
      }));
      await supabase.from("document_assignments").insert(assignments);
    }
  } else if (employeeIds.length > 0) {
    const assignments = employeeIds.map((empId) => ({
      document_id: doc.id,
      employee_id: empId,
    }));
    await supabase.from("document_assignments").insert(assignments);
  }

  revalidatePath("/employee/admin/documents");
  return { success: true };
}

// ─── Announcement Actions ──────────────────────────────

export async function createAnnouncement(data: {
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  published_at: string | null;
}) {
  const currentUser = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("announcements").insert({
    title: data.title,
    content: data.content,
    category: data.category,
    is_pinned: data.is_pinned,
    published_at: data.published_at,
    created_by: currentUser.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employee/admin/announcements");
  revalidatePath("/employee/announcements");
  return { success: true };
}

// ─── Leave Actions ─────────────────────────────────────

export async function approveLeave(leaveId: string) {
  const currentUser = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("leave_records")
    .update({
      status: "approved" as LeaveStatus,
      approved_by: currentUser.id,
    })
    .eq("id", leaveId)
    .eq("status", "pending");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employee/admin/leave");
  return { success: true };
}

export async function rejectLeave(leaveId: string) {
  const currentUser = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("leave_records")
    .update({
      status: "rejected" as LeaveStatus,
      approved_by: currentUser.id,
    })
    .eq("id", leaveId)
    .eq("status", "pending");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employee/admin/leave");
  return { success: true };
}

// ─── F&F Settlement Actions ────────────────────────────

export async function createFnFSettlement(data: {
  employee_id: string;
  last_working_date: string;
  resignation_date?: string;
  basic_salary?: number;
  earned_leave_balance?: number;
  leave_encashment?: number;
  gratuity?: number;
  bonus?: number;
  deductions?: number;
  deduction_notes?: string;
  net_payable?: number;
  notes?: string;
}) {
  const currentUser = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("fnf_settlements").insert({
    ...data,
    resignation_date: data.resignation_date || null,
    basic_salary: data.basic_salary ?? null,
    earned_leave_balance: data.earned_leave_balance ?? null,
    leave_encashment: data.leave_encashment ?? null,
    gratuity: data.gratuity ?? null,
    bonus: data.bonus ?? null,
    deductions: data.deductions ?? null,
    deduction_notes: data.deduction_notes || null,
    net_payable: data.net_payable ?? null,
    notes: data.notes || null,
    status: "draft" as FnFStatus,
    processed_by: currentUser.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/employee/admin/fnf");
  return { success: true };
}

export async function updateFnFSettlement(
  id: string,
  data: {
    last_working_date?: string;
    resignation_date?: string;
    basic_salary?: number;
    earned_leave_balance?: number;
    leave_encashment?: number;
    gratuity?: number;
    bonus?: number;
    deductions?: number;
    deduction_notes?: string;
    net_payable?: number;
    status?: FnFStatus;
    notes?: string;
  }
) {
  const currentUser = await requireAdmin();
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { ...data };

  // If status is being changed to approved, set approved_by
  if (data.status === "approved") {
    updateData.approved_by = currentUser.id;
  }

  const { error } = await supabase
    .from("fnf_settlements")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/employee/admin/fnf/${id}`);
  revalidatePath("/employee/admin/fnf");
  return { success: true };
}

export async function updateFnFStatus(id: string, newStatus: string) {
  const currentUser = await requireAdmin();
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "approved") {
    updateData.approved_by = currentUser.id;
  }

  const { error } = await supabase
    .from("fnf_settlements")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/employee/admin/fnf/${id}`);
  revalidatePath("/employee/admin/fnf");
  return { success: true };
}
