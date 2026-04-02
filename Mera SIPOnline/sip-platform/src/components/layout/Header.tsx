'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, Calculator, BookOpen, Search, GraduationCap, FlaskConical, ArrowRight, Layers, FileText, Activity, LogIn, UserPlus, Camera, ChevronRight, ChevronsDown, Brain, Users, Briefcase, Handshake, ExternalLink } from 'lucide-react';
import { NAVIGATION, NavItem } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils/cn';
import { StockTicker } from './StockTicker';

/* ─── Scrollable dropdown wrapper with fade indicators ─── */
function ScrollableDropdown({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const checkScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Initial check
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  return (
    <div className="relative bg-white rounded-lg shadow-dropdown border border-surface-300/50 min-w-[240px] card-accent-border">
      {/* Top fade */}
      {canScrollUp && (
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none rounded-t-lg" />
      )}
      <div
        ref={ref}
        className="p-2 max-h-[70vh] overflow-y-auto overscroll-contain custom-scrollbar"
      >
        {children}
      </div>
      {/* Bottom fade + scroll hint */}
      {canScrollDown && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none rounded-b-lg">
          <div className="h-8 bg-gradient-to-t from-white to-transparent" />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <ChevronsDown className="w-4 h-4 text-slate-400 animate-bounce" />
          </div>
        </div>
      )}
    </div>
  );
}

function isNavActive(pathname: string, href: string, hasChildren: boolean): boolean {
  // Root path always uses exact match
  if (href === '/') return pathname === '/';
  // Items with children use prefix match (e.g. /learn, /calculators, /research)
  if (hasChildren) {
    return pathname === href || pathname.startsWith(href + '/');
  }
  // Leaf items use exact match (e.g. /glossary)
  return pathname === href;
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchDevice = useRef(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect touch device on first touch
  useEffect(() => {
    const onTouch = () => { isTouchDevice.current = true; };
    window.addEventListener('touchstart', onTouch, { once: true });
    return () => window.removeEventListener('touchstart', onTouch);
  }, []);

  // Close desktop dropdown when tapping outside on touch devices
  useEffect(() => {
    if (!activeDropdown) return;
    const handleTouchOutside = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-nav-dropdown]')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('touchstart', handleTouchOutside);
    return () => document.removeEventListener('touchstart', handleTouchOutside);
  }, [activeDropdown]);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
    setMobileExpanded(null);
  }, [pathname]);

  const handleMouseEnter = useCallback((label: string) => {
    if (isTouchDevice.current) return; // Skip hover on touch devices
    if (dropdownTimeout.current) {
      clearTimeout(dropdownTimeout.current);
      dropdownTimeout.current = null;
    }
    setActiveDropdown(label);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice.current) return; // Skip hover on touch devices
    dropdownTimeout.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  // Handle tap on desktop nav items with children (touch devices)
  const handleNavClick = useCallback((e: React.MouseEvent, label: string, hasChildren: boolean) => {
    if (!hasChildren) return; // No children — let Link navigate normally
    if (!isTouchDevice.current) return; // Mouse device — let Link navigate, hover handles dropdown

    // Touch device with children: first tap opens dropdown, second tap navigates
    if (activeDropdown === label) {
      // Dropdown already open for this item — allow navigation
      setActiveDropdown(null);
      return;
    }

    // First tap — open dropdown, prevent navigation
    e.preventDefault();
    setActiveDropdown(label);
  }, [activeDropdown]);

  const iconMap: Record<string, React.ElementType> = {
    Learn: BookOpen,
    Research: FlaskConical,
    Calculators: Calculator,
    Funds: Layers,
    Blog: FileText,
    'Market Pulse': Activity,
    'Financial Planning': Brain,
    Gallery: Camera,
    Glossary: GraduationCap,
  };

  // All nav items shown directly — no overflow "More" grouping
  const primaryNav = NAVIGATION;

  return (
    <>
    {/* Fixed wrapper: ticker + header */}
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Live Stock Ticker Strip */}
      <StockTicker />

      {/* Main Header */}
      <header
        className={cn(
          'transition-all duration-500',
          isScrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-dropdown border-b border-surface-300/30'
            : 'bg-white/70 backdrop-blur-sm'
        )}
        style={isScrolled ? { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04), 0 12px 24px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(15, 118, 110, 0.06)' } : undefined}
      >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/Trustner Logo-blue.png"
              alt="Trustner"
              width={140}
              height={80}
              className="h-10 lg:h-11 w-auto object-contain"
              priority
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold text-primary-700 leading-tight">Mera SIP</span>
              <span className="text-[10px] text-blue-700 font-semibold leading-none tracking-wide">by Trustner</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-2 xl:mx-4">
            {primaryNav.map((item) => {
              const Icon = iconMap[item.label];
              const hasChildren = item.children && item.children.length > 0;
              return (
                <div
                  key={item.label}
                  className="relative"
                  data-nav-dropdown
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      handleNavClick(e, item.label, !!hasChildren);
                    }}
                    className={cn(
                      'flex items-center gap-1 px-2 xl:px-3 py-1.5 xl:py-2 text-[12.5px] xl:text-[13.5px] font-medium rounded-md transition-all duration-200 relative z-10 whitespace-nowrap',
                      isNavActive(pathname, item.href, !!hasChildren)
                        ? 'text-brand bg-brand-50/80 shadow-sm'
                        : 'text-slate-600 hover:text-primary-700 hover:bg-surface-200'
                    )}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 hidden xl:block" />}
                    {item.label}
                    {item.badge && (
                      <span className="px-1 py-0.5 text-[8px] xl:text-[9px] font-bold bg-amber-400 text-slate-900 rounded-full uppercase leading-none">
                        {item.badge}
                      </span>
                    )}
                    {hasChildren && <ChevronDown className="w-3 h-3" />}
                  </Link>

                  {/* Dropdown */}
                  {hasChildren && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 pt-1 animate-fade-in">
                      <ScrollableDropdown>
                        {item.children!.map((child) => (
                          <div key={child.label}>
                            {child.children ? (
                              <div className="mb-1">
                                <Link
                                  href={child.href}
                                  className="block px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-brand"
                                >
                                  {child.label}
                                </Link>
                                {child.children.map((sub) => (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={cn(
                                      'flex items-center gap-2 px-4 py-1.5 text-sm rounded-md transition-colors',
                                      pathname === sub.href
                                        ? 'text-brand bg-brand-50'
                                        : 'text-slate-600 hover:text-primary-700 hover:bg-surface-100'
                                    )}
                                  >
                                    {sub.label}
                                    {sub.badge && (
                                      <span className="text-[10px] font-semibold bg-positive-50 text-positive px-1.5 py-0.5 rounded-full">
                                        {sub.badge}
                                      </span>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <Link
                                href={child.href}
                                className={cn(
                                  'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                                  pathname === child.href
                                    ? 'text-brand bg-brand-50'
                                    : 'text-slate-600 hover:text-primary-700 hover:bg-surface-100'
                                )}
                              >
                                {child.label}
                                {child.badge && (
                                  <span className="text-[10px] font-semibold bg-positive-50 text-positive px-1.5 py-0.5 rounded-full">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            )}
                          </div>
                        ))}
                      </ScrollableDropdown>
                    </div>
                  )}
                </div>
              );
            })}

          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sign Up — always visible on sm+ */}
            <a
              href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-full bg-[#4A7CB5] text-white hover:bg-[#3D6A9E] transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </a>

            {/* Sign In Dropdown */}
            <div
              className="relative hidden lg:block"
              data-nav-dropdown
              onMouseEnter={() => handleMouseEnter('__signin__')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={(e) => {
                  if (!isTouchDevice.current) return;
                  if (activeDropdown === '__signin__') {
                    setActiveDropdown(null);
                    return;
                  }
                  e.preventDefault();
                  setActiveDropdown('__signin__');
                }}
                className="inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-full border-2 border-[#4A7CB5] text-[#4A7CB5] bg-white hover:bg-[#4A7CB5] hover:text-white transition-all duration-300 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
                <ChevronDown className="w-3 h-3" />
              </button>

              {activeDropdown === '__signin__' && (
                <div className="absolute top-full right-0 pt-2 animate-fade-in z-50">
                  <div className="bg-white rounded-xl shadow-dropdown border border-surface-300/50 min-w-[260px] p-2 card-accent-border">
                    <div className="px-3 py-2 mb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose your portal</p>
                    </div>

                    {/* Clients */}
                    <a
                      href="https://trustner.investwell.app/app/#/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">Clients</p>
                        <p className="text-[11px] text-slate-400">Portfolio & investments</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400" />
                    </a>

                    {/* Employees */}
                    <Link
                      href="/admin/login"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 transition-colors group"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                        <Briefcase className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">Employees</p>
                        <p className="text-[11px] text-slate-400">MIS & incentive dashboard</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-400" />
                    </Link>

                    {/* Partners */}
                    <Link
                      href="/partner/login"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 transition-colors group"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-200 transition-colors">
                        <Handshake className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">Partners</p>
                        <p className="text-[11px] text-slate-400">POSP / Sub-broker / Referral</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-400" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button
              className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-surface-200"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      </header>
    </div>

    {/* Mobile Menu — rendered OUTSIDE <header> to avoid backdrop-blur stacking context */}
    {mobileOpen && (
      <div className="lg:hidden fixed inset-0 top-[calc(32px+4rem)] bg-white z-[60] overflow-y-auto shadow-lg">
          <div className="container-custom py-4">
            {NAVIGATION.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = mobileExpanded === item.label;
              const Icon = iconMap[item.label];

              return (
                <div key={item.label} className="border-b border-surface-200 last:border-b-0">
                  {hasChildren ? (
                    /* Items with children — tap to expand/collapse */
                    <>
                      <button
                        onClick={() => setMobileExpanded(isExpanded ? null : item.label)}
                        className="flex items-center justify-between w-full px-4 py-3.5 text-base font-semibold text-primary-700 hover:bg-surface-100 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
                          {item.label}
                        </span>
                        <ChevronRight className={cn(
                          'w-4 h-4 text-slate-400 transition-transform duration-200',
                          isExpanded && 'rotate-90'
                        )} />
                      </button>

                      {/* Expandable children */}
                      {isExpanded && (
                        <div className="bg-surface-50 pb-2">
                          {/* Link to main section page */}
                          <Link
                            href={item.href}
                            className="flex items-center gap-2 mx-4 mb-1 px-3 py-2 text-sm font-semibold text-brand rounded-md hover:bg-brand-50 transition-colors"
                          >
                            View All {item.label}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          {item.children!.map((child) =>
                            child.children ? (
                              <div key={child.label} className="mb-1 mx-4">
                                <span className="block px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  {child.label}
                                </span>
                                {child.children.map((sub) => (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={cn(
                                      'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                                      pathname === sub.href
                                        ? 'text-brand bg-brand-50 font-medium'
                                        : 'text-slate-600 hover:text-primary-700 hover:bg-surface-100'
                                    )}
                                  >
                                    {sub.label}
                                    {sub.badge && (
                                      <span className="text-[10px] font-semibold bg-positive-50 text-positive px-1.5 py-0.5 rounded-full">
                                        {sub.badge}
                                      </span>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  'flex items-center justify-between mx-4 px-3 py-2 text-sm rounded-md transition-colors',
                                  pathname === child.href
                                    ? 'text-brand bg-brand-50 font-medium'
                                    : 'text-slate-600 hover:text-primary-700 hover:bg-surface-100'
                                )}
                              >
                                {child.label}
                                {child.badge && (
                                  <span className="text-[10px] font-semibold bg-positive-50 text-positive px-1.5 py-0.5 rounded-full">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            )
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Items without children — direct link */
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3.5 text-base font-semibold rounded-md transition-colors',
                        isNavActive(pathname, item.href, false)
                          ? 'text-brand bg-brand-50'
                          : 'text-primary-700 hover:bg-surface-100'
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4 text-slate-400" />}
                      {item.label}
                      {item.badge && (
                        <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-400 text-slate-900 rounded-full uppercase leading-none">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              );
            })}

            <div className="mt-6 px-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">Sign In As</p>

              {/* Mobile: Clients */}
              <a
                href="https://trustner.investwell.app/app/#/login"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Client Login</p>
                  <p className="text-[11px] text-slate-400">Portfolio & investments</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300" />
              </a>

              {/* Mobile: Employees */}
              <Link
                href="/admin/login"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Employee Login</p>
                  <p className="text-[11px] text-slate-400">MIS & incentive dashboard</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>

              {/* Mobile: Partners */}
              <Link
                href="/partner/login"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 text-amber-600">
                  <Handshake className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Partner Login</p>
                  <p className="text-[11px] text-slate-400">POSP / Sub-broker / Referral</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>

              {/* Mobile: Sign Up CTA */}
              <a
                href="https://trustner.investwell.app/app/#/kycOnBoarding/mobileSignUp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 mt-2 rounded-full text-sm font-bold bg-[#4A7CB5] text-white hover:bg-[#3D6A9E] transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                New Client? Sign Up Free
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
