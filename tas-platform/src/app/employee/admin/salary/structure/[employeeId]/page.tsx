"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calculator, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createSalaryStructure } from "@/lib/auth/salary-actions";
import { autoCalculateStructure } from "@/lib/utils/salary-calculator";
import type { Employee, SalaryStructure } from "@/types/employee";

export default function SalaryStructurePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.employeeId as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [existing, setExisting] = useState<SalaryStructure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [ctcAnnual, setCtcAnnual] = useState(0);
  const [basic, setBasic] = useState(0);
  const [hra, setHra] = useState(0);
  const [da, setDa] = useState(0);
  const [conveyance, setConveyance] = useState(0);
  const [medical, setMedical] = useState(0);
  const [special, setSpecial] = useState(0);
  const [pfEmp, setPfEmp] = useState(0);
  const [pfEr, setPfEr] = useState(0);
  const [esiEmp, setEsiEmp] = useState(0);
  const [esiEr, setEsiEr] = useState(0);
  const [pt, setPt] = useState(0);
  const [tds, setTds] = useState(0);
  const [lwfEmp, setLwfEmp] = useState(0);
  const [lwfEr, setLwfEr] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: emp } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();

      if (emp) setEmployee(emp as Employee);

      const { data: structure } = await supabase
        .from("salary_structures")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("is_active", true)
        .single();

      if (structure) {
        const s = structure as SalaryStructure;
        setExisting(s);
        setCtcAnnual(s.ctc_annual);
        setBasic(s.basic);
        setHra(s.hra);
        setDa(s.dearness_allowance);
        setConveyance(s.conveyance);
        setMedical(s.medical_allowance);
        setSpecial(s.special_allowance);
        setPfEmp(s.pf_employee);
        setPfEr(s.pf_employer);
        setEsiEmp(s.esi_employee);
        setEsiEr(s.esi_employer);
        setPt(s.professional_tax);
        setTds(s.tds_monthly);
        setLwfEmp(s.lwf_employee);
        setLwfEr(s.lwf_employer);
        setEffectiveFrom(s.effective_from);
      }
    }
    fetchData();
  }, [employeeId]);

  function handleQuickCalculate() {
    if (ctcAnnual <= 0) return;
    const calc = autoCalculateStructure(ctcAnnual);
    setBasic(calc.basic);
    setHra(calc.hra);
    setDa(calc.dearness_allowance);
    setConveyance(calc.conveyance);
    setMedical(calc.medical_allowance);
    setSpecial(calc.special_allowance);
    setPfEmp(calc.pf_employee);
    setPfEr(calc.pf_employer);
    setEsiEmp(calc.esi_employee);
    setEsiEr(calc.esi_employer);
    setPt(calc.professional_tax);
    setTds(calc.tds_monthly);
    setLwfEmp(calc.lwf_employee);
    setLwfEr(calc.lwf_employer);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createSalaryStructure({
      employee_id: employeeId,
      effective_from: effectiveFrom,
      ctc_annual: ctcAnnual,
      basic,
      hra,
      dearness_allowance: da,
      conveyance,
      medical_allowance: medical,
      special_allowance: special,
      pf_employee: pfEmp,
      pf_employer: pfEr,
      esi_employee: esiEmp,
      esi_employer: esiEr,
      professional_tax: pt,
      tds_monthly: tds,
      lwf_employee: lwfEmp,
      lwf_employer: lwfEr,
    });

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push("/employee/admin/salary");
    }
  }

  const grossMonthly = basic + hra + da + conveyance + medical + special;
  const totalDeductions = pfEmp + esiEmp + pt + tds + lwfEmp;
  const netPay = grossMonthly - totalDeductions;

  function numField(
    label: string,
    value: number,
    setter: (v: number) => void
  ) {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">
          {label}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setter(Number(e.target.value))}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/employee/admin/salary"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 transition hover:bg-gray-50"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {existing ? "Edit" : "Set Up"} Salary Structure
          </h1>
          <p className="text-sm text-gray-500">
            {employee?.full_name || "Loading..."} —{" "}
            {employee?.designation || ""}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CTC and Quick Calculate */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-900">
            Annual CTC
          </h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                CTC (Annual) *
              </label>
              <input
                type="number"
                required
                value={ctcAnnual || ""}
                onChange={(e) => setCtcAnnual(Number(e.target.value))}
                placeholder="e.g. 600000"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-gray-700">
                Effective From *
              </label>
              <input
                type="date"
                required
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-50"
              />
            </div>
            <button
              type="button"
              onClick={handleQuickCalculate}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              <Sparkles size={16} />
              Quick Calculate
            </button>
          </div>
        </div>

        {/* Earnings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-900">
            Monthly Earnings
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {numField("Basic *", basic, setBasic)}
            {numField("HRA", hra, setHra)}
            {numField("Dearness Allowance", da, setDa)}
            {numField("Conveyance", conveyance, setConveyance)}
            {numField("Medical Allowance", medical, setMedical)}
            {numField("Special Allowance", special, setSpecial)}
          </div>
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-right">
            <span className="text-sm font-bold text-green-700">
              Gross Monthly: INR{" "}
              {grossMonthly.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Deductions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-900">
            Monthly Deductions
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {numField("PF (Employee 12%)", pfEmp, setPfEmp)}
            {numField("PF (Employer 12%)", pfEr, setPfEr)}
            {numField("ESI (Employee 0.75%)", esiEmp, setEsiEmp)}
            {numField("ESI (Employer 3.25%)", esiEr, setEsiEr)}
            {numField("Professional Tax", pt, setPt)}
            {numField("TDS / Income Tax", tds, setTds)}
            {numField("LWF (Employee)", lwfEmp, setLwfEmp)}
            {numField("LWF (Employer)", lwfEr, setLwfEr)}
          </div>
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-right">
            <span className="text-sm font-bold text-red-700">
              Total Deductions: INR{" "}
              {totalDeductions.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Net Pay Summary */}
        <div className="rounded-2xl border-2 border-primary-200 bg-primary-50 p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Estimated Net Pay (Monthly)</p>
            <p className="mt-1 text-3xl font-bold text-primary-700">
              INR {netPay.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/employee/admin/salary"
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
                Saving...
              </>
            ) : (
              <>
                <Calculator size={16} />
                Save Structure
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
