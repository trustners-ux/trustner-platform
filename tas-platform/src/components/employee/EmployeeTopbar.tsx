"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown, User } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/constants/roles";
import type { Employee } from "@/types/employee";

export default function EmployeeTopbar({ employee }: { employee: Employee }) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          Employee Portal
        </h2>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10">
            <User size={16} className="text-primary-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">
              {employee.full_name}
            </p>
            <p className="text-[10px] text-gray-500">
              {employee.designation || employee.email}
            </p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
              <div className="border-b border-gray-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-gray-900">
                  {employee.full_name}
                </p>
                <p className="text-xs text-gray-500">{employee.email}</p>
                <span
                  className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[employee.role]}`}
                >
                  {ROLE_LABELS[employee.role]}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push("/employee/profile");
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User size={14} />
                My Profile
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
