"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createEmployee } from "@/lib/auth/admin-actions";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { UserRole } from "@/types/employee";

const newEmployeeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  date_of_joining: z.string().optional(),
  role: z.enum(["admin", "hr_head", "management", "employee"]),
});

type NewEmployeeForm = z.infer<typeof newEmployeeSchema>;

export default function NewEmployeePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewEmployeeForm>({
    resolver: zodResolver(newEmployeeSchema),
    defaultValues: {
      role: "employee",
    },
  });

  async function onSubmit(data: NewEmployeeForm) {
    setIsSubmitting(true);
    setError(null);

    const result = await createEmployee({
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      designation: data.designation,
      department: data.department,
      date_of_joining: data.date_of_joining,
      role: data.role as UserRole,
    });

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push("/employee/admin/employees");
    }
  }

  const roles: UserRole[] = ["admin", "hr_head", "management", "employee"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/employee/admin/employees"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add New Employee</h1>
          <p className="text-sm text-gray-500">
            Create a new employee account with default password
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Email Address *
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="employee@trustner.in"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Full Name *
              </label>
              <input
                {...register("full_name")}
                type="text"
                placeholder="John Doe"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Phone
              </label>
              <input
                {...register("phone")}
                type="tel"
                placeholder="+91 9876543210"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Designation
              </label>
              <input
                {...register("designation")}
                type="text"
                placeholder="e.g. Software Engineer"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
            </div>

            {/* Department */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Department
              </label>
              <input
                {...register("department")}
                type="text"
                placeholder="e.g. Engineering"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
            </div>

            {/* Date of Joining */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Date of Joining
              </label>
              <input
                {...register("date_of_joining")}
                type="date"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Role *
              </label>
              <select
                {...register("role")}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.role.message}
                </p>
              )}
            </div>
          </div>

          {/* Info notice */}
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-blue-700">
              The employee will be created with the default password{" "}
              <strong>Trustner@2025</strong>. They should change it upon first
              login.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/employee/admin/employees"
              className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Employee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
