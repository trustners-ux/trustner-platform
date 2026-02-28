import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Financial Planner - Free Comprehensive Financial Plan | Trustner",
  description:
    "Get a CFP-quality financial plan in 15 minutes. Free. No registration. Covers net worth, insurance gaps, goal planning, tax optimization, and asset allocation.",
};

export default function AIPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Minimal header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="container-custom flex h-14 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-extrabold text-gray-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500">
              <span className="text-sm font-black text-white">T</span>
            </div>
            Trustner
            <span className="rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
              AI Planner
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-400 sm:block">
              Your data stays on your device
            </span>
            <Link
              href="/calculators"
              className="text-xs font-medium text-gray-500 transition hover:text-gray-900"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
