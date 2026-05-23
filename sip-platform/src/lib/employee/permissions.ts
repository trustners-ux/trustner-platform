/**
 * Trustner Employee Permission System
 *
 * Granular access control for every module in the admin/RM portal.
 * Defaults are role-based; super admin can override per-employee.
 */

import { put, list } from '@vercel/blob';
import type { EmployeeRole } from './employee-directory';

// ─── Permission Keys ─────────────────────────────────────────

export const PERMISSION_MODULES = {
  // Content Management
  blog_view: { label: 'View Blog Posts', category: 'Content', description: 'Read published blog content' },
  blog_manage: { label: 'Manage Blog', category: 'Content', description: 'Create, edit, delete blog posts' },
  market_view: { label: 'View Market Pulse', category: 'Content', description: 'Read market commentaries' },
  market_manage: { label: 'Manage Market Pulse', category: 'Content', description: 'Create/edit market reports' },
  gallery_manage: { label: 'Manage Gallery', category: 'Content', description: 'Upload/delete media files' },
  fund_view: { label: 'View Fund Data', category: 'Content', description: 'See curated fund lists' },
  fund_manage: { label: 'Manage Funds', category: 'Content', description: 'Upload/edit fund data & categories' },

  // Operations & MIS
  dashboard_view: { label: 'View Dashboard', category: 'Operations', description: 'Access admin dashboard overview' },
  mis_view: { label: 'View MIS Reports', category: 'Operations', description: 'See incentive & performance data' },
  mis_manage: { label: 'Manage MIS', category: 'Operations', description: 'Edit business entries & incentive slabs' },
  business_entry: { label: 'Log Business', category: 'Operations', description: 'Create business entries for self/team' },
  payouts_view: { label: 'View Payouts', category: 'Operations', description: 'See incentive payout calculations' },
  payouts_manage: { label: 'Manage Payouts', category: 'Operations', description: 'Approve/process payouts' },
  reports_view: { label: 'View Reports', category: 'Operations', description: 'Access financial planning reports' },
  reports_manage: { label: 'Manage Reports', category: 'Operations', description: 'Approve/regenerate/send reports' },

  // People & HR
  leads_view: { label: 'View Leads', category: 'People', description: 'See captured lead data' },
  leads_manage: { label: 'Manage Leads', category: 'People', description: 'Assign, update, export leads' },
  team_view: { label: 'View Team Directory', category: 'People', description: 'See employee directory' },
  team_manage: { label: 'Manage Team', category: 'People', description: 'Approve password resets, manage roles' },
  approvals: { label: 'Approvals', category: 'People', description: 'Approve content/financial actions' },

  // Learning
  mf_gyan_view: { label: 'Access MF Gyan', category: 'Learning', description: 'Read learning modules' },
  mf_gyan_manage: { label: 'Manage MF Gyan', category: 'Learning', description: 'Edit learning content' },

  // Administration
  analytics: { label: 'View Analytics', category: 'Admin', description: 'Site analytics & visitor data' },
  user_management: { label: 'User Management', category: 'Admin', description: 'Add/remove users, change roles' },
  audit_log: { label: 'Audit Log', category: 'Admin', description: 'View system audit trail' },
  settings: { label: 'System Settings', category: 'Admin', description: 'Configure platform settings' },
} as const;

export type PermissionKey = keyof typeof PERMISSION_MODULES;

export const ALL_PERMISSION_KEYS = Object.keys(PERMISSION_MODULES) as PermissionKey[];

export const PERMISSION_CATEGORIES = ['Content', 'Operations', 'People', 'Learning', 'Admin'] as const;
export type PermissionCategory = typeof PERMISSION_CATEGORIES[number];

export function getPermissionsByCategory(): Map<PermissionCategory, { key: PermissionKey; label: string; description: string }[]> {
  const map = new Map<PermissionCategory, { key: PermissionKey; label: string; description: string }[]>();
  for (const cat of PERMISSION_CATEGORIES) {
    map.set(cat, []);
  }
  for (const [key, mod] of Object.entries(PERMISSION_MODULES)) {
    const cat = mod.category as PermissionCategory;
    map.get(cat)?.push({ key: key as PermissionKey, label: mod.label, description: mod.description });
  }
  return map;
}

// ─── Role-Based Defaults ─────────────────────────────────────

const ALL_ON: Record<PermissionKey, boolean> = Object.fromEntries(
  ALL_PERMISSION_KEYS.map(k => [k, true])
) as Record<PermissionKey, boolean>;

const ALL_OFF: Record<PermissionKey, boolean> = Object.fromEntries(
  ALL_PERMISSION_KEYS.map(k => [k, false])
) as Record<PermissionKey, boolean>;

export const DEFAULT_PERMISSIONS: Record<EmployeeRole, Record<PermissionKey, boolean>> = {
  // Board of Directors — full access
  bod: { ...ALL_ON },

  // CDO — everything except system settings and user management
  cdo: {
    ...ALL_ON,
    settings: false,
  },

  // Regional Manager — operations, people, learning, analytics
  regional_manager: {
    ...ALL_OFF,
    dashboard_view: true,
    blog_view: true,
    market_view: true,
    fund_view: true,
    mis_view: true,
    mis_manage: true,
    business_entry: true,
    payouts_view: true,
    reports_view: true,
    reports_manage: true,
    leads_view: true,
    leads_manage: true,
    team_view: true,
    team_manage: true,
    approvals: true,
    mf_gyan_view: true,
    mf_gyan_manage: true,
    analytics: true,
  },

  // Branch Head — similar to RM but less admin
  branch_head: {
    ...ALL_OFF,
    dashboard_view: true,
    blog_view: true,
    market_view: true,
    fund_view: true,
    mis_view: true,
    business_entry: true,
    payouts_view: true,
    reports_view: true,
    leads_view: true,
    leads_manage: true,
    team_view: true,
    team_manage: true,
    approvals: true,
    mf_gyan_view: true,
    mf_gyan_manage: true,
    analytics: true,
  },

  // CDM — channel development
  cdm: {
    ...ALL_OFF,
    dashboard_view: true,
    blog_view: true,
    market_view: true,
    fund_view: true,
    mis_view: true,
    business_entry: true,
    payouts_view: true,
    reports_view: true,
    leads_view: true,
    team_view: true,
    team_manage: true,
    mf_gyan_view: true,
    analytics: true,
  },

  // Manager — department operations
  manager: {
    ...ALL_OFF,
    dashboard_view: true,
    blog_view: true,
    market_view: true,
    fund_view: true,
    mis_view: true,
    business_entry: true,
    payouts_view: true,
    reports_view: true,
    leads_view: true,
    team_view: true,
    team_manage: true,
    mf_gyan_view: true,
    analytics: true,
  },

  // Mentor
  mentor: {
    ...ALL_OFF,
    dashboard_view: true,
    blog_view: true,
    market_view: true,
    fund_view: true,
    business_entry: true,
    reports_view: true,
    team_view: true,
    mf_gyan_view: true,
    mf_gyan_manage: true,
  },

  // Senior RM
  sr_rm: {
    ...ALL_OFF,
    dashboard_view: true,
    blog_view: true,
    market_view: true,
    fund_view: true,
    business_entry: true,
    reports_view: true,
    leads_view: true,
    team_view: true,
    mf_gyan_view: true,
  },

  // RM / Executive
  rm: {
    ...ALL_OFF,
    dashboard_view: true,
    blog_view: true,
    market_view: true,
    fund_view: true,
    business_entry: true,
    mf_gyan_view: true,
  },

  // Back Office
  back_office: {
    ...ALL_OFF,
    dashboard_view: true,
    blog_view: true,
    market_view: true,
    fund_view: true,
    mis_view: true,
    business_entry: true,
    mf_gyan_view: true,
  },

  // Support
  support: {
    ...ALL_OFF,
    dashboard_view: true,
    blog_view: true,
    mf_gyan_view: true,
  },
};

// ─── Per-Employee Permission Overrides (Blob) ────────────────

export interface EmployeePermissions {
  employeeId: number;
  permissions: Partial<Record<PermissionKey, boolean>>; // only overrides
  lastModifiedBy: string;
  lastModifiedAt: string;
  isEnabled: boolean; // master toggle — if false, user cannot log in
}

const PERMS_BLOB = 'employee/permissions.json';

export async function getAllPermissionOverrides(): Promise<EmployeePermissions[]> {
  try {
    const result = await list({ prefix: PERMS_BLOB, limit: 1 });
    if (result.blobs.length > 0) {
      const res = await fetch(result.blobs[0].url);
      if (res.ok) return (await res.json()) as EmployeePermissions[];
    }
  } catch (err) {
    console.error('[Permissions] Blob read failed:', err);
  }
  return [];
}

async function savePermissionOverrides(overrides: EmployeePermissions[]): Promise<void> {
  await put(PERMS_BLOB, JSON.stringify(overrides, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

/**
 * Get resolved permissions for an employee (defaults + overrides).
 */
export async function getEmployeePermissions(
  employeeId: number,
  role: EmployeeRole
): Promise<{ permissions: Record<PermissionKey, boolean>; isEnabled: boolean }> {
  const defaults = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.rm;
  const overrides = await getAllPermissionOverrides();
  const override = overrides.find(o => o.employeeId === employeeId);

  if (!override) {
    return { permissions: { ...defaults }, isEnabled: true };
  }

  // Merge: overrides take precedence
  const merged = { ...defaults };
  for (const [key, val] of Object.entries(override.permissions)) {
    if (key in merged) {
      (merged as Record<string, boolean>)[key] = val as boolean;
    }
  }

  return { permissions: merged, isEnabled: override.isEnabled };
}

/**
 * Update permission overrides for an employee.
 * Only stores the diff from role defaults.
 */
export async function updateEmployeePermissions(
  employeeId: number,
  role: EmployeeRole,
  newPermissions: Record<PermissionKey, boolean>,
  isEnabled: boolean,
  modifiedBy: string
): Promise<void> {
  const defaults = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.rm;
  const overrides = await getAllPermissionOverrides();

  // Compute diff — only store what differs from default
  const diff: Partial<Record<PermissionKey, boolean>> = {};
  for (const key of ALL_PERMISSION_KEYS) {
    if (newPermissions[key] !== defaults[key]) {
      diff[key] = newPermissions[key];
    }
  }

  const now = new Date().toISOString();
  const existingIdx = overrides.findIndex(o => o.employeeId === employeeId);

  // Only store if there are overrides or isEnabled is false
  const hasOverrides = Object.keys(diff).length > 0 || !isEnabled;

  if (existingIdx >= 0) {
    if (!hasOverrides) {
      // Remove override entirely — back to defaults
      overrides.splice(existingIdx, 1);
    } else {
      overrides[existingIdx] = {
        employeeId,
        permissions: diff,
        lastModifiedBy: modifiedBy,
        lastModifiedAt: now,
        isEnabled,
      };
    }
  } else if (hasOverrides) {
    overrides.push({
      employeeId,
      permissions: diff,
      lastModifiedBy: modifiedBy,
      lastModifiedAt: now,
      isEnabled,
    });
  }

  await savePermissionOverrides(overrides);
}
