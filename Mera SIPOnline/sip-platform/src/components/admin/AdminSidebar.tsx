'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, FileText, BarChart3, BarChart2, Users, Settings,
  ChevronLeft, ChevronRight, X, Image as ImageIcon, FileCheck, UserCog,
  ClipboardCheck, ScrollText, FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { canAccess, ADMIN_NAV, type AdminRole } from '@/lib/auth/config';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, TrendingUp, FileText, BarChart3, BarChart2, Users, Settings,
  Image: ImageIcon, FileCheck, UserCog, ClipboardCheck, ScrollText, FileSpreadsheet,
};

export function AdminSidebar({
  role,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  role: AdminRole;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();

  const visibleNav = ADMIN_NAV.filter((item) => canAccess(role, item.role));

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-primary-800 text-white z-50 transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Image src="/Trustner Logo-blue.png" alt="Trustner" width={24} height={24} className="brightness-0 invert opacity-80" />
              <span className="font-bold text-sm">Trustner Admin</span>
            </div>
          )}
          {collapsed && <Image src="/Trustner Logo-blue.png" alt="Trustner" width={24} height={24} className="brightness-0 invert opacity-80 mx-auto" />}
          <button onClick={onMobileClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand/20 text-brand-300'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:block border-t border-white/10 p-2">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
