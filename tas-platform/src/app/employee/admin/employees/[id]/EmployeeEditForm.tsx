"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateEmployee } from "@/lib/auth/admin-actions";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { Employee, UserRole } from "@/types/employee";

const editSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  date_of_joining: z.string().optional(),
  role: z.enum(["admin", "hr_head", "management", "employee"]),
  is_active: z.boolean(),
});

type EditForm = z.infer<typeof editSchema>;

export default function EmployeeEditForm({
  employee,
  isAdmin,
}: {
  employee: Employee;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      full_name: employee.full_name,
      phone: employee.phone || "",
      designation: employee.designation || "",
      department: employee.department || "",
      date_of_joining: employee.date_of_joining || "",
      role: employee.role,
      is_active: employee.is_active,
    },
  });

  const roles: UserRole[] = ["admin", "hr_head", "management", "employee"];

  async function onSubmit(data: EditForm) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await updateEmployee(employee.id, {
      full_name: data.full_name,
      phone: data.phone || undefined,
      designation: data.designation || undefined,
      department: data.department || undefined,
      date_of_joining: data.date_of_joining || undefined,
      role: data.role as UserRole,
      is_active: data.is_active,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setIsSubmitting(false);
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">
        Edit Employee
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Full Name
            </label>
            <input
              {...register("full_name")}
              type="text"
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

          {/* Role (admin only) */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Role {!isAdmin && "(Admin only)"}
            </label>
            <select
              {...register("role")}
              disabled={!isAdmin}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50 disabled:opacity-50"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 sm:col-span-2">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                {...register("is_active")}
                type="checkbox"
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </label>
            <span className="text-sm font-medium text-gray-700">
              Active Employee
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-600">
            Employee updated successfully.
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
