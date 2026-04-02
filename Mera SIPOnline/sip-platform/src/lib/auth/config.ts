export type AdminRole = 'super_admin' | 'admin' | 'hr' | 'editor' | 'viewer';

export interface AdminUser {
  email: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
}

// Role hierarchy — higher number = more access
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 5,
  admin: 4,
  hr: 3,
  editor: 2,
  viewer: 1,
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  hr: 'HR Manager',
  editor: 'Editor',
  viewer: 'Viewer',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-brand/10 text-brand',
  hr: 'bg-emerald-100 text-emerald-700',
  editor: 'bg-amber-100 text-amber-700',
  viewer: 'bg-slate-100 text-slate-600',
};

// Emails with special authority
export const SUPER_ADMIN_EMAIL = 'ram@trustner.in';
export const APPROVER_EMAILS = ['ram@trustner.in', 'sangeeta@trustner.in'];

export function getAdminUsers(): AdminUser[] {
  const raw = process.env.ADMIN_USERS;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AdminUser[];
  } catch {
    console.error('Failed to parse ADMIN_USERS env var');
    return [];
  }
}

export function findUserByEmail(email: string): AdminUser | undefined {
  return getAdminUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function canAccess(role: AdminRole, required: AdminRole): boolean {
  return (ROLE_HIERARCHY[role] || 0) >= (ROLE_HIERARCHY[required] || 0);
}

/** Check if user is an approver (Ram or Sangeeta) */
export function isApprover(email: string): boolean {
  return APPROVER_EMAILS.includes(email.toLowerCase());
}

/** Check if user is the super admin (Ram only) */
export function isSuperAdmin(email: string): boolean {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL;
}

// Admin navigation items with role requirements
export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard', role: 'viewer' as AdminRole },
  { label: 'Analytics', href: '/admin/analytics', icon: 'BarChart2', role: 'viewer' as AdminRole },
  { label: 'Fund Manager', href: '/admin/funds', icon: 'TrendingUp', role: 'editor' as AdminRole },
  { label: 'Blog', href: '/admin/blog', icon: 'FileText', role: 'editor' as AdminRole },
  { label: 'Market Pulse', href: '/admin/market', icon: 'BarChart3', role: 'editor' as AdminRole },
  { label: 'Leads', href: '/admin/leads', icon: 'Users', role: 'editor' as AdminRole },
  { label: 'Reports', href: '/admin/reports', icon: 'FileCheck', role: 'editor' as AdminRole },
  { label: 'Gallery', href: '/admin/gallery', icon: 'Image', role: 'editor' as AdminRole },
  { label: 'Approvals', href: '/admin/approvals', icon: 'ClipboardCheck', role: 'admin' as AdminRole },
  { label: 'MIS Dashboard', href: '/admin/mis', icon: 'BarChart3', role: 'admin' as AdminRole },
  { label: 'Business Entry', href: '/admin/mis/business', icon: 'FileSpreadsheet', role: 'hr' as AdminRole },
  { label: 'Payouts', href: '/admin/mis/payouts', icon: 'Percent', role: 'admin' as AdminRole },
  { label: 'Users', href: '/admin/users', icon: 'UserCog', role: 'admin' as AdminRole },
  { label: 'Audit Log', href: '/admin/audit', icon: 'ScrollText', role: 'admin' as AdminRole },
  { label: 'Team', href: '/admin/team', icon: 'UsersRound', role: 'viewer' as AdminRole },
  { label: 'MF Gyan', href: '/admin/learn', icon: 'GraduationCap', role: 'viewer' as AdminRole },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings', role: 'admin' as AdminRole },
];
