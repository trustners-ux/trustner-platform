'use client';

import { ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
}: SelectInputProps) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-negative ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none px-4 py-3 pr-10 rounded-xl border bg-white text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 ${
            value
              ? 'text-primary-700 border-surface-300'
              : 'text-slate-400 border-surface-300'
          }`}
        >
          <option value="" disabled className="text-slate-400">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}{opt.description ? ` — ${opt.description}` : ''}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
