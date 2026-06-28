/**
 * HR module-permission helpers.
 *
 * Each user has a row in `hr_user_permissions` controlling which HR modules
 * they can access. Defaults are restrictive (opt-in). Super admin (Ram) and
 * any user with the admin role automatically gets everything.
 */
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { findEmployeeByEmail, type Employee } from '@/lib/employee/employee-directory';

export interface HrPermissions {
  // HR admin modules — default OFF
  can_access_letters: boolean;
  can_access_employees: boolean;
  can_access_payroll: boolean;
  can_access_attendance_admin: boolean;
  can_access_leave_admin: boolean;
  can_access_compliance: boolean;
  can_access_reports: boolean;
  can_access_onboarding: boolean;
  can_access_performance: boolean;
  can_access_engagement: boolean;
  // ESS — default ON
  can_apply_leave: boolean;
  can_punch_attendance: boolean;
  can_view_payslips: boolean;
  // Manager features — default OFF
  can_approve_leave: boolean;
  can_approve_attendance_reg: boolean;
  can_view_team_data: boolean;
  // Lifecycle controls — admin/HR-head scope
  can_manage_probation: boolean;
}

export const DEFAULT_PERMISSIONS: HrPermissions = {
  can_access_letters: false,
  can_access_employees: false,
  can_access_payroll: false,
  can_access_attendance_admin: false,
  can_access_leave_admin: false,
  can_access_compliance: false,
  can_access_reports: false,
  can_access_onboarding: false,
  can_access_performance: false,
  can_access_engagement: false,
  can_apply_leave: true,
  can_punch_attendance: true,
  can_view_payslips: true,
  can_approve_leave: false,
  can_approve_attendance_reg: false,
  can_view_team_data: false,
  can_manage_probation: false,
};

const SUPER_ADMIN_EMAIL = 'ram@trustner.in';

/**
 * Resolve effective permissions for a given user email.
 * Super-admin and admin-role users get everything regardless of DB row.
 */
export async function getEffectivePermissions(
  email: string,
  role?: string
): Promise<HrPermissions> {
  const lower = email.toLowerCase();
  // Super-admin override
  if (lower === SUPER_ADMIN_EMAIL || role === 'super_admin') {
    return allOn();
  }
  // Auto-grant from the org directory: leadership → everything; HR staff (by
  // job-responsibility, since their org-role is generic) → the people-ops set
  // minus payroll; people-managers → team-approval features. No DB row needed.
  const dirDefaults = directoryDefaults(findEmployeeByEmail(lower));

  const supabase = getSupabaseAdmin();
  if (!supabase) return { ...DEFAULT_PERMISSIONS, ...dirDefaults };
  const { data } = await supabase
    .from('hr_user_permissions')
    .select('*')
    .eq('email', lower)
    .single();
  // An explicit per-user row (set by an admin in User Permissions) wins over the
  // role/attribute defaults, so individuals can still be dialled up or down.
  return { ...DEFAULT_PERMISSIONS, ...dirDefaults, ...(data || {}) } as HrPermissions;
}

/**
 * Permission defaults derived from a user's org-directory attributes.
 * HR staff are identified by job-responsibility ("H.R.") rather than role,
 * because HR people carry generic roles (e.g. the Sr HR Executive is role 'rm',
 * the HR Manager is role 'manager'). Payroll is intentionally excluded — grant
 * it per-person via User Permissions.
 */
function directoryDefaults(emp: Employee | undefined): Partial<HrPermissions> {
  if (!emp || emp.isActive === false) return {};

  // Board / leadership → everything.
  if (emp.role === 'bod') return allOn();

  // HR staff (job-responsibility contains H.R.) → full people-ops module set,
  // including Payroll (Ram-confirmed Jun 17 2026 — HR runs payroll at Trustner).
  if (/H\.?R/i.test(emp.jobResponsibility || '')) {
    return {
      can_access_onboarding: true,
      can_access_employees: true,
      can_access_letters: true,
      can_access_payroll: true,
      can_access_leave_admin: true,
      can_access_attendance_admin: true,
      can_access_reports: true,
      can_access_performance: true,
      can_access_engagement: true,
      can_access_compliance: true,
      can_approve_leave: true,
      can_approve_attendance_reg: true,
      can_view_team_data: true,
      can_manage_probation: true,
    };
  }

  // People-managers → approve their reports' leave / attendance, see team data.
  if (emp.role === 'manager' || emp.role === 'regional_manager' || emp.role === 'branch_head') {
    return { can_approve_leave: true, can_approve_attendance_reg: true, can_view_team_data: true };
  }

  return {};
}

function allOn(): HrPermissions {
  return {
    can_access_letters: true,
    can_access_employees: true,
    can_access_payroll: true,
    can_access_attendance_admin: true,
    can_access_leave_admin: true,
    can_access_compliance: true,
    can_access_reports: true,
    can_access_onboarding: true,
    can_access_performance: true,
    can_access_engagement: true,
    can_apply_leave: true,
    can_punch_attendance: true,
    can_view_payslips: true,
    can_approve_leave: true,
    can_approve_attendance_reg: true,
    can_view_team_data: true,
    can_manage_probation: true,
  };
}

/**
 * Human-readable module list — used by the admin user-management UI to
 * render toggle switches in a predictable order.
 */
export const PERMISSION_GROUPS: Array<{
  group: string;
  items: Array<{ key: keyof HrPermissions; label: string; desc: string }>;
}> = [
  {
    group: 'HR Admin Modules',
    items: [
      { key: 'can_access_letters',           label: 'HR Letters',           desc: 'Generate Offer / Appointment / Increment / Promotion / Warning / etc.' },
      { key: 'can_access_employees',         label: 'Employee Master',      desc: 'Read & edit employee records + family roster.' },
      { key: 'can_access_payroll',           label: 'Payroll',              desc: 'Run salary, generate slips, bank advice files.' },
      { key: 'can_access_attendance_admin',  label: 'Attendance Admin',     desc: 'View all-employee attendance, approve regularizations.' },
      { key: 'can_access_leave_admin',       label: 'Leave Admin',          desc: 'Configure leave types, view & override balances.' },
      { key: 'can_access_compliance',        label: 'Compliance & COI',     desc: 'POSP cross-check, COI re-attestation tracking.' },
      { key: 'can_access_reports',           label: 'HR Reports',           desc: 'Headcount, attrition, payroll summary, statutory.' },
      { key: 'can_access_onboarding',        label: 'New-Joiner Onboarding', desc: 'Send invite links, review uploaded documents.' },
      { key: 'can_access_performance',       label: 'Performance',          desc: 'KRA, appraisals, increment recommendations.' },
      { key: 'can_access_engagement',        label: 'Engagement',           desc: 'Announcements, polls, recognition.' },
    ],
  },
  {
    group: 'Manager Features',
    items: [
      { key: 'can_approve_leave',            label: 'Approve Leave Requests',     desc: 'Approve / reject leave applied by direct reports.' },
      { key: 'can_approve_attendance_reg',   label: 'Approve Attendance Regularization', desc: 'Approve forgot-to-punch requests.' },
      { key: 'can_view_team_data',           label: 'View Team Data',             desc: 'See attendance + leave + appraisal data of direct reports.' },
    ],
  },
  {
    group: 'Employee Self-Service (defaults ON)',
    items: [
      { key: 'can_apply_leave',              label: 'Apply for Leave',     desc: 'Submit leave applications.' },
      { key: 'can_punch_attendance',         label: 'Punch Attendance',    desc: 'Daily punch-in / punch-out.' },
      { key: 'can_view_payslips',            label: 'View Pay Slips',      desc: 'Download own salary slips, Form 16.' },
    ],
  },
];
