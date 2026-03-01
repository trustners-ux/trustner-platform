"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Search,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS, type NavItem } from "@/lib/constants/nav-links";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/store/auth-store";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.96,
    transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.98,
    transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
  },
};

const mobileMenuVariants = {
  hidden: {
    x: "100%",
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  visible: {
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

const accordionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const childFadeUp = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

// ---------------------------------------------------------------------------
// Desktop dropdown item
// ---------------------------------------------------------------------------

function DropdownItem({
  child,
  onClose,
}: {
  child: NavItem;
  onClose: () => void;
}) {
  return (
    <motion.div variants={childFadeUp}>
      <Link
        href={child.href}
        className={cn(
          "group flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-all duration-200",
          "text-gray-600 hover:bg-primary-50/80 hover:text-primary-500"
        )}
        onClick={onClose}
      >
        <span className="font-medium">{child.label}</span>
        <span className="flex items-center gap-2">
          {child.badge && (
            <span className="rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
              {child.badge}
            </span>
          )}
          <ChevronRight
            size={14}
            className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-50"
          />
        </span>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Desktop nav item with dropdown
// ---------------------------------------------------------------------------

function DesktopNavItem({
  item,
  isActive,
  pathname,
}: {
  item: NavItem;
  isActive: boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (item.children) setOpen(true);
  }, [item.children]);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isCurrentPath = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={item.href}
        className={cn(
          "relative flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
          isCurrentPath
            ? "text-primary-500"
            : "text-gray-600 hover:text-primary-500"
        )}
      >
        {item.label}
        {item.children && (
          <ChevronDown
            size={14}
            className={cn(
              "ml-0.5 transition-transform duration-200",
              open ? "rotate-180 text-primary-500" : "opacity-50"
            )}
          />
        )}
        {/* Active indicator dot */}
        {isCurrentPath && (
          <motion.span
            layoutId="nav-active"
            className="absolute -bottom-0.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-primary-500"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </Link>

      {/* Dropdown */}
      {item.children && (
        <AnimatePresence>
          {open && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2",
                "min-w-[240px]"
              )}
            >
              <motion.div
                variants={staggerChildren}
                initial="hidden"
                animate="visible"
                className={cn(
                  "rounded-xl border border-gray-100/80 bg-white p-2",
                  "shadow-dropdown"
                )}
              >
                {/* Dropdown header */}
                <div className="mb-1 border-b border-gray-50 px-3.5 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {item.label}
                  </span>
                </div>

                {item.children.map((child) => (
                  <DropdownItem
                    key={child.href}
                    child={child}
                    onClose={() => setOpen(false)}
                  />
                ))}

                {/* View all link */}
                <div className="mt-1 border-t border-gray-50 pt-2">
                  <Link
                    href={item.href}
                    className="group flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-primary-500 transition-colors hover:bg-primary-50/60"
                    onClick={() => setOpen(false)}
                  >
                    View all {item.label}
                    <ArrowRight
                      size={12}
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile accordion nav item
// ---------------------------------------------------------------------------

function MobileAccordionItem({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className="flex items-center rounded-xl px-4 py-3.5 text-base font-semibold text-gray-800 transition-colors hover:bg-gray-50"
        onClick={onClose}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-colors",
          expanded
            ? "bg-primary-50/60 text-primary-500"
            : "text-gray-800 hover:bg-gray-50"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <span>{item.label}</span>
        <ChevronDown
          size={18}
          className={cn(
            "transition-transform duration-300",
            expanded && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            variants={accordionVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-2 pl-4 pr-2 pt-1">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-primary-50/60 hover:text-primary-500"
                  onClick={onClose}
                >
                  <span>{child.label}</span>
                  {child.badge && (
                    <span className="rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                      {child.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header auth button — shows Login or user phone + Sign Out
// ---------------------------------------------------------------------------

function HeaderAuthButton() {
  const { user } = useAuthStore();

  if (user) {
    const phone = user.phone;
    const display = phone ? `+91 ****${phone.slice(-4)}` : (user.email || "Account");

    return (
      <div className="hidden items-center gap-2 sm:flex">
        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          {display}
        </span>
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className={cn(
        "hidden items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 sm:flex",
        "bg-gradient-to-r from-primary-500 to-primary-600",
        "shadow-sm hover:shadow-glow-blue hover:brightness-110",
        "active:scale-[0.98]"
      )}
    >
      Start Investing
      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main Header component
// ---------------------------------------------------------------------------

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    handleScroll(); // check on mount
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-gray-200/60 bg-white/80 shadow-md backdrop-blur-xl"
          : "border-transparent bg-white/80 backdrop-blur-xl"
      )}
    >
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between lg:h-[68px]">
          {/* ---------------------------------------------------------- */}
          {/* Logo */}
          {/* ---------------------------------------------------------- */}
          <Link href="/" className="group flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                "bg-gradient-to-br from-primary-500 to-secondary-500",
                "shadow-sm transition-shadow duration-300 group-hover:shadow-glow-blue"
              )}
            >
              <TrendingUp size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight text-primary-700">
                Trustner
              </span>
              <span className="-mt-0.5 text-[10px] font-medium tracking-wide text-gray-400">
                Investments & Insurance
              </span>
            </div>
          </Link>

          {/* ---------------------------------------------------------- */}
          {/* Desktop Navigation - Center */}
          {/* ---------------------------------------------------------- */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_LINKS.map((item) => (
              <DesktopNavItem
                key={item.label}
                item={item}
                isActive={
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/")
                }
                pathname={pathname}
              />
            ))}
          </nav>

          {/* ---------------------------------------------------------- */}
          {/* Right Actions */}
          {/* ---------------------------------------------------------- */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              type="button"
              className={cn(
                "hidden items-center justify-center rounded-lg p-2 transition-all duration-200 sm:flex",
                "text-gray-400 hover:bg-gray-100/60 hover:text-primary-500"
              )}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Auth indicator / CTA */}
            <HeaderAuthButton />

            {/* Mobile hamburger */}
            <button
              type="button"
              className={cn(
                "flex items-center justify-center rounded-lg p-2 transition-colors duration-200 lg:hidden",
                "text-gray-600 hover:bg-gray-100/60 hover:text-primary-500"
              )}
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Mobile Menu - Full-screen slide-in drawer from right */}
      {/* ------------------------------------------------------------ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col bg-white shadow-modal lg:hidden"
              )}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <Link
                  href="/"
                  className="flex items-center gap-2.5"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
                    <TrendingUp size={17} className="text-white" />
                  </div>
                  <span className="text-lg font-bold text-primary-700">
                    Trustner
                  </span>
                </Link>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Navigation links */}
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-1">
                  {NAV_LINKS.map((item) => (
                    <MobileAccordionItem
                      key={item.label}
                      item={item}
                      onClose={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="border-t border-gray-100 p-5">
                <Link
                  href="/contact"
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200",
                    "bg-gradient-to-r from-primary-500 to-primary-600",
                    "shadow-sm hover:shadow-glow-blue hover:brightness-110",
                    "active:scale-[0.98]"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  Start Investing
                  <ArrowRight size={16} />
                </Link>
                <p className="mt-3 text-center text-xs text-gray-400">
                  Free account &middot; No hidden charges
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
