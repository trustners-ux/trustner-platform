/**
 * Client-master permission gates.
 *
 * Merasip uses an AdminRole hierarchy (super_admin > admin > hr > editor > viewer).
 * The Trustner bundle assumed a token-based model (clients.read, clients.write,
 * clients.kyc, clients.export). We collapse those onto the role tiers:
 *
 *   - clients.read   → viewer (anyone signed into /admin can browse the list)
 *   - clients.write  → editor (typical RM/CDM can create + edit clients)
 *   - clients.kyc    → admin  (only admin tier sees unmasked PAN/Aadhaar-last-4)
 *   - clients.export → admin  (compliance officer scope)
 *
 * super_admin (Ram) always passes every check.
 *
 * Future: split `clients.kyc` out as a per-employee boolean flag in
 * hr_user_permissions if Ram wants tighter scoping later.
 */

import type { AdminRole } from '@/lib/auth/config';

const ROLE_RANK: Record<AdminRole, number> = {
  super_admin: 5,
  admin: 4,
  hr: 3,
  editor: 2,
  viewer: 1,
};

function atLeast(role: AdminRole | undefined, min: AdminRole): boolean {
  if (!role) return false;
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[min] ?? 0);
}

/** Browse the client list + view masked client detail */
export function canReadClients(role: AdminRole | undefined): boolean {
  return atLeast(role, 'viewer');
}

/** Create, edit, import clients; run family auto-linker */
export function canWriteClients(role: AdminRole | undefined): boolean {
  return atLeast(role, 'editor');
}

/** View unmasked KYC fields (full PAN, mark KYC verified) */
export function canViewClientKyc(role: AdminRole | undefined): boolean {
  return atLeast(role, 'admin');
}

/** Bulk-export client lists (compliance officer scope) */
export function canExportClients(role: AdminRole | undefined): boolean {
  return atLeast(role, 'admin');
}

/**
 * Map an EmployeeRole (from EmployeeJWT) to its AdminRole equivalent.
 * Mirrors the table inside src/middleware.ts so the in-route check
 * agrees with the middleware gate.
 */
const EMPLOYEE_TO_ADMIN_ROLE: Record<string, AdminRole> = {
  bod: 'super_admin',
  cdo: 'admin',
  regional_manager: 'hr',
  branch_head: 'hr',
  cdm: 'editor',
  manager: 'editor',
  mentor: 'viewer',
  sr_rm: 'viewer',
  rm: 'viewer',
  back_office: 'viewer',
  support: 'viewer',
};

export function employeeRoleToAdmin(empRole: string | undefined): AdminRole | undefined {
  if (!empRole) return undefined;
  return EMPLOYEE_TO_ADMIN_ROLE[empRole];
}
