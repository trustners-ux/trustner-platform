"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, User } from "lucide-react";
import { useFinancialPlanStore } from "@/store/financial-plan-store";
import type { PersonalProfile } from "@/types/financial-plan";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

const MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const;

const CITY_OPTIONS = [
  { value: "metro", label: "Metro", desc: "Mumbai, Delhi, Bangalore, etc." },
  { value: "tier1", label: "Tier 1", desc: "Pune, Ahmedabad, Jaipur, etc." },
  { value: "tier2", label: "Tier 2", desc: "Guwahati, Indore, Bhopal, etc." },
  { value: "tier3", label: "Tier 3", desc: "Smaller cities & towns" },
] as const;

const OCCUPATION_OPTIONS = [
  { value: "salaried", label: "Salaried" },
  { value: "self-employed", label: "Self Employed" },
  { value: "business", label: "Business Owner" },
  { value: "professional", label: "Professional" },
  { value: "retired", label: "Retired" },
  { value: "homemaker", label: "Homemaker" },
] as const;

export default function PersonalStep({ onNext, onPrev }: Props) {
  const { plan, setPersonal } = useFinancialPlanStore();

  const [form, setForm] = useState<PersonalProfile>({
    name: plan.personal?.name || "",
    age: plan.personal?.age || 30,
    gender: plan.personal?.gender || "male",
    maritalStatus: plan.personal?.maritalStatus || "married",
    dependents: plan.personal?.dependents || 2,
    city: plan.personal?.city || "tier2",
    occupation: plan.personal?.occupation || "salaried",
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    setPersonal(form);
    onNext();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <User size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Tell us about yourself
          </h2>
          <p className="text-sm text-gray-500">
            Basic information to personalize your plan
          </p>
        </div>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 lg:p-8">
        {/* Name */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Your Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter your name"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Age */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-bold text-gray-700">Your Age</label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
              <input
                type="number"
                value={form.age}
                onChange={(e) =>
                  setForm({
                    ...form,
                    age: Math.max(18, Math.min(80, Number(e.target.value))),
                  })
                }
                className="w-12 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
              />
              <span className="ml-1 text-sm text-gray-400">yrs</span>
            </div>
          </div>
          <input
            type="range"
            min={18}
            max={80}
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            className="w-full accent-primary-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>18</span>
            <span>80</span>
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Gender
          </label>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, gender: opt.value })}
                className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                  form.gender === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Marital Status */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Marital Status
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MARITAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, maritalStatus: opt.value })}
                className={`rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                  form.maritalStatus === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dependents */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-bold text-gray-700">
              Number of Dependents
            </label>
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-bold text-gray-900">
              {form.dependents}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            value={form.dependents}
            onChange={(e) =>
              setForm({ ...form, dependents: Number(e.target.value) })
            }
            className="w-full accent-primary-500"
          />
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>0</span>
            <span>8</span>
          </div>
        </div>

        {/* City Tier */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            City Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, city: opt.value })}
                className={`rounded-xl border-2 p-3 text-left transition ${
                  form.city === opt.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}
              >
                <p
                  className={`text-sm font-bold ${form.city === opt.value ? "text-blue-700" : "text-gray-700"}`}
                >
                  {opt.label}
                </p>
                <p className="text-[11px] text-gray-400">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Occupation */}
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Occupation
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {OCCUPATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm({ ...form, occupation: opt.value })}
                className={`rounded-xl border-2 py-2.5 text-sm font-bold transition ${
                  form.occupation === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!form.name.trim()}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          Next: Income <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
