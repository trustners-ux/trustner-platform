export type UserRole = "admin" | "hr_head" | "management" | "employee";

export type DocumentCategory =
  | "salary_slip"
  | "hr_policy"
  | "leave_encashment"
  | "appointment_letter"
  | "increment_letter"
  | "fnf_settlement"
  | "handbook"
  | "other";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "half_day"
  | "weekend"
  | "holiday"
  | "leave";

export type PayrollRunStatus =
  | "draft"
  | "processing"
  | "completed"
  | "finalized";

export type AnnouncementCategory =
  | "general"
  | "newsletter"
  | "policy_update"
  | "event"
  | "urgent";

export type LeaveType =
  | "casual"
  | "sick"
  | "earned"
  | "compensatory"
  | "maternity"
  | "paternity"
  | "unpaid";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export type FnFStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "paid"
  | "disputed";

export interface Employee {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  date_of_joining: string | null;
  role: UserRole;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  category: DocumentCategory;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  is_company_wide: boolean;
  month_year: string | null;
  created_at: string;
  uploader?: Employee;
}

export interface DocumentAssignment {
  id: string;
  document_id: string;
  employee_id: string;
  viewed_at: string | null;
  downloaded_at: string | null;
  created_at: string;
  document?: Document;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  is_pinned: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  author?: Employee;
}

export interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  applied_at: string;
  updated_at: string;
  employee?: Employee;
  approver?: Employee;
}

export interface FnFSettlement {
  id: string;
  employee_id: string;
  last_working_date: string;
  resignation_date: string | null;
  basic_salary: number | null;
  earned_leave_balance: number | null;
  leave_encashment: number | null;
  gratuity: number | null;
  bonus: number | null;
  deductions: number | null;
  deduction_notes: string | null;
  net_payable: number | null;
  status: FnFStatus;
  notes: string | null;
  processed_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
  processor?: Employee;
  approver?: Employee;
}

// ─── Attendance ────────────────────────────────────────

export interface AttendanceUpload {
  id: string;
  month_year: string;
  file_name: string;
  records_count: number;
  uploaded_by: string;
  created_at: string;
  uploader?: Employee;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  upload_id: string | null;
  date: string;
  in_time: string | null;
  out_time: string | null;
  status: AttendanceStatus;
  hours_worked: number | null;
  is_late: boolean;
  overtime_hours: number;
  remarks: string | null;
  created_at: string;
  employee?: Employee;
}

export interface AttendanceMonthlySummary {
  employee_id: string;
  month_year: string;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  days_half_day: number;
  days_late: number;
  total_overtime_hours: number;
  lop_days: number;
}

// ─── Salary & Payroll ──────────────────────────────────

export interface SalaryStructure {
  id: string;
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
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface PayrollRun {
  id: string;
  month_year: string;
  status: PayrollRunStatus;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  generated_by: string;
  finalized_by: string | null;
  created_at: string;
  updated_at: string;
  generator?: Employee;
}

export interface SalarySlip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  month_year: string;
  total_working_days: number;
  days_present: number;
  days_absent: number;
  days_half_day: number;
  lop_days: number;
  basic: number;
  hra: number;
  dearness_allowance: number;
  conveyance: number;
  medical_allowance: number;
  special_allowance: number;
  gross_earnings: number;
  pf_employee: number;
  pf_employer: number;
  esi_employee: number;
  esi_employer: number;
  professional_tax: number;
  tds: number;
  lwf_employee: number;
  other_deductions: number;
  other_deduction_notes: string | null;
  total_deductions: number;
  net_pay: number;
  document_id: string | null;
  created_at: string;
  employee?: Employee;
}
