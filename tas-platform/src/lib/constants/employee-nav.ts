import {
  LayoutDashboard,
  FileText,
  Megaphone,
  CalendarDays,
  UserCircle,
  ShieldCheck,
  Users,
  Upload,
  Newspaper,
  ClipboardCheck,
  Calculator,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const EMPLOYEE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
  { label: "My Documents", href: "/employee/documents", icon: FileText },
  { label: "Announcements", href: "/employee/announcements", icon: Megaphone },
  { label: "Leave", href: "/employee/leave", icon: CalendarDays },
  { label: "My Profile", href: "/employee/profile", icon: UserCircle },
  { label: "F&F Settlement", href: "/employee/fnf", icon: Calculator },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Admin Dashboard", href: "/employee/admin", icon: ShieldCheck },
  { label: "Employees", href: "/employee/admin/employees", icon: Users },
  {
    label: "Upload Documents",
    href: "/employee/admin/documents",
    icon: Upload,
  },
  {
    label: "Announcements",
    href: "/employee/admin/announcements",
    icon: Newspaper,
  },
  {
    label: "Leave Approvals",
    href: "/employee/admin/leave",
    icon: ClipboardCheck,
  },
  {
    label: "F&F Settlements",
    href: "/employee/admin/fnf",
    icon: Calculator,
  },
];
