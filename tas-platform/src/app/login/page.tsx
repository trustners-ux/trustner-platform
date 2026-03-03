"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Shield,
  ArrowRight,
  Briefcase,
  Users,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { REGULATORY } from "@/lib/constants/regulatory";
import { signIn } from "@/lib/auth/actions";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    setError(null);
    const result = await signIn(data.email, data.password);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-100 via-white to-primary-50 px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary shadow-lg">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome to Trustner
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose how you&apos;d like to sign in
          </p>
        </div>

        {/* Two Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Client Login Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-trustBlue/5 transition-transform group-hover:scale-150" />
            <div className="relative">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-trustBlue/10">
                <Briefcase size={24} className="text-trustBlue" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                Client Login
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-500">
                Access your investment portfolio, track mutual fund performance,
                and manage your financial goals.
              </p>
              <ul className="mb-8 space-y-2.5 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-trustBlue" />
                  View portfolio & NAV updates
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-trustBlue" />
                  Track SIP & transactions
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-trustBlue" />
                  Download statements & reports
                </li>
              </ul>
              <a
                href={
                  process.env.NEXT_PUBLIC_INVESTWELL_LOGIN_URL ||
                  "https://wealth.investwell.app"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-trustBlue py-3.5 text-sm font-bold text-white transition hover:bg-trustBlue/90"
              >
                Sign In
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Employee Login Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all hover:shadow-xl">
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary-500/5 transition-transform group-hover:scale-150" />
            <div className="relative">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10">
                <Users size={24} className="text-primary-500" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                Employee Login
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-500">
                Access the employee portal for documents, announcements, leave
                management, and more.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="you@trustner.in"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-11 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition hover:bg-primary-600 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 space-y-3 text-center">
          <div className="mx-auto max-w-md rounded-lg bg-blue-50/50 p-3 text-xs text-blue-700">
            <div className="flex items-start justify-center gap-2">
              <Shield size={14} className="mt-0.5 flex-shrink-0" />
              <p>{REGULATORY.KYC_NOTICE.substring(0, 120)}...</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="text-primary-500 hover:underline"
            >
              Terms
            </Link>{" "}
            &{" "}
            <Link
              href="/privacy-policy"
              className="text-primary-500 hover:underline"
            >
              Privacy Policy
            </Link>
          </p>
          <p className="text-[11px] text-gray-400">
            {REGULATORY.AMFI_ARN} | {REGULATORY.MF_ENTITY}
          </p>
        </div>
      </div>
    </div>
  );
}
