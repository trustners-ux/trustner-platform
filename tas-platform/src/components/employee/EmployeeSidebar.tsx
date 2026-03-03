"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EMPLOYEE_NAV, ADMIN_NAV, type NavItem } from "@/lib/constants/employee-nav";
import type { UserRole } from "@/types/employee";
import { isAdminOrHR } from "@/lib/constants/roles";

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive =
    item.href === "/employee"
      ? pathname === "/employee"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white/80"
      )}
    >
      <item.icon size={18} />
      {item.label}
    </Link>
  );
}

export default function EmployeeSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-gradient-to-b from-[#0A1628] via-[#1a2d4a] to-[#0A1628]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <TrendingUp size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Trustner</p>
          <p className="text-[10px] text-white/50">Employee Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {EMPLOYEE_NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {isAdminOrHR(role) && (
          <>
            <div className="my-4 border-t border-white/10" />
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              Administration
            </p>
            <div className="space-y-1">
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-3">
        <p className="text-[10px] text-white/30">
          Trustner Asset Services Pvt. Ltd.
        </p>
      </div>
    </aside>
  );
}
