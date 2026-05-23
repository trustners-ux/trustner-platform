'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut, User } from 'lucide-react';
import { type AdminRole, ROLE_LABELS, ROLE_COLORS } from '@/lib/auth/config';

export function AdminHeader({
  userName,
  userRole,
  onMenuToggle,
}: {
  userName: string;
  userRole: AdminRole;
  onMenuToggle: () => void;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <header className="h-14 bg-white border-b border-surface-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-surface-100 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[userRole] || 'bg-slate-100 text-slate-600'}`}>
          {ROLE_LABELS[userRole] || userRole}
        </span>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-brand" />
          </div>
          <span className="hidden sm:inline font-medium text-primary-700">{userName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
