export type AdminRole = 'admin' | 'editor' | 'viewer';

export interface AdminUser {
  email: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
}

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
  const hierarchy: Record<AdminRole, number> = { admin: 3, editor: 2, viewer: 1 };
  return hierarchy[role] >= hierarchy[required];
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
  { label: 'MIS Dashboard', href: '/admin/mis', icon: 'BarChart3', role: 'admin' as AdminRole },
  { label: 'Users', href: '/admin/users', icon: 'UserCog', role: 'admin' as AdminRole },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings', role: 'admin' as AdminRole },
];
