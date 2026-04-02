'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, GraduationCap, BarChart3, FileText, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { label: 'Dashboard', href: '/rm', icon: LayoutDashboard, exact: true },
  { label: 'MF Gyan', href: '/rm/learn', icon: GraduationCap },
  { label: 'Performance', href: '/rm/performance', icon: BarChart3 },
  { label: 'Log Business', href: '/rm/business-entry', icon: FileText },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + '/');
}

interface RMNavProps {
  userName?: string;
  designation?: string;
  entity?: string;
  onLogout: () => void;
}

export function RMNav({ userName, designation, entity, onLogout }: RMNavProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top row: logo + user info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
        <div className="flex items-center gap-2">
          <Image src="/Trustner Logo-blue.png" alt="Trustner" width={90} height={36} className="h-6 w-auto" />
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full hidden sm:inline">PORTAL</span>
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 leading-tight">{userName}</p>
              {designation && (
                <p className="text-[9px] text-slate-400 leading-tight">{designation}{entity ? ` | ${entity}` : ''}</p>
              )}
            </div>
          )}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab.href, tab.exact);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-[13px] font-medium whitespace-nowrap border-b-2 transition-all',
                  active
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                )}
              >
                <Icon className={cn('w-4 h-4', active ? 'text-emerald-600' : 'text-slate-400')} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
