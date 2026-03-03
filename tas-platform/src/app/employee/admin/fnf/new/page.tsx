"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { createFnFSettlement } from "@/lib/auth/admin-actions";
import type { Employee } from "@/types/employee";

const schema = z.object({
  employee_id: z.string().min(1, "Select an employee"),
  last_working_date: z.string().min(1, "Required"),
  resignation_date: z.string().optional(),
  basic_salary: z.coerce.number().min(0).optional(),
  earned_leave_balance: z.coerce.number().min(0).optional(),
  leave_encashment: z.coerce.number().min(0).optional(),
  gratuity: z.coerce.number().min(0).optional(),
  bonus: z.coerce.number().min(0).optional(),
  deductions: z.coerce.number().min(0).optional(),
  deduction_notes: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewFnFPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchFields = watch(["basic_salary", "leave_encashment", "gratuity", "bonus", "deductions"]);
  const netPayable = (watchFields[0] || 0) + (watchFields[1] || 0) + (watchFields[2] || 0) + (watchFields[3] || 0) - (watchFields[4] || 0);

  useEffect(() => {
    async function fetchEmployees() {
      const supabase = createClient();
      const { data } = await supabase.from("employees").select("id, full_name, email, designation").eq("is_active", true);
      if (data) setEmployees(data as Employee[]);
    }
    fetchEmployees();
  }, []);

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    const result = await createFnFSettlement({ ...data, net_payable: netPayable });
    if (result?.error) {
      alert(result.error);
      setIsLoading(false);
    } else {
      router.push("/employee/admin/fnf");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employee/admin/fnf" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New F&F Settlement</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          {/* Employee */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Employee</label>
            <select {...register("employee_id")} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50">
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.email})</option>
              ))}
            </select>
            {errors.employee_id && <p className="mt-1 text-xs text-red-500">{errors.employee_id.message}</p>}
          </div>

          {/* Dates */}
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Last Working Date</label>
              <input type="date" {...register("last_working_date")} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
              {errors.last_working_date && <p className="mt-1 text-xs text-red-500">{errors.last_working_date.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Resignation Date</label>
              <input type="date" {...register("resignation_date")} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50" />
            </div>
          </div>

          {/* Salary Components */}
          <h3 className="text-sm font-bold text-gray-900">Salary Components</h3>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { label: "Basic Salary", name: "basic_salary" as const },
              { label: "Leave Encashment", name: "leave_encashment" as const },
              { label: "Gratuity", name: "gratuity" as const },
              { label: "Bonus", name: "bonus" as const },
            ].map((field) => (
              <div key={field.name}>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">{field.label}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                  <input type="number" {...register(field.name)} className="w-full rounded-xl border border-gray-200 py-3 pl-8 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50" placeholder="0" />
                </div>
              </div>
            ))}
          </div>

          {/* Deductions */}
          <h3 className="text-sm font-bold text-gray-900">Deductions</h3>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Deduction Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <input type="number" {...register("deductions")} className="w-full rounded-xl border border-gray-200 py-3 pl-8 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Deduction Notes</label>
              <input {...register("deduction_notes")} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50" placeholder="Reason for deductions" />
            </div>
          </div>

          {/* Earned Leave Balance */}
          <div className="md:w-1/2">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Earned Leave Balance (days)</label>
            <input type="number" step="0.5" {...register("earned_leave_balance")} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50" placeholder="0" />
          </div>

          {/* Net Payable */}
          <div className="rounded-xl bg-green-50 p-5">
            <p className="text-sm font-semibold text-green-700">Net Payable</p>
            <p className="text-2xl font-bold text-green-900">₹{netPayable.toLocaleString("en-IN")}</p>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Notes</label>
            <textarea {...register("notes")} rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50" placeholder="Additional notes..." />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link href="/employee/admin/fnf" className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60">
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Create Settlement
          </button>
        </div>
      </form>
    </div>
  );
}
