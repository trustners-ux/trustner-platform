"use client";

import { formatIndianNumber } from "@/lib/utils/formatters";

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  prefix?: string;
  accentClass?: string;
  helpText?: string;
}

export default function CurrencyInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1000,
  suffix,
  prefix = "₹",
  accentClass = "accent-primary-500",
  helpText,
}: CurrencyInputProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <label className="text-sm font-bold text-gray-700">{label}</label>
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
          {prefix && (
            <span className="mr-1 text-sm text-gray-400">{prefix}</span>
          )}
          <input
            type="number"
            value={value}
            onChange={(e) =>
              onChange(Math.max(min, Math.min(max, Number(e.target.value))))
            }
            className="w-24 bg-transparent text-right text-sm font-bold text-gray-900 outline-none"
          />
          {suffix && (
            <span className="ml-1 text-sm text-gray-400">{suffix}</span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${accentClass}`}
      />
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>
          {prefix}
          {formatIndianNumber(min)}
        </span>
        <span>
          {prefix}
          {formatIndianNumber(max)}
        </span>
      </div>
      {helpText && (
        <p className="mt-1 text-[11px] text-gray-400">{helpText}</p>
      )}
    </div>
  );
}
