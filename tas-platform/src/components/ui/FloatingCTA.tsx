"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Phone, FileText, TrendingUp } from "lucide-react";
import { COMPANY } from "@/lib/constants/company";

export default function FloatingCTA() {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappUrl = `https://wa.me/${COMPANY.contact.whatsapp.replace(/[^0-9]/g, "")}?text=Hi%20Trustner,%20I%20would%20like%20to%20know%20more%20about%20investment%20options.`;

  return (
    <>
      {/* Quick Action Menu */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 animate-slide-up sm:right-6">
          <div className="w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-elevated">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-4 text-white">
              <h4 className="text-sm font-bold">How can we help?</h4>
              <p className="text-[11px] text-white/70">Choose an option below</p>
            </div>
            <div className="p-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-green-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500 text-white">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">WhatsApp Us</p>
                  <p className="text-[11px] text-gray-400">Quick chat support</p>
                </div>
              </a>
              <a
                href={`tel:${COMPANY.contact.phone}`}
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-blue-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Call Us</p>
                  <p className="text-[11px] text-gray-400">{COMPANY.contact.phone}</p>
                </div>
              </a>
              <Link
                href="/risk-profile"
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-amber-50"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Risk Profile Quiz</p>
                  <p className="text-[11px] text-gray-400">Find your investor type</p>
                </div>
              </Link>
              <Link
                href="/mutual-funds"
                className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-emerald-50"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Explore Funds</p>
                  <p className="text-[11px] text-gray-400">5000+ mutual funds</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 transition-all hover:bg-green-600 hover:shadow-xl hover:shadow-green-500/40 active:scale-95 sm:right-6"
        aria-label={isOpen ? "Close help menu" : "Open help menu"}
      >
        {isOpen ? (
          <X size={22} className="transition-transform" />
        ) : (
          <MessageCircle size={22} className="transition-transform" />
        )}
      </button>
    </>
  );
}
