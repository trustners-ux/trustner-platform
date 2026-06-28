'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  // Identity
  CircleUserRound,
  // Me group (personal)
  LayoutDashboard, IdCard, Receipt, FolderOpen, CalendarHeart, PartyPopper,
  GraduationCap, LifeBuoy, DoorOpen, AlertTriangle, ClipboardList,
  // Operations group (HR + manager daily work)
  Users, UserPlus, Clock4, Wallet, Target, Activity, DoorClosed,
  // Library group (forms, docs, policies)
  FileSignature, BookOpen, Megaphone,
  // Admin group (config / governance)
  ShieldCheck, KeyRound, Bell,
  // Misc
  Plus, Minus, LogOut, Building2, Search, ArrowLeft, Pin,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * HR Workbench shell — CTO-grade sidebar (rev 2, May 31 2026).
 *
 * Design principles applied (after Ram's review):
 *   1. Four logical groups (Me / Operations / Library / Admin) instead of
 *      flat 23-item lists.
 *   2. Distinct lucide icons for every link — no User×2, no LogOut×2, no
 *      TrendingUp×3 collisions.
 *   3. Active-state highlight driven by usePathname() — matches the longest
 *      href prefix so /employee/hr/me/payslips lights "Payslips" not
 *      "Dashboard".
 *   4. Identity card at the top (avatar + name + entity badge) — answers
 *      "who am I signed in as?" before the user clicks anything.
 *   5. Role-aware visibility — DSR shown only to sales roles, Admin group
 *      hidden from non-admins. Best-effort; degrades gracefully if the
 *      session probe fails.
 *   6. Collapsible groups with state persisted in localStorage — power
 *      users compress what they don't use.
 *   7. Pending-count badges — surfaces actionable counts (open
 *      acknowledgements, F&F pending, etc.) without forcing user to dig.
 *   8. Quick search filter at the top — for power users with 25+ items in
 *      muscle-memory.
 */

type NavLink = {
  type: 'link';
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Optional pending count to render as a small chip on the right. */
  badge?: number;
  /** Hides the row entirely when false. Defaults to true. */
  visible?: boolean;
  /** When false the row is rendered greyed-out with a "soon" tag. */
  shipped?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: NavLink[];
  /** Default-open vs default-collapsed. Persisted to localStorage. */
  defaultOpen?: boolean;
};

interface SessionInfo {
  name: string;
  email: string;
  entity: string;            // e.g. 'TAS' / 'TIB'
  department: string;
  designation: string;
  role: string;              // e.g. 'sales', 'service', 'admin'
  isSales: boolean;
  isHrAdmin: boolean;
  hasActivePip: boolean;
  pendingAcks: number;       // open policy acknowledgements
  pendingLetters: number;
  pendingExits: number;      // active separations needing HR action
  pendingApprovals: number;  // leave / reset / etc.
  unreadNotifications: number;
}

const DEFAULT_SESSION: SessionInfo = {
  name: '',
  email: '',
  entity: '',
  department: '',
  designation: '',
  role: '',
  isSales: false,
  isHrAdmin: true,           // default-true so groups don't disappear on first paint
  hasActivePip: false,
  pendingAcks: 0,
  pendingLetters: 0,
  pendingExits: 0,
  pendingApprovals: 0,
  unreadNotifications: 0,
};

const SALES_ROLES = new Set(['rm', 'sales', 'cdm', 'bdm', 'tl_sales']);
const ADMIN_ROLES = new Set(['admin', 'hr_admin', 'founder', 'ceo']);

export default function HrLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [session, setSession] = useState<SessionInfo>(DEFAULT_SESSION);
  // Fortune-500 standard: all groups collapsed by default. User taps + to
  // expand. Reduces cognitive load + visual height by ~70%. Home is pinned
  // outside the groups (always visible) because it's the most-used route.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    me: false, ops: false, library: false, admin: false,
  });
  const [filter, setFilter] = useState('');

  // Restore collapsed-group state from localStorage on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hr-nav-open');
      if (stored) setOpenGroups({ me: false, ops: false, library: false, admin: false, ...JSON.parse(stored) });
    } catch { /* swallow */ }
  }, []);

  // Persist collapse state.
  useEffect(() => {
    try { localStorage.setItem('hr-nav-open', JSON.stringify(openGroups)); } catch { /* swallow */ }
  }, [openGroups]);

  // Hydrate session + pending counts on mount. Each fetch is best-effort so
  // a single failure doesn't blank the sidebar.
  useEffect(() => {
    // Pull the auth session first (gives us role + permissions), then
    // overlay the actual hr_employees row (which carries the entity TIB/TAS
    // and the canonical designation/department). The JWT's `companyGroup`
    // is a coarse permission grouping ("LEADERSHIP", "OPERATIONS", ...) and
    // is the wrong thing to render as the entity chip.
    Promise.all([
      fetch('/api/employee/auth/login', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/employee/hr/me', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([auth, me]) => {
      const role = String(auth?.user?.role || '').toLowerCase();
      const emp = me?.profile || me?.employee || me || {};
      setSession((prev) => ({
        ...prev,
        name: emp.full_name || auth?.user?.name || '',
        email: emp.email || auth?.user?.email || '',
        entity: emp.entity || '',
        department: emp.department || auth?.user?.department || '',
        designation: emp.designation || auth?.user?.designation || '',
        role,
        isSales: SALES_ROLES.has(role),
        isHrAdmin: ADMIN_ROLES.has(role) || auth?.user?.canApproveResets === true,
      }));
    });

    // PIP probe
    fetch('/api/employee/hr/me/appraisal', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.has_active_pip) setSession((s) => ({ ...s, hasActivePip: true })); })
      .catch(() => undefined);

    // Aggregate pending counts — endpoint may or may not exist; degrade
    // silently. The shape is { acks, letters, exits, approvals }.
    fetch('/api/employee/hr/me/pending-counts', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return;
        setSession((s) => ({
          ...s,
          pendingAcks: Number(j.acks) || 0,
          pendingLetters: Number(j.letters) || 0,
          pendingExits: Number(j.exits) || 0,
          pendingApprovals: Number(j.approvals) || 0,
          unreadNotifications: Number(j.notifications) || 0,
        }));
      })
      .catch(() => undefined);
  }, []);

  // Pinned items (always visible, outside groups). Fortune-500 pattern —
  // most-used routes get permanent placement so users never have to expand
  // anything to reach them.
  const pinned: NavLink[] = useMemo(() => [
    { type: 'link', href: '/employee/hr/me', label: 'Home', icon: LayoutDashboard, badge: session.pendingAcks, shipped: true },
  ], [session.pendingAcks]);

  // Collapsible groups — all default-collapsed. User taps + to expand.
  const groups: NavGroup[] = useMemo(() => [
    {
      id: 'me',
      label: 'My Self-Service',
      defaultOpen: false,
      items: [
        { type: 'link', href: '/employee/hr/me/profile',          label: 'My Profile',       icon: IdCard,          shipped: true },
        { type: 'link', href: '/employee/hr/me/payslips',         label: 'Payslips',         icon: Receipt,         shipped: true },
        { type: 'link', href: '/employee/hr/me/documents',        label: 'Documents',        icon: FolderOpen,      shipped: true },
        { type: 'link', href: '/employee/hr/leave',               label: 'Leave',            icon: CalendarHeart,   shipped: true },
        { type: 'link', href: '/employee/hr/holidays',            label: 'Holidays',         icon: PartyPopper,     shipped: true },
        { type: 'link', href: '/employee/hr/me/appraisal',        label: 'My Appraisal',     icon: GraduationCap,   shipped: true },
        { type: 'link', href: '/employee/hr/dsr',                 label: 'My DSR',           icon: ClipboardList,   shipped: true, visible: session.isSales },
        { type: 'link', href: '/employee/hr/helpdesk',            label: 'Help Desk',        icon: LifeBuoy,        shipped: true },
        { type: 'link', href: '/employee/hr/notifications',       label: 'Notifications',    icon: Bell,            badge: session.unreadNotifications, shipped: true },
        { type: 'link', href: '/employee/hr/me/exit-request',     label: 'Exit Request',     icon: DoorOpen,        shipped: true },
        { type: 'link', href: '/employee/hr/me/appraisal/pip',    label: 'PIP',              icon: AlertTriangle,   shipped: true, visible: session.hasActivePip },
      ],
    },
    {
      id: 'ops',
      label: 'Operations',
      defaultOpen: false,
      items: [
        { type: 'link', href: '/employee/hr',                     label: 'HR Dashboard',     icon: LayoutDashboard, shipped: true },
        { type: 'link', href: '/employee/hr/employees',           label: 'Employees',        icon: Users,           shipped: true },
        { type: 'link', href: '/employee/hr/onboarding',          label: 'Onboarding',       icon: UserPlus,        shipped: true },
        { type: 'link', href: '/employee/hr/attendance',          label: 'Attendance',       icon: Clock4,          shipped: true },
        { type: 'link', href: '/employee/hr/payroll',             label: 'Payroll',          icon: Wallet,          shipped: true },
        { type: 'link', href: '/employee/hr/performance',         label: 'Performance',      icon: Target,          shipped: true },
        { type: 'link', href: '/employee/hr/productivity',        label: 'Productivity',     icon: Activity,        shipped: true },
        { type: 'link', href: '/employee/hr/exits',               label: 'Exits & F&F',      icon: DoorClosed,      badge: session.pendingExits, shipped: true },
      ],
    },
    {
      id: 'library',
      label: 'Library',
      defaultOpen: false,
      items: [
        { type: 'link', href: '/employee/hr/letters',             label: 'Letters',          icon: FileSignature,   badge: session.pendingLetters, shipped: true },
        { type: 'link', href: '/employee/hr/policies',            label: 'Policies',         icon: BookOpen,        shipped: true },
        { type: 'link', href: '/employee/hr/announcements',       label: 'Announcements',    icon: Megaphone,       shipped: true },
      ],
    },
    {
      id: 'admin',
      label: 'Admin',
      defaultOpen: false,
      items: [
        { type: 'link', href: '/employee/hr/users',               label: 'User Permissions', icon: KeyRound,        shipped: true, visible: session.isHrAdmin },
        { type: 'link', href: '/employee/hr/compliance',          label: 'Compliance',       icon: ShieldCheck,     shipped: true, visible: session.isHrAdmin },
      ],
    },
  ], [session]);

  // Filter helper.
  const matchesFilter = (label: string) => !filter || label.toLowerCase().includes(filter.toLowerCase());

  // Active-state matcher — picks the link whose href is the longest prefix
  // of the current pathname. That correctly highlights /me/payslips for
  // "Payslips" instead of "Home".
  const activeHref = useMemo(() => {
    const allHrefs = [...pinned.map((i) => i.href), ...groups.flatMap((g) => g.items.map((i) => i.href))];
    let best = '';
    for (const h of allHrefs) {
      if (pathname === h || pathname.startsWith(h + '/')) {
        if (h.length > best.length) best = h;
      }
    }
    return best;
  }, [pinned, groups, pathname]);

  // Auto-open the group containing the current page so navigating to a
  // sub-page expands the relevant group automatically.
  useEffect(() => {
    if (!activeHref) return;
    for (const g of groups) {
      if (g.items.some((i) => i.href === activeHref)) {
        setOpenGroups((s) => ({ ...s, [g.id]: true }));
        return;
      }
    }
  }, [activeHref, groups]);

  // Initials helper for the avatar.
  const initials = (session.name || session.email || 'U')
    .split(/[ .@]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('') || 'U';

  // Helper to render a single nav row consistently (used by pinned items
  // AND by items inside expanded groups).
  const renderItem = (item: NavLink, opts: { indent?: boolean } = {}) => {
    const Icon = item.icon;
    const isActive = activeHref === item.href;
    return (
      <Link
        key={item.href}
        href={item.shipped !== false ? item.href : '#'}
        className={cn(
          'group/link flex items-center gap-2 rounded-md text-[12.5px] font-medium transition',
          opts.indent ? 'pl-7 pr-2 py-1.5' : 'px-2 py-1.5',
          isActive
            ? 'bg-brand-500/15 text-white shadow-[inset_2px_0_0_theme(colors.brand.400)]'
            : item.shipped !== false
              ? 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              : 'text-slate-500 cursor-not-allowed opacity-60'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 transition', isActive ? 'text-brand-300' : 'text-slate-400 group-hover/link:text-slate-200')} />
        <span className="truncate">{item.label}</span>
        {item.shipped === false && (
          <span className="ml-auto text-[9px] uppercase tracking-wider font-bold text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">soon</span>
        )}
        {item.shipped !== false && item.badge ? (
          <span className={cn(
            'ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[16px] text-center',
            isActive ? 'bg-brand-400 text-brand-950' : 'bg-rose-500/90 text-white'
          )}>{item.badge > 99 ? '99+' : item.badge}</span>
        ) : null}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar — compact Fortune-500 density (w-56, tight padding) */}
      <aside className="w-56 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        {/* Brand — one line */}
        <div className="px-3 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-500/20 border border-brand-400/30 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-brand-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.16em] text-slate-400 font-semibold leading-tight">Trustner</div>
              <div className="text-[13px] font-bold tracking-tight leading-tight">HR Workbench</div>
            </div>
          </div>
        </div>

        {/* Identity card — compact 2-line */}
        <div className="px-2 pt-2 pb-1.5">
          <div className="bg-white/[0.04] rounded-md px-2 py-1.5 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-[10px] font-bold shadow-inner">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold truncate leading-tight">{session.name || 'Loading…'}</div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 leading-tight">
                <span className="truncate">{session.designation || '—'}</span>
                {session.entity && (
                  <span className="ml-auto bg-emerald-500/20 text-emerald-300 text-[8px] font-bold px-1 py-0.5 rounded leading-none">{session.entity}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick filter — compact */}
        <div className="px-2 pb-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search…"
              className="w-full bg-white/[0.04] border border-white/10 rounded-md pl-6 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-400/50"
            />
          </div>
        </div>

        {/* Pinned items (always visible) + collapsible groups */}
        <nav className="flex-1 px-1.5 pb-2 overflow-y-auto">
          {/* Pinned items */}
          <div className="space-y-0.5 mb-1.5 pb-1.5 border-b border-white/5">
            {pinned.filter((i) => matchesFilter(i.label)).map((item) => (
              <div key={item.href} className="relative">
                <Pin className="absolute left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-600 rotate-45 pointer-events-none" />
                <div className="pl-3">{renderItem(item)}</div>
              </div>
            ))}
          </div>

          {/* Collapsible groups — all collapsed by default */}
          {groups.map((group) => {
            const visibleItems = group.items.filter((i) => i.visible !== false && matchesFilter(i.label));
            if (visibleItems.length === 0) return null;
            const open = openGroups[group.id] ?? group.defaultOpen ?? false;
            return (
              <div key={group.id} className="mb-0.5">
                <button
                  onClick={() => setOpenGroups((s) => ({ ...s, [group.id]: !open }))}
                  className={cn(
                    'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-semibold transition',
                    open
                      ? 'text-slate-200 bg-white/[0.03]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  )}
                  aria-expanded={open}
                >
                  <span className={cn(
                    'w-4 h-4 flex items-center justify-center rounded border flex-shrink-0 transition',
                    open ? 'bg-brand-500/20 border-brand-400/40 text-brand-300' : 'border-white/15 text-slate-400'
                  )}>
                    {open ? <Minus className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                  </span>
                  <span className="flex-1 text-left tracking-tight">{group.label}</span>
                  <span className="text-[9px] font-bold text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded leading-none">{visibleItems.length}</span>
                </button>
                {open && (
                  <div className="mt-0.5 space-y-0.5 pl-1">
                    {visibleItems.map((item) => renderItem(item, { indent: false }))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer — back to Admin + sign out (compact) */}
        <div className="p-2 border-t border-white/5 space-y-0.5">
          {session.isHrAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.10] border border-white/5 transition"
              title="Switch back to Trustner Admin console"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-brand-300" />
              <span>Back to Admin</span>
            </Link>
          )}
          <Link
            href="/employee/logout"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
