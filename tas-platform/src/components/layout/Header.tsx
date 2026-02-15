"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  LogIn,
  TrendingUp,
  Shield,
  PieChart,
  Calculator,
  BookOpen,
  Search,
} from "lucide-react";
import { NAV_LINKS } from "@/lib/constants/nav-links";
import { cn } from "@/lib/utils/cn";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const iconMap: Record<string, React.ReactNode> = {
    "Mutual Funds": <TrendingUp size={18} />,
    Insurance: <Shield size={18} />,
    Investments: <PieChart size={18} />,
    Calculators: <Calculator size={18} />,
    Blog: <BookOpen size={18} />,
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-primary">Trustner</span>
              <span className="-mt-1 block text-[10px] font-medium text-gray-400">
                Investments & Insurance
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() =>
                  item.children && setActiveDropdown(item.label)
                }
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition",
                    "text-gray-600 hover:bg-gray-50 hover:text-primary-500"
                  )}
                >
                  {iconMap[item.label]}
                  {item.label}
                  {item.children && <ChevronDown size={14} className="ml-0.5 opacity-50" />}
                </Link>

                {/* Dropdown */}
                {item.children && activeDropdown === item.label && (
                  <div className="absolute left-0 top-full z-50 min-w-[220px] animate-fade-in rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 transition hover:bg-primary-50 hover:text-primary-500"
                        onClick={() => setActiveDropdown(null)}
                      >
                        {child.label}
                        {child.badge && (
                          <span className="rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-bold text-accent">
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button className="hidden rounded-lg p-2 text-gray-400 transition hover:bg-gray-50 hover:text-primary-500 sm:flex">
              <Search size={20} />
            </button>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-600"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Login</span>
            </Link>
            <button
              className="rounded-lg p-2 text-gray-600 lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <div className="container-custom space-y-1 py-4">
            {NAV_LINKS.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {iconMap[item.label]}
                  {item.label}
                </Link>
                {item.children && (
                  <div className="ml-10 space-y-0.5 pb-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-primary-500"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
