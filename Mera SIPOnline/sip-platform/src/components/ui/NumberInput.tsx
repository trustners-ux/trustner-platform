'use client';

import { useState } from 'react';
import { formatNumber } from '@/lib/utils/formatters';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
}

export default function NumberInput({
  label, value, onChange, prefix, suffix, step = 1, min, max, hint,
}: NumberInputProps) {
  const [rawText, setRawText] = useState<string | null>(null);
  const isEditing = rawText !== null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/,/g, '');
    // Allow empty or partial input while typing
    if (input === '' || input === '-' || input === '.') {
      setRawText(input);
      onChange(0);
      return;
    }
    const num = parseFloat(input);
    if (!isNaN(num)) {
      setRawText(input);
      let clamped = num;
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChange(clamped);
    }
  };

  const handleFocus = () => {
    // Show raw number on focus so user can edit easily
    setRawText(value === 0 ? '' : String(value));
  };

  const handleBlur = () => {
    // Clamp to min on blur and clear raw text
    if (min !== undefined && value < min) {
      onChange(min);
    }
    setRawText(null);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const increment = () => {
    const next = value + step;
    onChange(max !== undefined ? Math.min(max, next) : next);
  };

  const decrement = () => {
    const next = value - step;
    onChange(min !== undefined ? Math.max(min, next) : next);
  };

  // Calculate slider fill percentage for styling
  const sliderMin = min ?? 0;
  const fillPercent = max !== undefined
    ? ((value - sliderMin) / (max - sliderMin)) * 100
    : 50;

  // Display: raw text while editing, formatted number otherwise
  const displayValue = isEditing ? (rawText ?? '') : formatNumber(value);

  return (
    <div>
      {label && <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">{label}</label>}
      <div className="flex items-center border border-surface-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-brand-300 focus-within:border-brand-400 transition-all">
        {prefix && <span className="pl-3 pr-1 text-sm text-slate-400 select-none">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 py-3 px-2 text-base font-semibold text-primary-700 bg-transparent outline-none min-w-0 leading-normal"
        />
        {suffix && <span className="pr-2 text-sm text-slate-400 select-none whitespace-nowrap">{suffix}</span>}
        <div className="flex flex-col border-l border-surface-300 rounded-r-xl overflow-hidden">
          <button type="button" onClick={increment} className="px-2 py-0.5 text-slate-400 hover:text-brand hover:bg-brand-50 transition-colors text-xs leading-none">&#9650;</button>
          <button type="button" onClick={decrement} className="px-2 py-0.5 text-slate-400 hover:text-brand hover:bg-brand-50 transition-colors text-xs leading-none border-t border-surface-200">&#9660;</button>
        </div>
      </div>
      {/* Range slider */}
      {min !== undefined && max !== undefined && (
        <div className="mt-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            className="slider-input w-full"
            style={{
              background: `linear-gradient(to right, #0F766E ${fillPercent}%, #E2E8F0 ${fillPercent}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>{prefix || ''}{formatNumber(min)}{suffix ? ` ${suffix}` : ''}</span>
            <span>{prefix || ''}{formatNumber(max)}{suffix ? ` ${suffix}` : ''}</span>
          </div>
        </div>
      )}
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
