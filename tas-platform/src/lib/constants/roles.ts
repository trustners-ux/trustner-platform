import type { UserRole } from "@/types/employee";

export const ROLES = {
  ADMIN: "admin",
  HR_HEAD: "hr_head",
  MANAGEMENT: "management",
  EMPLOYEE: "employee",
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  hr_head: "HR Head",
  management: "Management",
  employee: "Employee",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700",
  hr_head: "bg-purple-100 text-purple-700",
  management: "bg-blue-100 text-blue-700",
  employee: "bg-gray-100 text-gray-700",
};

const PERMISSIONS = {
  "employees:read_all": ["admin", "hr_head", "management"],
  "employees:create": ["admin", "hr_head"],
  "employees:update": ["admin", "hr_head"],
  "employees:delete": ["admin"],

  "documents:upload": ["admin", "hr_head"],
  "documents:delete": ["admin", "hr_head"],
  "documents:read_all": ["admin", "hr_head", "management"],
  "documents:read_own": ["admin", "hr_head", "management", "employee"],

  "announcements:create": ["admin", "hr_head"],
  "announcements:update": ["admin", "hr_head"],
  "announcements:delete": ["admin"],
  "announcements:read": ["admin", "hr_head", "management", "employee"],

  "leave:apply": ["admin", "hr_head", "management", "employee"],
  "leave:approve": ["admin", "hr_head", "management"],
  "leave:read_all": ["admin", "hr_head", "management"],

  "fnf:manage": ["admin", "hr_head"],
  "fnf:read_own": ["admin", "hr_head", "management", "employee"],

  "admin:access": ["admin", "hr_head"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export function isAdminOrHR(role: UserRole): boolean {
  return role === "admin" || role === "hr_head";
}
