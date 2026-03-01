"use client";

import { useAuth } from "@/hooks/useAuth";
import { Shield, Lock } from "lucide-react";

export default function AuthStatusBadge() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const phone = user?.phone;
    const maskedPhone = phone
      ? `+91 ${phone.slice(-10, -4)}****${phone.slice(-2)}`
      : "Verified";

    return (
      <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:flex">
        <Shield size={12} />
        {maskedPhone}
      </span>
    );
  }

  return (
    <span className="hidden items-center gap-1.5 text-xs text-gray-400 sm:flex">
      <Lock size={12} />
      Your data stays on your device
    </span>
  );
}
